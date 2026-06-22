// File: app/(backend)/admin/affiliate/_components/log-viewer.tsx

"use client";

import { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import {
  Search, Filter, Eye, AlertTriangle, Terminal, Shield,
  FileJson, X, ChevronLeft, ChevronRight, Trash2, Loader2,
  Copy, Activity, BarChart2, Clock, Database, Users,
  AlertCircle, Info, CheckCircle, Zap, RefreshCw,
  Download, Calendar, Globe, Monitor, Tag, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  deleteLogsAction,
  clearOldLogsAction,
  type AuditLogRecord,
  type SystemLogRecord,
  type LogStats,
  type PaginatedLogs,
} from "@/app/actions/backend/affiliate/_services/log-service";

// =========================================
// PROPS
// =========================================
interface Props {
  stats: LogStats;
  auditData: PaginatedLogs<AuditLogRecord>;
  systemData: PaginatedLogs<SystemLogRecord>;
  auditFilterOpts: { actions: string[]; entities: string[] };
  systemSources: string[];
  currentPage: number;
  currentTab: string;
}

type LogTab = "overview" | "audit" | "system";

// =========================================
// HELPERS
// =========================================
function fmtDate(d: Date | string) {
  return format(new Date(d), "dd MMM yyyy, HH:mm:ss");
}
function fmtShort(d: Date | string) {
  return format(new Date(d), "dd MMM, HH:mm");
}

const ACTION_COLORS: Record<string, string> = {
  CREATE:       "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30",
  UPDATE:       "bg-[#f0f6fb] text-[#2271b1] border-[#2271b1]/30",
  DELETE:       "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",
  DELETE_LOGS:  "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",
  PURGE_LOGS:   "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",
  SUSPEND:      "bg-[#fef9e7] text-[#996800] border-[#996800]/30",
  REINSTATE:    "bg-[#edfaef] text-[#00a32a] border-[#00a32a]/30",
  TOGGLE:       "bg-[#f0f6fb] text-[#2271b1] border-[#2271b1]/30",
};
function actionColor(a: string) {
  return ACTION_COLORS[a] ?? "bg-[#f6f7f7] text-[#50575e] border-[#c3c4c7]";
}

const LEVEL_COLORS: Record<string, { bg: string; icon: React.ElementType }> = {
  INFO:     { bg: "bg-[#f0f6fb] text-[#2271b1] border-[#2271b1]/30",  icon: Info          },
  WARN:     { bg: "bg-[#fef9e7] text-[#996800] border-[#996800]/30",  icon: AlertTriangle },
  ERROR:    { bg: "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",  icon: AlertCircle   },
  CRITICAL: { bg: "bg-[#fcf0f1] text-[#d63638] border-[#d63638]/30",  icon: AlertCircle   },
};
function levelStyle(l: string) {
  return LEVEL_COLORS[l] ?? { bg: "bg-[#f6f7f7] text-[#50575e] border-[#c3c4c7]", icon: Info };
}

function exportToCSV(rows: AuditLogRecord[], filename: string) {
  if (rows.length === 0) { toast.error("No rows selected to export"); return; }
  const headers = ["ID", "Actor", "Role", "Action", "Entity", "Record ID", "IP Address", "Date"];
  const lines = rows.map((r) => [
    r.id,
    r.user?.name ?? "System",
    r.user?.role ?? "—",
    r.action,
    r.tableName,
    r.recordId,
    r.ipAddress ?? "—",
    fmtDate(r.createdAt),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} row${rows.length !== 1 ? "s" : ""} to CSV`);
}

// =========================================
// STAT CARD
// =========================================
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number; sub?: string;
  icon: React.ElementType; color: "blue" | "green" | "red" | "gray";
}) {
  const colors = {
    blue:  { bg: "bg-[#f0f6fb]", text: "text-[#2271b1]", val: "text-[#2271b1]" },
    green: { bg: "bg-[#edfaef]", text: "text-[#00a32a]", val: "text-[#00a32a]" },
    red:   { bg: "bg-[#fcf0f1]", text: "text-[#d63638]", val: "text-[#d63638]" },
    gray:  { bg: "bg-[#f6f7f7]", text: "text-[#50575e]", val: "text-[#1d2327]" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-[#c3c4c7] p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
      <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-sm flex items-center justify-center shrink-0", c.bg)}>
        <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", c.text)} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] sm:text-[12px] text-[#50575e] m-0 truncate">{label}</p>
        <p className={cn("text-[18px] sm:text-[22px] font-bold m-0 leading-tight", c.val)}>{value.toLocaleString()}</p>
        {sub && <p className="text-[10px] sm:text-[11px] text-[#8c8f94] m-0 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// =========================================
// MINI BAR CHART (7-day)
// =========================================
function WeeklyChart({ auditData, systemData }: {
  auditData: { date: string; count: number }[];
  systemData: { date: string; count: number }[];
}) {
  const maxVal = Math.max(1, ...auditData.map((d) => d.count), ...systemData.map((d) => d.count));
  return (
    <div className="bg-white border border-[#c3c4c7] p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#2271b1]" /> 7-Day Activity
        </h4>
        <div className="flex items-center gap-3 text-[11px] text-[#50575e]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#2271b1] inline-block" /> Audit</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#d63638] inline-block" /> System</span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-28">
        {auditData.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: "88px" }}>
              <div
                className="w-full bg-[#2271b1] rounded-t-sm transition-all"
                style={{ height: `${(d.count / maxVal) * 88}px`, minHeight: d.count > 0 ? 2 : 0 }}
                title={`Audit: ${d.count}`}
              />
              <div
                className="w-full bg-[#d63638] rounded-t-sm transition-all"
                style={{ height: `${((systemData[i]?.count ?? 0) / maxVal) * 88}px`, minHeight: (systemData[i]?.count ?? 0) > 0 ? 2 : 0 }}
                title={`System: ${systemData[i]?.count ?? 0}`}
              />
            </div>
            <span className="text-[10px] text-[#8c8f94]">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================
// PROGRESS ROW (top actions / entities / actors)
// =========================================
function ProgressRow({ label, count, max, color }: {
  label: string; count: number; max: number; color: string;
}) {
  const pct = Math.round((count / Math.max(max, 1)) * 100);
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[12px] font-mono text-[#1d2327] w-36 truncate shrink-0" title={label}>{label}</span>
      <div className="flex-1 h-1.5 bg-[#f0f0f1] rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[12px] font-bold text-[#50575e] w-8 text-right shrink-0">{count}</span>
    </div>
  );
}

// =========================================
// DIFF VIEW (Audit modal)
// =========================================
function DiffView({ oldValues, newValues }: {
  oldValues: unknown; newValues: unknown;
}) {
  if (!oldValues || !newValues) return null;
  const oldObj = oldValues as Record<string, unknown>;
  const newObj = newValues as Record<string, unknown>;
  const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));
  const changed = allKeys.filter(
    (k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k])
  );
  const unchanged = allKeys.filter(
    (k) => JSON.stringify(oldObj[k]) === JSON.stringify(newObj[k])
  );

  if (changed.length === 0) return (
    <p className="text-[12px] text-[#50575e] italic p-3">No field differences detected.</p>
  );

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide m-0">
        {changed.length} field{changed.length !== 1 ? "s" : ""} changed · {unchanged.length} unchanged
      </p>
      <div className="border border-[#c3c4c7] overflow-hidden rounded-sm">
        <table className="w-full text-[12px]">
          <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-[#1d2327] w-1/3">Field</th>
              <th className="px-3 py-2 text-left font-semibold text-[#d63638]">Old Value</th>
              <th className="px-3 py-2 text-left font-semibold text-[#00a32a]">New Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {changed.map((key) => (
              <tr key={key} className="bg-[#fffbe6]">
                <td className="px-3 py-2 font-mono font-semibold text-[#1d2327]">{key}</td>
                <td className="px-3 py-2 font-mono text-[#d63638] bg-[#fcf0f1]/60 max-w-[180px]">
                  <span className="truncate block" title={JSON.stringify(oldObj[key])}>
                    {oldObj[key] == null ? <em className="text-[#8c8f94]">null</em> : JSON.stringify(oldObj[key])}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[#00a32a] bg-[#edfaef]/60 max-w-[180px]">
                  <span className="truncate block" title={JSON.stringify(newObj[key])}>
                    {newObj[key] == null ? <em className="text-[#8c8f94]">null</em> : JSON.stringify(newObj[key])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =========================================
// DETAIL MODAL
// =========================================
function DetailModal({
  log, type, onClose,
}: {
  log: AuditLogRecord | SystemLogRecord;
  type: "audit" | "system";
  onClose: () => void;
}) {
  const [modalTab, setModalTab] = useState<"diff" | "raw">(type === "audit" ? "diff" : "raw");

  const auditLog = type === "audit" ? (log as AuditLogRecord) : null;
  const systemLog = type === "system" ? (log as SystemLogRecord) : null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-white border border-[#c3c4c7] w-full max-w-3xl flex flex-col max-h-[88vh] shadow-2xl">

        {/* Header */}
        <div className="px-5 py-3 bg-[#1d2327] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#2271b1]" />
            <span className="text-[13px] font-bold text-white">
              {type === "audit" ? "Audit Log Detail" : "System Event Detail"}
            </span>
            <span className="text-[10px] font-mono text-[#8c8f94] ml-1">{log.id.slice(0, 12)}…</span>
          </div>
          <button onClick={onClose} className="p-1 text-[#8c8f94] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta row */}
        <div className="px-5 py-2.5 bg-[#f6f7f7] border-b border-[#c3c4c7] flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#50575e] shrink-0">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(log.createdAt)}</span>
          {auditLog && (
            <>
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{auditLog.action}</span>
              <span className="flex items-center gap-1"><Database className="w-3 h-3" />{auditLog.tableName} / {auditLog.recordId.slice(0, 16)}</span>
              {auditLog.ipAddress && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{auditLog.ipAddress}</span>}
              {auditLog.user && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{auditLog.user.name} ({auditLog.user.role})</span>}
            </>
          )}
          {systemLog && (
            <>
              <span className={cn("px-2 py-0.5 rounded-sm border text-[10px] font-bold", levelStyle(systemLog.level).bg)}>
                {systemLog.level}
              </span>
              <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{systemLog.source}</span>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#c3c4c7] bg-white shrink-0">
          {type === "audit" && (
            <button
              onClick={() => setModalTab("diff")}
              className={cn("px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors",
                modalTab === "diff" ? "border-[#2271b1] text-[#2271b1]" : "border-transparent text-[#50575e] hover:text-[#1d2327]"
              )}
            >
              Changed Fields
            </button>
          )}
          {type === "system" && systemLog?.context && (
            <button
              onClick={() => setModalTab("diff")}
              className={cn("px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors",
                modalTab === "diff" ? "border-[#2271b1] text-[#2271b1]" : "border-transparent text-[#50575e] hover:text-[#1d2327]"
              )}
            >
              Context
            </button>
          )}
          <button
            onClick={() => setModalTab("raw")}
            className={cn("px-4 py-2.5 text-[12px] font-semibold border-b-2 transition-colors",
              modalTab === "raw" ? "border-[#2271b1] text-[#2271b1]" : "border-transparent text-[#50575e] hover:text-[#1d2327]"
            )}
          >
            Raw JSON
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 bg-[#f6f7f7]">
          {modalTab === "diff" && type === "audit" && auditLog && (
            <div className="space-y-4">
              {auditLog.oldValues || auditLog.newValues ? (
                <DiffView oldValues={auditLog.oldValues} newValues={auditLog.newValues} />
              ) : (
                <p className="text-[12px] text-[#50575e] italic">No before/after data recorded for this action.</p>
              )}
              {auditLog.userAgent && (
                <div className="mt-3 p-3 bg-white border border-[#c3c4c7] rounded-sm">
                  <p className="text-[11px] font-semibold text-[#50575e] uppercase tracking-wide m-0 mb-1">User Agent</p>
                  <p className="text-[11px] font-mono text-[#50575e] m-0 break-all">{auditLog.userAgent}</p>
                </div>
              )}
            </div>
          )}

          {modalTab === "diff" && type === "system" && systemLog?.context && (
            <div className="bg-[#1d2327] rounded-sm p-4 font-mono text-[12px] text-[#a8d6a1] overflow-x-auto">
              <pre>{JSON.stringify(systemLog.context, null, 2)}</pre>
            </div>
          )}

          {modalTab === "raw" && (
            <div className="relative">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                  toast.success("Copied to clipboard");
                }}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white/10 text-[#8c8f94] hover:text-white text-[11px] rounded-sm border border-white/10 transition-colors"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
              <div className="bg-[#1d2327] rounded-sm p-4 font-mono text-[12px] text-[#a8d6a1] overflow-x-auto">
                <pre>{JSON.stringify(log, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================
// RETENTION PANEL
// =========================================
function RetentionPanel({ onClear }: { onClear: (days: number, type: "AUDIT" | "SYSTEM" | "ALL") => void }) {
  const [isPending, startTransition] = useTransition();
  const [customDays, setCustomDays] = useState("180");

  const presets: { days: number; label: string }[] = [
    { days: 7, label: "7 days" },
    { days: 30, label: "30 days" },
    { days: 90, label: "90 days" },
  ];

  return (
    <div className="bg-white border border-[#c3c4c7] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trash2 className="w-4 h-4 text-[#d63638]" />
        <h4 className="text-[13px] font-semibold text-[#1d2327] m-0">Log Retention</h4>
      </div>
      <p className="text-[12px] text-[#50575e] m-0 mb-3">
        Permanently delete logs older than a threshold to keep the database lean. This cannot be undone.
      </p>

      <div className="space-y-2">
        {presets.map((p) => (
          <div key={p.days} className="flex items-center gap-2 p-2.5 border border-[#c3c4c7] bg-[#f6f7f7] flex-wrap">
            <span className="text-[12px] font-semibold text-[#1d2327] flex-1">Older than {p.label}</span>
            <button
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Delete all AUDIT logs older than ${p.days} days? Cannot be undone.`)) return;
                startTransition(async () => {
                  const r = await clearOldLogsAction(p.days, "AUDIT");
                  r.success ? toast.success(r.message) : toast.error(r.message);
                  onClear(p.days, "AUDIT");
                });
              }}
              className="text-[11px] font-bold px-2.5 py-1 border border-[#d63638]/30 text-[#d63638] bg-white hover:bg-[#fcf0f1] transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Audit"}
            </button>
            <button
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Delete all SYSTEM logs older than ${p.days} days? Cannot be undone.`)) return;
                startTransition(async () => {
                  const r = await clearOldLogsAction(p.days, "SYSTEM");
                  r.success ? toast.success(r.message) : toast.error(r.message);
                  onClear(p.days, "SYSTEM");
                });
              }}
              className="text-[11px] font-bold px-2.5 py-1 border border-[#d63638]/30 text-[#d63638] bg-white hover:bg-[#fcf0f1] transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "System"}
            </button>
            <button
              disabled={isPending}
              onClick={() => {
                if (!confirm(`Delete ALL logs older than ${p.days} days? Cannot be undone.`)) return;
                startTransition(async () => {
                  const r = await clearOldLogsAction(p.days, "ALL");
                  r.success ? toast.success(r.message) : toast.error(r.message);
                  onClear(p.days, "ALL");
                });
              }}
              className="text-[11px] font-bold px-2.5 py-1 bg-[#d63638] text-white hover:bg-[#b32d2e] transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "All Logs"}
            </button>
          </div>
        ))}

        {/* Custom */}
        <div className="p-2.5 border border-[#c3c4c7] bg-[#f6f7f7] space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold text-[#1d2327] shrink-0">Custom — older than</span>
            <input
              type="number"
              min={1}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="w-16 shrink-0 border border-[#8c8f94] px-2 py-1 text-[12px] text-center focus:border-[#2271b1] outline-none"
            />
            <span className="text-[12px] text-[#50575e] shrink-0">days</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["AUDIT", "SYSTEM", "ALL"] as const).map((t) => (
              <button
                key={t}
                disabled={isPending || !customDays}
                onClick={() => {
                  const days = parseInt(customDays);
                  if (!days || days < 1) return;
                  if (!confirm(`Delete ${t} logs older than ${days} days?`)) return;
                  startTransition(async () => {
                    const r = await clearOldLogsAction(days, t);
                    r.success ? toast.success(r.message) : toast.error(r.message);
                    onClear(days, t);
                  });
                }}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 transition-colors disabled:opacity-50",
                  t === "ALL"
                    ? "bg-[#d63638] text-white hover:bg-[#b32d2e]"
                    : "border border-[#d63638]/30 text-[#d63638] bg-white hover:bg-[#fcf0f1]"
                )}
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin inline" /> : t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================
// PAGINATION
// =========================================
function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-1.5 border border-[#c3c4c7] bg-white hover:bg-[#f6f7f7] disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-[#50575e]" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`sep-${i}`} className="px-2 text-[#8c8f94] text-[13px]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            className={cn(
              "w-8 h-7 text-[12px] font-semibold border transition-colors",
              p === currentPage
                ? "bg-[#2271b1] text-white border-[#2271b1]"
                : "bg-white text-[#1d2327] border-[#c3c4c7] hover:bg-[#f6f7f7]"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-1.5 border border-[#c3c4c7] bg-white hover:bg-[#f6f7f7] disabled:opacity-40 transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-[#50575e]" />
      </button>
    </div>
  );
}

// =========================================
// MAIN COMPONENT
// =========================================
export default function LogViewer({
  stats,
  auditData,
  systemData,
  auditFilterOpts,
  systemSources,
  currentPage,
  currentTab,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, startNavigation] = useTransition();

  const activeTab = (currentTab || "overview") as LogTab;

  const [selectedLog, setSelectedLog] = useState<{
    log: AuditLogRecord | SystemLogRecord;
    type: "audit" | "system";
  } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [clickedTab, setClickedTab] = useState<LogTab | null>(null);
  const [clickedLevel, setClickedLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!isNavigating) { setClickedTab(null); setClickedLevel(null); }
  }, [isNavigating]);

  // Local filter state — only applied on form submit via URL
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [filterAction, setFilterAction] = useState(searchParams.get("action") ?? "ALL");
  const [filterEntity, setFilterEntity] = useState(searchParams.get("entity") ?? "ALL");
  const [filterLevel, setFilterLevel] = useState(searchParams.get("level") ?? "ALL");
  const [filterSource, setFilterSource] = useState(searchParams.get("source") ?? "ALL");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") ?? "");

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, currentPage]);

  // ---- NAV helpers ----
  function navigate(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    startNavigation(() => {
      router.push(`${pathname}?${p.toString()}`);
    });
  }

  function setTab(tab: LogTab) {
    setSearch(""); setFilterAction("ALL"); setFilterEntity("ALL");
    setFilterLevel("ALL"); setFilterSource("ALL"); setDateFrom(""); setDateTo("");
    navigate({ logTab: tab, page: "1", search: "", action: "", entity: "", level: "", source: "", dateFrom: "", dateTo: "" });
  }

  function applyFilters() {
    const hasAny = search || filterAction !== "ALL" || filterEntity !== "ALL" ||
      filterLevel !== "ALL" || filterSource !== "ALL" || dateFrom || dateTo;
    if (hasAny) toast.info("Filters applied");
    navigate({
      search,
      action: filterAction === "ALL" ? "" : filterAction,
      entity: filterEntity === "ALL" ? "" : filterEntity,
      level: filterLevel === "ALL" ? "" : filterLevel,
      source: filterSource === "ALL" ? "" : filterSource,
      dateFrom, dateTo, page: "1",
    });
  }

  function clearFilters() {
    setSearch(""); setFilterAction("ALL"); setFilterEntity("ALL");
    setFilterLevel("ALL"); setFilterSource("ALL"); setDateFrom(""); setDateTo("");
    toast.success("Filters cleared");
    navigate({ search: "", action: "", entity: "", level: "", source: "", dateFrom: "", dateTo: "", page: "1" });
  }

  function handlePageChange(page: number) {
    navigate({ page: String(page) });
  }

  // ---- Selection ----
  const currentLogs = activeTab === "audit" ? auditData.logs : systemData.logs;

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedIds(e.target.checked ? new Set(currentLogs.map((l) => l.id)) : new Set());
  }

  function toggleSelect(id: string) {
    const s = new Set(selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIds(s);
  }

  // ---- Bulk delete ----
  function handleDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} log${ids.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteLogsAction(ids, activeTab === "audit" ? "AUDIT" : "SYSTEM");
      if (res.success) {
        toast.success(res.message);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  const hasActiveFilters =
    !!searchParams.get("search") || !!searchParams.get("action") ||
    !!searchParams.get("entity") || !!searchParams.get("level") ||
    !!searchParams.get("source") || !!searchParams.get("dateFrom");

  // =========================================
  // OVERVIEW TAB
  // =========================================
  const OverviewTab = () => (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard label="Total Audit Logs"    value={stats.totalAudit}  sub={`+${stats.todayAudit} today`}  icon={Shield}        color="blue"  />
        <StatCard label="Total System Events" value={stats.totalSystem} sub={`+${stats.todaySystem} today`} icon={Activity}      color="gray"  />
        <StatCard label="System Errors (all)" value={stats.systemErrors} sub="ERROR level only"              icon={AlertCircle}   color="red"   />
        <StatCard label="Today's Activity"    value={stats.todayAudit + stats.todaySystem} sub="Audit + System"  icon={Zap}      color="green" />
      </div>

      {/* Chart + Top rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyChart auditData={stats.weeklyAudit} systemData={stats.weeklySystem} />

        <div className="bg-white border border-[#c3c4c7] p-4">
          <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#2271b1]" /> Top Actions
          </h4>
          {stats.topActions.length === 0
            ? <p className="text-[12px] text-[#8c8f94] italic m-0">No data yet.</p>
            : stats.topActions.map((a) => (
                <ProgressRow key={a.action} label={a.action} count={a.count} max={stats.topActions[0].count} color="bg-[#2271b1]" />
              ))
          }
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#c3c4c7] p-4">
          <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#2271b1]" /> Top Modified Entities
          </h4>
          {stats.topEntities.length === 0
            ? <p className="text-[12px] text-[#8c8f94] italic m-0">No data yet.</p>
            : stats.topEntities.map((e) => (
                <ProgressRow key={e.tableName} label={e.tableName} count={e.count} max={stats.topEntities[0].count} color="bg-[#00a32a]" />
              ))
          }
        </div>

        <div className="bg-white border border-[#c3c4c7] p-4">
          <h4 className="text-[13px] font-semibold text-[#1d2327] m-0 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2271b1]" /> Most Active Users
          </h4>
          {stats.topActors.length === 0
            ? <p className="text-[12px] text-[#8c8f94] italic m-0">No data yet.</p>
            : stats.topActors.map((a) => (
                <ProgressRow key={a.userId ?? "system"} label={a.name} count={a.count} max={stats.topActors[0].count} color="bg-[#996800]" />
              ))
          }
        </div>
      </div>

      {/* Retention */}
      <RetentionPanel onClear={() => router.refresh()} />
    </div>
  );

  // =========================================
  // AUDIT TRAIL TAB
  // =========================================
  const AuditTab = () => (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="bg-white border border-[#c3c4c7]">
        {/* Row 1: Search */}
        <div className="relative border-b border-[#f0f0f1]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8c8f94]" />
          <input
            type="text"
            placeholder="Search user, action, entity, ID…"
            className="w-full pl-9 pr-3 py-2 border-0 text-[12px] focus:ring-0 outline-none bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
        {/* Row 2: Action buttons */}
        <div className="flex items-center gap-1.5 p-2 flex-wrap">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 border text-[11px] font-semibold transition-colors shrink-0",
              showFilters ? "bg-[#2271b1] text-white border-[#2271b1]" : "bg-white text-[#50575e] border-[#c3c4c7] hover:bg-[#f6f7f7]"
            )}
          >
            <Filter className="w-3 h-3" /> Filters {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#d63638] inline-block" />}
          </button>
          <button
            onClick={applyFilters}
            disabled={isNavigating}
            className="px-3 py-1.5 bg-[#2271b1] text-white text-[11px] font-bold hover:bg-[#135e96] disabled:opacity-60 transition-colors shrink-0 flex items-center gap-1"
          >
            {isNavigating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="p-1.5 text-[#d63638] border border-[#d63638]/30 hover:bg-[#fcf0f1] transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => exportToCSV(auditData.logs.filter((l) => selectedIds.has(l.id)), "audit-logs.csv")}
                className="flex items-center gap-1 px-2.5 py-1.5 border border-[#2271b1] text-[#2271b1] text-[11px] font-bold hover:bg-[#f0f6fb] transition-colors shrink-0"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Export ({selectedIds.size})</span>
              </button>
              <button
                onClick={() => handleDelete(Array.from(selectedIds))}
                disabled={isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#d63638] text-white text-[11px] font-bold hover:bg-[#b32d2e] disabled:opacity-50 transition-colors shrink-0"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                <span className="hidden sm:inline">Delete ({selectedIds.size})</span>
              </button>
            </>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="border-t border-[#f0f0f1] p-3 bg-[#f6f7f7] space-y-2">
            {/* Row 1: Action + Entity — each full width on mobile, side-by-side on sm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#50575e] uppercase">Action</label>
                <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="w-full border border-[#8c8f94] px-2 py-1.5 text-[12px] bg-white focus:border-[#2271b1] outline-none">
                  <option value="ALL">All Actions</option>
                  {auditFilterOpts.actions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-[#50575e] uppercase">Entity</label>
                <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="w-full border border-[#8c8f94] px-2 py-1.5 text-[12px] bg-white focus:border-[#2271b1] outline-none">
                  <option value="ALL">All Entities</option>
                  {auditFilterOpts.entities.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            {/* Row 2: From + To — full-width stacked so calendar doesn't overflow */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-[#50575e] uppercase w-8 shrink-0">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 border border-[#8c8f94] px-2 py-1.5 text-[12px] bg-white focus:border-[#2271b1] outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-[#50575e] uppercase w-8 shrink-0">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 border border-[#8c8f94] px-2 py-1.5 text-[12px] bg-white focus:border-[#2271b1] outline-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#f6f7f7] border-b border-[#c3c4c7]">
          <span className="text-[12px] text-[#50575e]">
            {auditData.total.toLocaleString()} records · page {currentPage} of {auditData.totalPages || 1}
          </span>
          <button onClick={() => router.refresh()} className="p-1.5 text-[#50575e] hover:text-[#1d2327] hover:bg-[#e8e8e8] transition-colors" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
              <tr>
                <th className="p-3 w-9">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-[#2271b1] cursor-pointer"
                    checked={auditData.logs.length > 0 && selectedIds.size === auditData.logs.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Actor</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Action</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Entity / ID</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">IP</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Date</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {auditData.logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#8c8f94]">
                    No audit logs found for the current filters.
                  </td>
                </tr>
              ) : auditData.logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f6f7f7] transition-colors group">
                  <td className="p-3">
                    <input type="checkbox" className="w-3.5 h-3.5 accent-[#2271b1] cursor-pointer"
                      checked={selectedIds.has(log.id)} onChange={() => toggleSelect(log.id)} />
                  </td>
                  <td className="px-4 py-2.5">
                    {log.user ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#2271b1]/20 flex items-center justify-center text-[10px] font-bold text-[#2271b1] shrink-0">
                          {log.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#1d2327] m-0 leading-tight">{log.user.name}</p>
                          <p className="text-[10px] text-[#8c8f94] m-0">{log.user.role}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#8c8f94] italic">System</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-[10px] font-bold font-mono px-2 py-0.5 border rounded-sm", actionColor(log.action))}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-[12px] font-semibold text-[#1d2327] m-0">{log.tableName}</p>
                    <p className="text-[10px] text-[#8c8f94] font-mono m-0 max-w-[140px] truncate" title={log.recordId}>
                      {log.recordId}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-[#8c8f94] font-mono">
                    {log.ipAddress ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-[#50575e]">{fmtShort(log.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedLog({ log, type: "audit" })}
                        className="p-1.5 text-[#8c8f94] hover:text-[#2271b1] hover:bg-[#f0f6fb] transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete([log.id])}
                        className="p-1.5 text-[#8c8f94] hover:text-[#d63638] hover:bg-[#fcf0f1] transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {auditData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#c3c4c7] bg-[#f6f7f7]">
            <span className="text-[12px] text-[#50575e]">
              Showing {Math.min((currentPage - 1) * 20 + 1, auditData.total)}–{Math.min(currentPage * 20, auditData.total)} of {auditData.total}
            </span>
            <Pagination currentPage={currentPage} totalPages={auditData.totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </div>
  );

  // =========================================
  // SYSTEM EVENTS TAB
  // =========================================
  const SystemTab = () => (
    <div className="space-y-3">
      {/* Level pills + filter */}
      <div className="bg-white border border-[#c3c4c7] divide-y divide-[#f0f0f1] overflow-hidden">
        {/* Row 1: level pills — equal-width, no overflow */}
        <div className="flex border-b border-[#f0f0f1]">
          {(["ALL", "INFO", "WARN", "ERROR"] as const).map((lvl) => {
            const style = lvl === "ALL" ? null : levelStyle(lvl);
            const isActive = filterLevel === lvl;
            const isThisLoading = isNavigating && clickedLevel === lvl;
            return (
              <button
                key={lvl}
                disabled={isNavigating}
                onClick={() => { setClickedLevel(lvl); setFilterLevel(lvl); navigate({ level: lvl === "ALL" ? "" : lvl, page: "1" }); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-3 py-2.5 text-[11px] font-bold border-b-2 whitespace-nowrap transition-colors disabled:cursor-wait",
                  isActive
                    ? style
                      ? cn(style.bg, "border-current")
                      : "bg-[#1d2327] text-white border-[#1d2327]"
                    : "border-transparent text-[#50575e] hover:bg-[#f6f7f7]"
                )}
              >
                {isThisLoading
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : style && <style.icon className="w-3 h-3" />
                }
                {lvl}
              </button>
            );
          })}
        </div>
        {/* Row 2: search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8c8f94]" />
          <input
            type="text"
            placeholder="Search message or source…"
            className="w-full pl-9 pr-3 py-2 border-0 text-[12px] focus:ring-0 outline-none bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
        {/* Row 3: source — full width */}
        {systemSources.length > 0 && (
          <div className="px-2 pt-2 pb-1 border-b border-[#f0f0f1]">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full border border-[#c3c4c7] px-2 py-1.5 text-[11px] bg-white focus:border-[#2271b1] outline-none"
            >
              <option value="ALL">All Sources</option>
              {systemSources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {/* Row 4: dates — full-width stacked so calendar doesn't overflow */}
        <div className="px-2 pt-2 space-y-1.5 border-b border-[#f0f0f1] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#8c8f94] uppercase w-7 shrink-0">From</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 w-full border border-[#c3c4c7] px-2 py-1.5 text-[11px] bg-white focus:border-[#2271b1] outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#8c8f94] uppercase w-7 shrink-0">To</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 w-full border border-[#c3c4c7] px-2 py-1.5 text-[11px] bg-white focus:border-[#2271b1] outline-none" />
          </div>
        </div>
        {/* Row 5: Apply + Clear + Delete */}
        <div className="flex gap-1.5 p-2">
          {hasActiveFilters && (
            <button onClick={clearFilters} className="p-1.5 text-[#d63638] border border-[#d63638]/30 hover:bg-[#fcf0f1] transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={applyFilters}
            disabled={isNavigating}
            className="flex-1 py-1.5 bg-[#2271b1] text-white text-[11px] font-bold hover:bg-[#135e96] disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
          >
            {isNavigating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => handleDelete(Array.from(selectedIds))}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#d63638] text-white text-[11px] font-bold hover:bg-[#b32d2e] disabled:opacity-50 transition-colors shrink-0"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Del ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#f6f7f7] border-b border-[#c3c4c7]">
          <span className="text-[12px] text-[#50575e]">
            {systemData.total.toLocaleString()} records · page {currentPage} of {systemData.totalPages || 1}
          </span>
          <button onClick={() => router.refresh()} className="p-1.5 text-[#50575e] hover:text-[#1d2327] hover:bg-[#e8e8e8] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
              <tr>
                <th className="p-3 w-9">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-[#2271b1] cursor-pointer"
                    checked={systemData.logs.length > 0 && selectedIds.size === systemData.logs.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Level</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Source</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Message</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Context</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Date</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-[#50575e] uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {systemData.logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-[#8c8f94]">
                    No system events found for the current filters.
                  </td>
                </tr>
              ) : systemData.logs.map((log) => {
                const ls = levelStyle(log.level);
                const LevelIcon = ls.icon;
                return (
                  <tr key={log.id} className="hover:bg-[#f6f7f7] transition-colors group">
                    <td className="p-3">
                      <input type="checkbox" className="w-3.5 h-3.5 accent-[#2271b1] cursor-pointer"
                        checked={selectedIds.has(log.id)} onChange={() => toggleSelect(log.id)} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border rounded-sm w-fit", ls.bg)}>
                        <LevelIcon className="w-3 h-3" /> {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-[#1d2327]">{log.source}</td>
                    <td className="px-4 py-2.5 text-[12px] text-[#50575e] max-w-xs">
                      <span className="truncate block" title={log.message}>{log.message}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {log.context ? (
                        <span className="w-2 h-2 rounded-full bg-[#2271b1] inline-block" title="Has context data" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#c3c4c7] inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#50575e]">{fmtShort(log.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedLog({ log, type: "system" })}
                          className="p-1.5 text-[#8c8f94] hover:text-[#2271b1] hover:bg-[#f0f6fb] transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete([log.id])}
                          className="p-1.5 text-[#8c8f94] hover:text-[#d63638] hover:bg-[#fcf0f1] transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {systemData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#c3c4c7] bg-[#f6f7f7]">
            <span className="text-[12px] text-[#50575e]">
              Showing {Math.min((currentPage - 1) * 20 + 1, systemData.total)}–{Math.min(currentPage * 20, systemData.total)} of {systemData.total}
            </span>
            <Pagination currentPage={currentPage} totalPages={systemData.totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>
    </div>
  );

  // =========================================
  // RENDER
  // =========================================
  const TABS: { id: LogTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "overview", label: "Overview",      icon: BarChart2 },
    { id: "audit",    label: "Audit Trail",   icon: Shield,    count: stats.totalAudit  },
    { id: "system",   label: "System Events", icon: Terminal,  count: stats.totalSystem },
  ];

  return (
    <div className={cn("w-full font-sans text-[#1d2327] pb-6 transition-opacity duration-150", isNavigating && "opacity-60")}>

      {/* Navigation loading bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[500] h-[3px] bg-[#2271b1]/20 overflow-hidden pointer-events-none">
          <div className="h-full bg-[#2271b1] animate-pulse w-full" />
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1d2327] px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-[#2271b1]/20 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#2271b1]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] sm:text-[15px] font-bold text-white m-0 leading-tight">Activity Logs</h2>
            <p className="text-[11px] text-[#8c8f94] m-0 mt-0.5 truncate">
              {stats.totalAudit} audit · {stats.totalSystem} system · {stats.systemErrors} errors
            </p>
          </div>
        </div>
        {stats.systemErrors > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 bg-[#d63638]/20 text-[#d63638] border border-[#d63638]/30 rounded-full shrink-0 ml-2">
            <AlertCircle className="w-3.5 h-3.5" /> {stats.systemErrors} error{stats.systemErrors !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm mb-4">
        <div className="flex border-b border-[#c3c4c7] overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setClickedTab(tab.id); setTab(tab.id); }}
                disabled={isNavigating}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-5 py-3 text-[12px] sm:text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 disabled:cursor-wait",
                  isActive
                    ? "border-[#2271b1] text-[#2271b1] bg-[#f0f6fb]"
                    : "border-transparent text-[#50575e] hover:text-[#1d2327] hover:bg-[#f6f7f7]"
                )}
              >
                {isNavigating && clickedTab === tab.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                }
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cn(
                    "hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-[#2271b1] text-white" : "bg-[#f0f0f1] text-[#50575e]"
                  )}>
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div>
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "audit"    && <AuditTab />}
          {activeTab === "system"   && <SystemTab />}
        </div>
      </div>

      {/* Detail modal */}
      {selectedLog && (
        <DetailModal
          log={selectedLog.log}
          type={selectedLog.type}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
