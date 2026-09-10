"use client";

import { useTransition, useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bulkUpdateProductVisibility,
  syncSingleProductStatusFromGoogle,
  syncLiveProductStatuses,
  cleanupStaleGoogleProducts,
  getGoogleMCStats,
} from "@/app/actions/backend/marketing/gmc-product-sync.actions";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface GoogleIssue {
  code?: string;
  // Merchant API আসল ফিল্ড: severity / attribute / reportingContext।
  // পুরনো ফিল্ড নামগুলোও (servability/attributeName/destination) fallback হিসেবে রাখা।
  severity?: string;
  servability?: string;
  resolution?: string;
  attribute?: string;
  attributeName?: string;
  reportingContext?: string;
  destination?: string;
  description?: string;
  detail?: string;
  documentation?: string;
  applicableCountries?: string[];
  // dedupeIssues() যোগ করে — একই issue যেসব context-এ এসেছে
  contexts?: string[];
}

interface SyncLog {
  id: string;
  status: "SYNCED" | "FAILED" | "PENDING" | "EXCLUDED";
  errorMessage: string | null;
  googleIssues: unknown;
  lastSyncedAt: string | null;
  product: { id: string; name: string; slug: string; featuredImage: string | null; sku: string | null; productType?: string; variantCount?: number };
}

interface Props {
  syncLogs: SyncLog[];
  totalProducts: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function parseGoogleIssues(raw: unknown): GoogleIssue[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) return parsed as GoogleIssue[];
    if (typeof parsed === "object" && parsed !== null) return [parsed as GoogleIssue];
  } catch { /* unparseable */ }
  return [];
}

// Google reportingContext → পড়ার মতো নাম
const CONTEXT_LABEL: Record<string, string> = {
  SHOPPING_ADS: "Shopping ads",
  DISPLAY_ADS: "Display ads",
  FREE_LISTINGS: "Free listings",
  FREE_LOCAL_LISTINGS: "Free local listings",
  LOCAL_INVENTORY_ADS: "Local inventory ads",
  YOUTUBE_SHOPPING: "YouTube Shopping",
  CLOUD_RETAIL: "Cloud Retail",
  LOCAL_CLOUD_RETAIL: "Local Cloud Retail",
};
const ctxLabel = (c?: string) => (c ? CONTEXT_LABEL[c] ?? c.replace(/_/g, " ").toLowerCase() : "");

// Google severity মান: DISAPPROVED / DEMOTED / NOT_IMPACTED / UNAFFECTED / PENDING …
// পুরনো lowercase মানও (disapproved/demoted) ফলব্যাক হিসেবে ম্যাপ করা।
function issueSeverityCfg(raw?: string) {
  const s = (raw ?? "").toUpperCase();
  if (s === "DISAPPROVED" || s === "DEMOTED_PRODUCT" || s === "ERROR") return {
    bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500",
    badge: "bg-red-100 text-red-700", label: "Disapproved",
  };
  if (s === "DEMOTED" || s === "SUGGESTION") return {
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700", label: "Demoted",
  };
  // NOT_IMPACTED / UNAFFECTED / PENDING / (unknown)
  return {
    bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", dot: "bg-yellow-400",
    badge: "bg-yellow-100 text-yellow-700", label: raw && /PENDING/i.test(raw) ? "Pending" : "Warning",
  };
}
const sevRank: Record<string, number> = { Disapproved: 3, Demoted: 2, Pending: 1, Warning: 0 };

// একই issue Google-এ প্রতিটা reportingContext-এর জন্য আলাদা row হিসেবে আসে
// (একটা "Broken image URL" ৭ বার, "Deprecated energy…" ১৯ বার)। code + description
// দিয়ে group করে একটা করে entry বানানো হয়, context গুলো merge করে।
function dedupeIssues(issues: GoogleIssue[]): GoogleIssue[] {
  const map = new Map<string, GoogleIssue & { _ctx: Set<string> }>();
  for (const it of issues) {
    const key = `${it.code ?? ""}|${it.description ?? ""}|${it.attribute ?? it.attributeName ?? ""}`;
    const ctx = it.reportingContext ?? it.destination;
    if (!map.has(key)) map.set(key, { ...it, _ctx: new Set() });
    if (ctx) map.get(key)!._ctx.add(ctx);
  }
  return [...map.values()]
    .map(({ _ctx, ...rest }) => ({ ...rest, contexts: [..._ctx] }))
    .sort((a, b) => {
      const ra = sevRank[issueSeverityCfg(a.severity ?? a.servability).label] ?? 0;
      const rb = sevRank[issueSeverityCfg(b.severity ?? b.servability).label] ?? 0;
      return rb - ra;
    });
}

function smartAction(log: SyncLog, issues: GoogleIssue[]) {
  const combined = issues.map(i => `${i.code ?? ""} ${i.attribute ?? i.attributeName ?? ""} ${i.description ?? ""}`).join(" ").toLowerCase();
  if (combined.includes("color") || combined.includes("size") || combined.includes("category") || combined.includes("mapping") || combined.includes("google_product_category"))
    return { label: "Fix attribute mapping", href: "/admin/marketing/merchant-center?tab=attributes" };
  if (combined.includes("image") || combined.includes("thumbnail"))
    return { label: "Edit product images", href: `/admin/products/create?id=${log.product.id}` };
  if (combined.includes("price") || combined.includes("currency"))
    return { label: "Check product price", href: `/admin/products/create?id=${log.product.id}` };
  if (combined.includes("local") && combined.includes("inventory"))
    return { label: "Inventory verification", href: "https://merchants.google.com/mc/products" };
  return { label: "Edit product", href: `/admin/products/create?id=${log.product.id}` };
}

// ─────────────────────────────────────────────────────────────
// ISSUE LIST — deduped, compact; Google-এর নিজের description + detail দেখায়
// ─────────────────────────────────────────────────────────────
function IssueList({ issues, errorMessage }: { issues: GoogleIssue[]; errorMessage: string | null }) {
  if (issues.length === 0 && !errorMessage) return null;

  if (issues.length === 0) {
    return (
      <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-md">
        <span className="text-red-500 text-[13px] mt-px">✕</span>
        <p className="text-[12px] text-red-700 m-0 leading-relaxed">{errorMessage}</p>
      </div>
    );
  }

  const deduped = dedupeIssues(issues);

  return (
    <div className="rounded-md border border-[#e2e8f0] divide-y divide-[#f1f5f9] overflow-hidden">
      {deduped.map((issue, idx) => {
        const cfg = issueSeverityCfg(issue.severity ?? issue.servability);
        const attr = issue.attribute ?? issue.attributeName;
        const ctxs = (issue.contexts ?? []).map(ctxLabel).filter(Boolean);
        return (
          <div key={idx} className={`${cfg.bg} px-3 py-2.5`}>
            <div className="flex items-start gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
              <div className="min-w-0 flex-1">
                {/* headline: severity + short reason + attribute */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                  <span className={`text-[12px] font-semibold ${cfg.text} leading-snug`}>
                    {issue.description ?? issue.code ?? "Unknown issue"}
                  </span>
                  {attr && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-white border border-[#e2e8f0] text-[#475569] rounded">
                      {attr}
                    </span>
                  )}
                </div>
                {/* Google's own detail text */}
                {issue.detail && (
                  <p className="text-[11px] text-[#64748b] mt-1 leading-relaxed">{issue.detail}</p>
                )}
                {/* affected surfaces + help link */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                  {ctxs.length > 0 && (
                    <span className="text-[10px] text-[#94a3b8]">
                      Affects: {ctxs.slice(0, 3).join(", ")}{ctxs.length > 3 ? ` +${ctxs.length - 3}` : ""}
                    </span>
                  )}
                  {issue.code && <span className="text-[10px] font-mono text-[#cbd5e1]">{issue.code}</span>}
                  {issue.documentation && (
                    <a href={issue.documentation} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-[#2271b1] hover:text-[#135e96] font-semibold inline-flex items-center gap-1">
                      Google help
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function TabProductFeed({ syncLogs, totalProducts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, "SYNCED" | "EXCLUDED">>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [headerAction, setHeaderAction] = useState<string>("");
  // bulk sync progress — client ছোট chunk-এ বারবার server call করে, তাই কতটা
  // হয়েছে দেখানো যায় এবং timeout-এ পুরোটা fail হয় না।
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  // "Issues to Resolve" পুরো সেকশন hide/show — অনেক জায়গা নেয় বলে collapse করা যায়,
  // পছন্দ localStorage-এ মনে রাখা হয়।
  const [issuesCollapsed, setIssuesCollapsed] = useState(false);
  useEffect(() => {
    // hydration mismatch এড়াতে localStorage mount-এর পর পড়া হয় (SSR-এ নেই)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setIssuesCollapsed(localStorage.getItem("gmc-issues-collapsed") === "1"); } catch { /* ignore */ }
  }, []);
  const toggleIssuesSection = () => {
    setIssuesCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("gmc-issues-collapsed", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };
  const [realMCStats, setRealMCStats] = useState<{ totalProducts: number; approved: number; disapproved: number; pending: number } | null>(null);

  const activeCount = syncLogs.filter(l => l.status === "SYNCED" && parseGoogleIssues(l.googleIssues).length === 0).length;
  const disapprovedCount = syncLogs.filter(l => l.status === "FAILED").length;
  const warningCount = syncLogs.filter(l => l.status === "SYNCED" && parseGoogleIssues(l.googleIssues).length > 0).length;
  const notSyncedCount = syncLogs.filter(l => l.status === "PENDING").length;
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Google-এ প্রতিটা variant আলাদা item — তাই "DB Items" = base product নয়,
  // variant-expanded সংখ্যা (Google-এর "Total in MC"-এর সাথে মেলে)।
  const totalFeedItems = syncLogs.reduce(
    (n, l) => n + (l.product.productType === "VARIABLE" && (l.product.variantCount ?? 0) > 0 ? (l.product.variantCount ?? 1) : 1),
    0,
  );

  const toggleExpand = (id: string) =>
    setExpandedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDropdownChange = (productId: string, value: "SYNCED" | "EXCLUDED") => {
    setSuccessMsg(null); setErrorMsg(null);
    setPendingChanges(prev => ({ ...prev, [productId]: value }));
  };

  const handleSelectRow = (id: string, checked: boolean) =>
    setSelectedProductIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));

  const handleSelectAll = (checked: boolean) =>
    setSelectedProductIds(checked ? syncLogs.map(l => l.product.id) : []);

  // client-driven chunked bulk sync — প্রতিটা server call-এ মাত্র কয়েকটা product,
  // তাই Vercel function timeout-এ কাটে না; progress দেখানো যায় এবং একটা chunk
  // fail করলেও বাকিগুলো চলতে থাকে।
  const CLIENT_CHUNK = 4;
  const runChunkedBulk = async (
    payload: { productId: string; status: "SYNCED" | "EXCLUDED" }[],
    onDone: () => void,
  ) => {
    setErrorMsg(null); setSuccessMsg(null);
    setBulkProgress({ done: 0, total: payload.length });
    let synced = 0;
    let failed = 0;
    const errSamples: string[] = [];
    for (let i = 0; i < payload.length; i += CLIENT_CHUNK) {
      const chunk = payload.slice(i, i + CLIENT_CHUNK);
      try {
        const res = await bulkUpdateProductVisibility(chunk);
        synced += res.synced;
        failed += res.failed;
        if (res.errors?.length) errSamples.push(...res.errors);
      } catch {
        failed += chunk.length;
        errSamples.push(`network/timeout on ${chunk.length} product(s)`);
      }
      setBulkProgress({ done: Math.min(i + CLIENT_CHUNK, payload.length), total: payload.length });
    }
    setBulkProgress(null);
    if (failed === 0) {
      setSuccessMsg(`Synced ${synced}/${payload.length} to Google Merchant Center.`);
    } else {
      setSuccessMsg(synced > 0 ? `${synced}/${payload.length} synced.` : null);
      setErrorMsg(`${failed} failed — ${errSamples[0]}`);
    }
    onDone();
    router.refresh();
  };

  const handleSavePendingChanges = () => {
    if (!Object.keys(pendingChanges).length) return;
    const payload = Object.entries(pendingChanges).map(([productId, status]) => ({ productId, status }));
    startTransition(() => runChunkedBulk(payload, () => setPendingChanges({})));
  };

  const handleSaveAndSync = () => {
    if (!bulkAction || !selectedProductIds.length) return;
    const payload = selectedProductIds.map(id => ({ productId: id, status: bulkAction as "SYNCED" | "EXCLUDED" }));
    startTransition(() => runChunkedBulk(payload, () => { setSelectedProductIds([]); setBulkAction(""); }));
  };

  const handleScanSingle = async (productId: string) => {
    setIsScanning(productId); setErrorMsg(null); setSuccessMsg(null);
    const res = await syncSingleProductStatusFromGoogle(productId);
    if (res.success) { setSuccessMsg("Live status updated from Google!"); router.refresh(); }
    else setErrorMsg(res.error || "Scan failed.");
    setIsScanning(null);
  };

  const handleRefreshAll = async () => {
    setIsSyncing(true); setErrorMsg(null); setSuccessMsg(null);
    const [statusRes, mcRes] = await Promise.all([
      syncLiveProductStatuses(),
      getGoogleMCStats(),
    ]);
    if (statusRes.success) { setSuccessMsg("All statuses refreshed from Google!"); router.refresh(); }
    else setErrorMsg("Failed to refresh statuses from Google.");
    if (mcRes.success && mcRes.data) setRealMCStats(mcRes.data);
    setIsSyncing(false);
  };

  const handleCleanup = async () => {
    if (!window.confirm("This will delete all Google MC products that are NOT gla_XXXX and NOT in your current DB. Continue?")) return;
    setIsCleaningUp(true); setErrorMsg(null); setSuccessMsg(null);
    const res = await cleanupStaleGoogleProducts();
    if (res.success) { setSuccessMsg(res.message ?? "Cleanup complete!"); router.refresh(); }
    else setErrorMsg(res.error ?? "Cleanup failed.");
    setIsCleaningUp(false);
  };

  // হেডারের অ্যাকশন দুটো (Refresh from Google / Remove Duplicates) এখন একটা
  // dropdown + Apply বাটনে — UI পরিষ্কার রাখতে। handler গুলো অপরিবর্তিত।
  const handleHeaderApply = async () => {
    if (headerAction === "refresh") await handleRefreshAll();
    else if (headerAction === "cleanup") await handleCleanup();
  };

  return (
    <div className="w-full text-[#3c434a] pb-10 space-y-6">

      {/* ── HEADER ACTIONS (dropdown + Apply) ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-[#1d2327]">Product Feed Overview</h2>
        <div className="flex items-center gap-2">
          <select
            value={headerAction}
            onChange={e => setHeaderAction(e.target.value)}
            disabled={isSyncing || isCleaningUp}
            className="border border-[#ccd0d4] rounded-md px-3 py-1.5 text-[12px] bg-white outline-none cursor-pointer text-[#374151] disabled:opacity-50"
          >
            <option value="">Choose action…</option>
            <option value="refresh">Refresh from Google</option>
            <option value="cleanup">Remove Duplicates</option>
          </select>
          <button
            onClick={handleHeaderApply}
            disabled={!headerAction || isSyncing || isCleaningUp}
            className="inline-flex items-center gap-2 bg-white border border-[#ccd0d4] text-[#2271b1] rounded-md px-4 py-1.5 text-[12px] font-semibold hover:bg-[#f0f6fc] hover:border-[#2271b1] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            {(isSyncing || isCleaningUp) && (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isSyncing ? "Refreshing…" : isCleaningUp ? "Cleaning up…" : "Apply"}
          </button>
        </div>
      </div>

      {/* ── DB FEED STATS ────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[#ccd0d4] bg-[#f9fafb]">
          <p className="text-[12px] font-semibold text-[#646970] uppercase tracking-wider">Your DB Feed — Local Status</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-[#e5e7eb]">
          {[
            { label: "Active", value: activeCount, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✓" },
            { label: "Warnings", value: warningCount, color: "text-amber-600", bg: "bg-amber-50", icon: "⚠" },
            { label: "Disapproved", value: disapprovedCount, color: "text-red-600", bg: "bg-red-50", icon: "✕" },
            { label: "Not Synced", value: notSyncedCount, color: "text-slate-500", bg: "bg-slate-50", icon: "○" },
            { label: "DB Feed Items", value: totalFeedItems, color: "text-[#1d2327]", bg: "bg-white", icon: "#" },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className={`${bg} p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[13px] font-bold ${color}`}>{icon}</span>
                <span className="text-[12px] text-[#6b7280] font-medium">{label}</span>
              </div>
              <p className={`text-[32px] font-light leading-none ${color}`}>{value}</p>
            </div>
          ))}
        </div>
        {disapprovedCount > 0 && (
          <div className="bg-red-50 border-t border-red-200 px-5 py-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <p className="text-[12px] text-red-700 font-medium m-0">
              <strong>{disapprovedCount} product{disapprovedCount > 1 ? "s" : ""}</strong> disapproved by Google — expand each card below to see full issue details.
            </p>
          </div>
        )}
      </div>

      {/* ── REAL GOOGLE MC LIVE STATS ─────────────────────────────────────── */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-[#ccd0d4] bg-[#e8f0fe]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#1a73e8] flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">G</span>
            </div>
            <p className="text-[12px] font-semibold text-[#1a73e8] uppercase tracking-wider">Google MC — Real Live Data</p>
            {!realMCStats && (
              <span className="text-[11px] text-[#9aa0a6] ml-1">— click Refresh from Google to load</span>
            )}
          </div>
        </div>
        {realMCStats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#e5e7eb]">
            {[
              { label: "Total in MC", value: realMCStats.totalProducts, color: "text-[#1a73e8]", bg: "bg-[#e8f0fe]", icon: "#" },
              { label: "Approved", value: realMCStats.approved, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✓" },
              { label: "Disapproved", value: realMCStats.disapproved, color: "text-red-600", bg: "bg-red-50", icon: "✕" },
              { label: "Under Review", value: realMCStats.pending, color: "text-amber-600", bg: "bg-amber-50", icon: "⏳" },
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} className={`${bg} p-5`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[13px] font-bold ${color}`}>{icon}</span>
                  <span className="text-[12px] text-[#6b7280] font-medium">{label}</span>
                </div>
                <p className={`text-[32px] font-light leading-none ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-[13px] text-[#9aa0a6]">Click <strong className="text-[#2271b1]">Refresh from Google</strong> to fetch real-time data directly from Google Merchant Center.</p>
          </div>
        )}
      </div>

      {/* ── NOTICES ──────────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">✓</span>
          <p className="text-[13px] text-emerald-800 font-medium m-0">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">✕</span>
          <p className="text-[13px] text-red-800 font-medium m-0">{errorMsg}</p>
        </div>
      )}

      {/* ── ISSUES TO RESOLVE ────────────────────────────────────────────── */}
      {disapprovedCount > 0 && (
        <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden shadow-sm">
          {/* Section header — clickable to collapse/expand the whole list */}
          <button
            onClick={toggleIssuesSection}
            className="w-full border-b border-[#ccd0d4] px-4 py-2.5 flex items-center gap-2.5 bg-[#fef2f2] text-left cursor-pointer"
          >
            <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 text-[12px] font-bold">!</span>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-bold text-[#1d2327]">
                Issues to Resolve
                <span className="ml-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full align-middle">{disapprovedCount}</span>
              </span>
              {!issuesCollapsed && (
                <span className="block text-[11px] text-[#6b7280] mt-0.5">Disapproved / limited by Google. Duplicate issues are grouped; expand a row for Google&apos;s full detail.</span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#b91c1c] font-semibold flex-shrink-0">
              {issuesCollapsed ? "Show" : "Hide"}
              <svg className={`w-3.5 h-3.5 transition-transform ${issuesCollapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>

          {!issuesCollapsed && (
            <div className="divide-y divide-[#f1f5f9]">
              {syncLogs.filter(log => log.status === "FAILED").map(log => {
                const issues = parseGoogleIssues(log.googleIssues);
                const deduped = dedupeIssues(issues);
                const isExpanded = expandedRows.has(log.id);
                const action = smartAction(log, issues);
                const worst = deduped[0] ? issueSeverityCfg(deduped[0].severity ?? deduped[0].servability) : null;
                const topReason = deduped[0]?.description ?? log.errorMessage ?? "Disapproved by Google";

                return (
                  <div key={log.id} className="hover:bg-[#fafafa] transition-colors px-4 py-2.5">
                    {/* Row 1: name + reason preview + expand */}
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-px text-red-600 text-[11px] font-bold">✕</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <Link
                            href={`/admin/products/create?id=${log.product.id}`}
                            className="text-[#2271b1] hover:text-[#135e96] font-semibold text-[13px] hover:underline leading-snug break-words"
                          >
                            {log.product.name}
                          </Link>
                          {log.product.sku && <span className="text-[10px] text-[#9ca3af] font-mono">{log.product.sku}</span>}
                        </div>
                        {/* deduped reason preview — no expand needed to see the gist */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          {worst && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${worst.badge}`}>{worst.label}</span>}
                          <span className="text-[11px] text-[#475569] leading-snug">{topReason}</span>
                          {deduped.length > 1 && (
                            <span className="text-[10px] text-[#94a3b8]">+{deduped.length - 1} more issue{deduped.length > 2 ? "s" : ""}</span>
                          )}
                        </div>
                        {/* actions */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <Link
                            href={action.href}
                            className="inline-flex items-center gap-1 text-[11px] text-[#2271b1] hover:text-[#135e96] font-semibold hover:underline"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            {action.label}
                          </Link>
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#64748b] font-semibold hover:text-[#334155] bg-transparent border-none cursor-pointer p-0"
                          >
                            {isExpanded ? "Hide details" : "Show full detail"}
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <span className="text-[10px] text-[#cbd5e1]">
                            {log.lastSyncedAt ? `checked ${new Date(log.lastSyncedAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}` : "never checked"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded: full deduped issue list with reasons + fixes */}
                    {isExpanded && (
                      <div className="mt-2.5 ml-7">
                        <IssueList issues={issues} errorMessage={log.errorMessage} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCT FEED TABLE ───────────────────────────────────────────── */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden shadow-sm">
        {/* Table toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ccd0d4] px-5 py-3 bg-[#f9fafb]">
          <h2 className="text-[14px] font-semibold text-[#1d2327]">All Products</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
              className="border border-[#d1d5db] rounded-md px-3 py-1.5 text-[12px] bg-white outline-none cursor-pointer text-[#374151]"
            >
              <option value="">Bulk Actions</option>
              <option value="SYNCED">Sync &amp; Show Selected</option>
              <option value="EXCLUDED">Hide Selected</option>
            </select>
            <button
              onClick={handleSaveAndSync}
              disabled={isPending || !bulkAction || !selectedProductIds.length}
              className="bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6] rounded-md px-3 py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-40 transition-colors"
            >
              {bulkProgress ? `Syncing ${bulkProgress.done}/${bulkProgress.total}…` : isPending ? "Applying…" : "Apply"}
            </button>
            {selectedProductIds.length > 0 && (
              <span className="text-[12px] text-[#6b7280]"><strong>{selectedProductIds.length}</strong> selected</span>
            )}
            {hasPendingChanges && (
              <button
                onClick={handleSavePendingChanges}
                disabled={isPending}
                className="bg-[#2271b1] hover:bg-[#135e96] text-white border-none rounded-md px-4 py-1.5 text-[12px] font-semibold cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
              >
                {bulkProgress ? `Syncing ${bulkProgress.done}/${bulkProgress.total}…` : isPending ? "Saving…" : `Save & Sync (${Object.keys(pendingChanges).length})`}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse min-w-[720px]">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox"
                    checked={selectedProductIds.length === syncLogs.length && syncLogs.length > 0}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="cursor-pointer w-4 h-4 rounded"
                  />
                </th>
                <th className="py-3 px-4 font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[40%]">Product</th>
                <th className="py-3 px-4 font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[18%]">Visibility</th>
                <th className="py-3 px-4 font-semibold text-[#374151] text-[12px] uppercase tracking-wide">Google Status</th>
                <th className="py-3 px-4 font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[90px] text-center">Synced</th>
                <th className="py-3 px-4 w-[60px]" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-[#9ca3af] text-[13px]">
                    No products found. Make sure you have active products in your store.
                  </td>
                </tr>
              ) : (
                syncLogs.map(log => {
                  const pId = log.product.id;
                  const isModified = pendingChanges[pId] !== undefined;
                  const currentStatus = isModified ? pendingChanges[pId] : log.status;
                  const isChecked = selectedProductIds.includes(pId);
                  const issues = parseGoogleIssues(log.googleIssues);
                  const uniqueIssueCount = dedupeIssues(issues).length;
                  const isExpanded = expandedRows.has(log.id);
                  const hasIssues = issues.length > 0 || (log.status === "FAILED" && !!log.errorMessage);

                  return (
                    <Fragment key={log.id}>
                      <tr className={`transition-colors ${isModified ? "bg-amber-50" : isChecked ? "bg-blue-50" : "hover:bg-[#f9fafb]"}`}>
                        <td className="py-3 px-4">
                          <input type="checkbox" checked={isChecked}
                            onChange={e => handleSelectRow(pId, e.target.checked)}
                            className="cursor-pointer w-4 h-4 rounded"
                          />
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1d2327] leading-tight">
                            {log.product.name}
                            {log.product.productType === "VARIABLE" && (log.product.variantCount ?? 0) > 0 && (
                              <span className="ml-2 text-[10px] bg-[#e8f0fe] text-[#1a73e8] px-1.5 py-0.5 rounded font-semibold">
                                {log.product.variantCount} variants
                              </span>
                            )}
                            {isModified && <span className="ml-2 text-[10px] bg-amber-400 text-white px-1.5 py-0.5 rounded font-bold">Unsaved</span>}
                          </div>
                          {log.product.sku && <div className="text-[11px] text-[#9ca3af] mt-0.5 font-mono">SKU: {log.product.sku}</div>}
                        </td>

                        {/* Visibility */}
                        <td className="py-3 px-4">
                          <select
                            value={currentStatus === "EXCLUDED" ? "EXCLUDED" : "SYNCED"}
                            onChange={e => handleDropdownChange(pId, e.target.value as "SYNCED" | "EXCLUDED")}
                            className="border border-[#d1d5db] rounded-md px-2 py-1 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#2271b1] bg-white cursor-pointer text-[#374151]"
                          >
                            <option value="SYNCED">Sync &amp; Show</option>
                            <option value="EXCLUDED">Hide</option>
                          </select>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            {/* Status badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {log.status === "SYNCED" && issues.length === 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved
                                </span>
                              )}
                              {log.status === "SYNCED" && issues.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Approved with warnings
                                </span>
                              )}
                              {log.status === "FAILED" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Disapproved ({uniqueIssueCount})
                                </span>
                              )}
                              {log.status === "EXCLUDED" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Excluded
                                </span>
                              )}
                              {log.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" /> Pending
                                </span>
                              )}
                              {log.status !== "EXCLUDED" && (
                                <button
                                  onClick={() => handleScanSingle(pId)}
                                  disabled={isScanning === pId}
                                  className="text-[10px] text-[#2271b1] hover:underline bg-transparent border-none cursor-pointer p-0 disabled:opacity-50 font-medium"
                                >
                                  {isScanning === pId ? "Scanning…" : "↻ Scan"}
                                </button>
                              )}
                            </div>
                            {/* Expand toggle */}
                            {hasIssues && (
                              <button
                                onClick={() => toggleExpand(log.id)}
                                className="text-[10px] text-[#2271b1] hover:underline bg-transparent border-none cursor-pointer p-0 text-left w-fit font-medium"
                              >
                                {isExpanded ? "▲ Hide details" : `▼ View ${uniqueIssueCount} issue${uniqueIssueCount !== 1 ? "s" : ""}`}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Last synced */}
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] text-[#9ca3af]">
                            {log.lastSyncedAt
                              ? new Date(log.lastSyncedAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })
                              : "—"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link href={`/admin/products/create?id=${pId}`} className="text-[12px] text-[#2271b1] hover:underline font-medium">
                            Edit
                          </Link>
                        </td>
                      </tr>

                      {/* Expanded issue detail inside table */}
                      {isExpanded && hasIssues && (
                        <tr className="bg-[#f8fafc]">
                          <td colSpan={6} className="px-4 py-4 sm:px-10">
                            <IssueList issues={issues} errorMessage={log.errorMessage} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-[#f9fafb] text-[12px] text-[#6b7280]">
          <div>
            {hasPendingChanges && (
              <div className="flex items-center gap-3">
                <button onClick={handleSavePendingChanges} disabled={isPending}
                  className="bg-[#2271b1] hover:bg-[#135e96] text-white border-none rounded-md px-5 py-2 text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {bulkProgress ? `Syncing ${bulkProgress.done}/${bulkProgress.total}…` : isPending ? "Syncing with Google…" : "Save & Sync Changes"}
                </button>
                <button onClick={() => setPendingChanges({})}
                  className="text-[12px] text-red-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Discard
                </button>
              </div>
            )}
          </div>
          <span>
            {totalProducts} product{totalProducts !== 1 ? "s" : ""}
            {totalFeedItems !== totalProducts && <> · {totalFeedItems} feed items</>}
          </span>
        </div>
      </div>
    </div>
  );
}
