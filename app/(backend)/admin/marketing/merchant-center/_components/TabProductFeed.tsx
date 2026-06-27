"use client";

import { useTransition, useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  bulkUpdateProductVisibility,
  syncSingleProductStatusFromGoogle,
  syncLiveProductStatuses,
} from "@/app/actions/backend/marketing/gmc-product-sync.actions";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface GoogleIssue {
  code?: string;
  servability?: "disapproved" | "demoted" | "unaffected";
  resolution?: "merchant_action" | "pending_processing";
  attributeName?: string;
  destination?: string;
  description?: string;
  detail?: string;
  documentation?: string;
}

interface SyncLog {
  id: string;
  status: "SYNCED" | "FAILED" | "PENDING" | "EXCLUDED";
  errorMessage: string | null;
  googleIssues: unknown;
  lastSyncedAt: string | null;
  product: { id: string; name: string; slug: string; featuredImage: string | null; sku: string | null };
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

function severityConfig(s?: string) {
  if (s === "disapproved") return {
    bg: "bg-red-50", border: "border-red-200", text: "text-red-700",
    dot: "bg-red-500", headerBg: "bg-red-100", headerText: "text-red-800",
    badge: "bg-red-100 text-red-700", label: "Disapproved", icon: "✕",
  };
  if (s === "demoted") return {
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700",
    dot: "bg-amber-500", headerBg: "bg-amber-100", headerText: "text-amber-800",
    badge: "bg-amber-100 text-amber-700", label: "Demoted", icon: "▼",
  };
  return {
    bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700",
    dot: "bg-yellow-400", headerBg: "bg-yellow-100", headerText: "text-yellow-800",
    badge: "bg-yellow-100 text-yellow-700", label: "Warning", icon: "⚠",
  };
}

function smartAction(log: SyncLog, issues: GoogleIssue[]) {
  const combined = (issues.map(i => `${i.code ?? ""} ${i.attributeName ?? ""} ${i.description ?? ""}`).join(" ")).toLowerCase();
  if (combined.includes("color") || combined.includes("size") || combined.includes("category") || combined.includes("mapping") || combined.includes("google_product_category"))
    return { label: "Fix attribute mapping", href: "/admin/marketing/merchant-center?tab=attributes" };
  if (combined.includes("image") || combined.includes("thumbnail"))
    return { label: "Edit product images", href: `/admin/products/create?id=${log.product.id}` };
  if (combined.includes("price") || combined.includes("currency"))
    return { label: "Check product price", href: `/admin/products/create?id=${log.product.id}` };
  return { label: "Edit product", href: `/admin/products/create?id=${log.product.id}` };
}

// ─────────────────────────────────────────────────────────────
// ISSUE TABLE COMPONENT — structured, destination-first
// ─────────────────────────────────────────────────────────────
function IssueTable({ issues, errorMessage }: { issues: GoogleIssue[]; errorMessage: string | null }) {
  if (issues.length === 0 && !errorMessage) return null;

  if (issues.length === 0) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-500 text-lg mt-0.5">✕</span>
        <p className="text-[13px] text-red-700 m-0">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#e2e8f0] overflow-hidden">
      {/* Header row */}
      <div className="hidden sm:grid grid-cols-[110px_160px_1fr_auto] gap-0 bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2">
        <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Severity</span>
        <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Destination</span>
        <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Issue</span>
        <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider text-right">Action</span>
      </div>

      {/* Issue rows */}
      <div className="divide-y divide-[#f1f5f9]">
        {issues.map((issue, idx) => {
          const cfg = severityConfig(issue.servability);
          return (
            <div key={idx} className={`${cfg.bg} sm:grid sm:grid-cols-[110px_160px_1fr_auto] sm:gap-4 flex flex-col gap-2 px-4 py-3`}>

              {/* Severity */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Destination */}
              <div className="flex items-center sm:block">
                <span className="sm:hidden text-[10px] text-[#64748b] font-semibold mr-1.5 uppercase">Dest:</span>
                {issue.destination ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-white border border-[#e2e8f0] text-[#374151] px-2 py-0.5 rounded-md">
                    <svg className="w-3 h-3 text-[#6366f1]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {issue.destination}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#94a3b8]">—</span>
                )}
              </div>

              {/* Description + detail */}
              <div className="min-w-0">
                <p className={`text-[12px] font-semibold ${cfg.text} leading-snug`}>
                  {issue.description ?? issue.code ?? "Unknown issue"}
                </p>
                {issue.detail && (
                  <p className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">{issue.detail}</p>
                )}
                {issue.attributeName && (
                  <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-white border border-[#e2e8f0] text-[#374151] rounded">
                    Attribute: <strong>{issue.attributeName}</strong>
                  </span>
                )}
              </div>

              {/* Resolution + help */}
              <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1.5 sm:min-w-[90px]">
                {issue.resolution === "merchant_action" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Fix required
                  </span>
                )}
                {issue.resolution === "pending_processing" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Processing
                  </span>
                )}
                {issue.documentation && (
                  <a
                    href={issue.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#2271b1] hover:text-[#135e96] font-semibold"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Help
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
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

  const activeCount = syncLogs.filter(l => l.status === "SYNCED" && parseGoogleIssues(l.googleIssues).length === 0).length;
  const disapprovedCount = syncLogs.filter(l => l.status === "FAILED").length;
  const warningCount = syncLogs.filter(l => l.status === "SYNCED" && parseGoogleIssues(l.googleIssues).length > 0).length;
  const notSyncedCount = syncLogs.filter(l => l.status === "PENDING").length;
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

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

  const handleSavePendingChanges = () => {
    if (!Object.keys(pendingChanges).length) return;
    setErrorMsg(null); setSuccessMsg(null);
    const payload = Object.entries(pendingChanges).map(([productId, status]) => ({ productId, status }));
    startTransition(async () => {
      const res = await bulkUpdateProductVisibility(payload);
      if (res.success) { setSuccessMsg(res.message || "Changes saved!"); setPendingChanges({}); router.refresh(); }
      else setErrorMsg(res.error || "Failed to save changes.");
    });
  };

  const handleSaveAndSync = () => {
    if (!bulkAction || !selectedProductIds.length) return;
    setErrorMsg(null); setSuccessMsg(null);
    const payload = selectedProductIds.map(id => ({ productId: id, status: bulkAction as "SYNCED" | "EXCLUDED" }));
    startTransition(async () => {
      const res = await bulkUpdateProductVisibility(payload);
      if (res.success) { setSuccessMsg(res.message || "Done!"); setSelectedProductIds([]); setBulkAction(""); router.refresh(); }
      else setErrorMsg(res.error || "Failed.");
    });
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
    const res = await syncLiveProductStatuses();
    if (res.success) { setSuccessMsg("All statuses refreshed from Google!"); router.refresh(); }
    else setErrorMsg("Failed to refresh statuses from Google.");
    setIsSyncing(false);
  };

  return (
    <div className="w-full text-[#3c434a] pb-10 space-y-6">

      {/* ── STAT CARDS ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ccd0d4] px-5 py-3">
          <h2 className="text-[15px] font-semibold text-[#1d2327]">Product Feed Overview</h2>
          <button
            onClick={handleRefreshAll}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 bg-white border border-[#ccd0d4] text-[#2271b1] rounded-md px-4 py-1.5 text-[12px] font-semibold hover:bg-[#f0f6fc] hover:border-[#2271b1] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            <svg className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isSyncing ? "Refreshing…" : "Refresh from Google"}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-[#e5e7eb]">
          {[
            { label: "Active", value: activeCount, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✓" },
            { label: "Warnings", value: warningCount, color: "text-amber-600", bg: "bg-amber-50", icon: "⚠" },
            { label: "Disapproved", value: disapprovedCount, color: "text-red-600", bg: "bg-red-50", icon: "✕" },
            { label: "Not Synced", value: notSyncedCount, color: "text-slate-500", bg: "bg-slate-50", icon: "○" },
            { label: "Total", value: totalProducts, color: "text-[#1d2327]", bg: "bg-white", icon: "#" },
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
              <strong>{disapprovedCount} product{disapprovedCount > 1 ? "s" : ""}</strong> disapproved by Google — click <strong>Refresh from Google</strong> for the latest status, then expand each product to see full issue details.
            </p>
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
          <div className="border-b border-[#ccd0d4] px-5 py-4 flex items-center gap-3 bg-[#fef2f2]">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 text-[14px] font-bold">!</span>
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[#1d2327] m-0">
                Issues to Resolve
                <span className="ml-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full align-middle">{disapprovedCount}</span>
              </h2>
              <p className="text-[11px] text-[#6b7280] m-0 mt-0.5">Products below are disapproved by Google. Expand each card to see full issue details including which destination is affected.</p>
            </div>
          </div>

          <div className="divide-y divide-[#f1f5f9]">
            {syncLogs.filter(log => log.status === "FAILED").map(log => {
              const issues = parseGoogleIssues(log.googleIssues);
              const isExpanded = expandedRows.has(log.id);
              const action = smartAction(log, issues);
              const disapprovedIssues = issues.filter(i => i.servability === "disapproved");
              const otherIssues = issues.filter(i => i.servability !== "disapproved");

              return (
                <div key={log.id} className="hover:bg-[#fafafa] transition-colors">
                  {/* Product header */}
                  <div className="px-4 py-4">
                    {/* Top row: icon + name (full width on mobile) */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-600 text-[12px] font-bold">✕</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/products/create?id=${log.product.id}`}
                          className="text-[#2271b1] hover:text-[#135e96] font-semibold text-[13px] sm:text-[14px] hover:underline leading-snug block break-words"
                        >
                          {log.product.name}
                        </Link>
                        {log.product.sku && (
                          <span className="text-[11px] text-[#9ca3af] font-mono break-all">SKU: {log.product.sku}</span>
                        )}
                      </div>
                    </div>

                    {/* Second row: action button + date — below name on mobile */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 ml-10">
                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={action.href}
                          className="inline-flex items-center gap-1.5 bg-[#2271b1] hover:bg-[#135e96] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {action.label}
                        </Link>
                        <span className="text-[10px] text-[#9ca3af]">
                          {log.lastSyncedAt ? new Date(log.lastSyncedAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "Never checked"}
                        </span>
                      </div>

                      {/* Issue count summary chips */}
                      {disapprovedIssues.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {disapprovedIssues.length} Disapproved
                        </span>
                      )}
                      {otherIssues.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {otherIssues.length} Warning{otherIssues.length > 1 ? "s" : ""}
                        </span>
                      )}
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#2271b1] font-semibold hover:underline bg-transparent border-none cursor-pointer p-0"
                      >
                        {isExpanded ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            Hide issue details
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            View all {issues.length} issue{issues.length !== 1 ? "s" : ""} with destination
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded issue table */}
                  {isExpanded && (
                    <div className="px-5 pb-5 ml-10">
                      <IssueTable issues={issues} errorMessage={log.errorMessage} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
              {isPending ? "Applying…" : "Apply"}
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
                {isPending ? "Saving…" : `Save & Sync (${Object.keys(pendingChanges).length})`}
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
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Disapproved ({issues.length})
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
                                {isExpanded ? "▲ Hide details" : `▼ View ${issues.length} issue${issues.length !== 1 ? "s" : ""}`}
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
                            <IssueTable issues={issues} errorMessage={log.errorMessage} />
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
                  {isPending ? "Syncing with Google…" : "Save & Sync Changes"}
                </button>
                <button onClick={() => setPendingChanges({})}
                  className="text-[12px] text-red-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Discard
                </button>
              </div>
            )}
          </div>
          <span>{syncLogs.length} product{syncLogs.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}
