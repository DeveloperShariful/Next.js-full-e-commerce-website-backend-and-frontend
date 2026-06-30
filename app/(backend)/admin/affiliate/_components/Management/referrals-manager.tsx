// app/(backend)/admin/affiliate/_components/Management/referrals-manager.tsx

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check, X, Loader2, Search, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, CheckCircle, Clock, Ban,
  GitMerge, Play
} from "lucide-react";
import { toast } from "sonner";
import { formatTz } from "@/lib/store-time";
import { cn } from "@/lib/utils";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import {
  approveReferralManually,
  rejectReferralManually,
  bulkApproveReferrals,
  runReadyReferrals,
  type ReferralsPageData,
  type ReferralItem,
} from "@/app/actions/backend/affiliate/_services/referral-service";

interface Props {
  data: ReferralsPageData;
  currentPage: number;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  PAID:     "bg-blue-100 text-blue-800",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING:  <Clock className="w-3 h-3 mr-1" />,
  APPROVED: <CheckCircle className="w-3 h-3 mr-1" />,
  REJECTED: <Ban className="w-3 h-3 mr-1" />,
  PAID:     <Check className="w-3 h-3 mr-1" />,
};

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED", "PAID"];

export default function ReferralsManager({ data, currentPage }: Props) {
  const { formatPrice, timezone } = useGlobalStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activeStatus = searchParams.get("status") || "ALL";

  // ── Navigation ──────────────────────────────────────────────────────────────
  function navigate(overrides: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", "referrals");
    p.delete("page");
    Object.entries(overrides).forEach(([k, v]) => (v == null ? p.delete(k) : p.set(k, v)));
    startTransition(() => router.push(`/admin/affiliate?${p.toString()}`));
  }

  // ── Approve single ──────────────────────────────────────────────────────────
  async function handleApprove(id: string) {
    setLoadingId(id);
    const result = await approveReferralManually(id);
    setLoadingId(null);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    startTransition(() => router.refresh());
  }

  // ── Reject single ───────────────────────────────────────────────────────────
  async function handleReject() {
    if (!rejectModal) return;
    setLoadingId(rejectModal.id);
    const result = await rejectReferralManually(rejectModal.id, rejectReason);
    setLoadingId(null);
    setRejectModal(null);
    setRejectReason("");
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    startTransition(() => router.refresh());
  }

  // ── Bulk approve (selected) ─────────────────────────────────────────────────
  async function handleBulkApprove() {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const result = await bulkApproveReferrals(ids);
    setSelected(new Set());
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    startTransition(() => router.refresh());
  }

  // ── Run ready approvals (past holding period only) ──────────────────────────
  async function handleRunReady() {
    const result = await runReadyReferrals();
    if (result.success) toast.success(`${result.message} (${result.approved} approved)`);
    else toast.error("Failed to process referrals.");
    startTransition(() => router.refresh());
  }

  // ── Select all PENDING ──────────────────────────────────────────────────────
  const pendingItems = data.items.filter((r) => r.status === "PENDING");
  const allSelected = pendingItems.length > 0 && pendingItems.every((r) => selected.has(r.id));

  function toggleSelectAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(pendingItems.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const isPastHolding = (availableAt: string | null) => !availableAt || new Date(availableAt) <= new Date();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1d2327]">Referrals & Commissions</h2>
          <p className="text-[#50575e] text-[12px] mt-0.5">
            <span className="font-medium text-yellow-700">{data.pendingCount} pending</span>
            {" · "}
            <span className="font-medium text-green-700">{data.readyCount} ready to approve</span>
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Run ready approvals (holding period done) */}
          <button
            onClick={handleRunReady}
            disabled={isPending || data.readyCount === 0}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded border",
              data.readyCount > 0
                ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            Run {data.readyCount} Ready Approvals
          </button>

          {/* Bulk approve selected */}
          {selected.size > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded border bg-[#2271b1] text-white border-[#2271b1] hover:bg-[#135e96]"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Approve Selected ({selected.size})
            </button>
          )}

          <button
            onClick={() => startTransition(() => router.refresh())}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded border border-[#8c8f94] text-[#50575e] hover:bg-white"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isPending && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Status tabs */}
        <div className="flex gap-1 bg-white border border-[#8c8f94] rounded p-0.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => navigate({ status: s === "ALL" ? null : s })}
              className={cn(
                "px-3 py-1 text-[11px] font-medium rounded transition-colors",
                activeStatus === s
                  ? "bg-[#2271b1] text-white"
                  : "text-[#50575e] hover:bg-[#f0f0f1]"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8c8f94]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate({ search: search || null })}
            placeholder="Search affiliate or order…"
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-[#8c8f94] rounded bg-white focus:outline-none focus:border-[#2271b1]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c3c4c7] rounded shadow-sm overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
              <th className="px-3 py-2 text-left w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2 text-left font-medium text-[#1d2327]">Affiliate</th>
              <th className="px-3 py-2 text-left font-medium text-[#1d2327]">Order</th>
              <th className="px-3 py-2 text-right font-medium text-[#1d2327]">Order Amt</th>
              <th className="px-3 py-2 text-right font-medium text-[#1d2327]">Commission</th>
              <th className="px-3 py-2 text-left font-medium text-[#1d2327]">Source</th>
              <th className="px-3 py-2 text-left font-medium text-[#1d2327]">Available At</th>
              <th className="px-3 py-2 text-left font-medium text-[#1d2327]">Status</th>
              <th className="px-3 py-2 text-left font-medium text-[#1d2327]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-[#50575e]">
                  No referrals found.
                </td>
              </tr>
            ) : (
              data.items.map((ref) => {
                const ready = isPastHolding(ref.availableAt);
                const isLoading = loadingId === ref.id;
                const isSelected = selected.has(ref.id);

                return (
                  <tr
                    key={ref.id}
                    className={cn(
                      "border-b border-[#f0f0f1] hover:bg-[#f6f7f7] transition-colors",
                      isSelected && "bg-blue-50"
                    )}
                  >
                    {/* Checkbox — only for PENDING */}
                    <td className="px-3 py-2">
                      {ref.status === "PENDING" && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(ref.id)}
                          className="rounded"
                        />
                      )}
                    </td>

                    {/* Affiliate */}
                    <td className="px-3 py-2">
                      <div className="font-medium text-[#1d2327]">
                        {ref.affiliate?.user.name || "Unknown"}
                      </div>
                      <div className="text-[#8c8f94] text-[11px]">
                        {ref.affiliate?.user.email}
                      </div>
                    </td>

                    {/* Order */}
                    <td className="px-3 py-2 font-mono text-[#2271b1]">
                      {ref.order ? `#${ref.order.orderNumber}` : "—"}
                    </td>

                    {/* Order Amount */}
                    <td className="px-3 py-2 text-right text-[#50575e]">
                      {formatPrice(ref.netOrderAmount)}
                    </td>

                    {/* Commission */}
                    <td className="px-3 py-2 text-right font-semibold text-green-700">
                      {formatPrice(ref.commissionAmount)}
                    </td>

                    {/* Source */}
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 bg-[#f0f0f1] text-[#50575e] rounded text-[10px] uppercase">
                        {ref.isManual ? "MANUAL" : "COOKIE"}
                      </span>
                    </td>

                    {/* Available At */}
                    <td className="px-3 py-2">
                      <div className={cn("text-[11px]", ready ? "text-green-700 font-medium" : "text-[#50575e]")}>
                        {ref.availableAt ? formatTz(new Date(ref.availableAt), timezone, "dd MMM yyyy") : "Now"}
                      </div>
                      {ref.status === "PENDING" && (
                        <div className={cn("text-[10px]", ready ? "text-green-600" : "text-yellow-600")}>
                          {ready ? "✓ Ready" : "⏳ Holding"}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium", STATUS_STYLES[ref.status] || "bg-gray-100 text-gray-600")}>
                        {STATUS_ICON[ref.status]}
                        {ref.status}
                      </span>
                      {ref.adminNote && (
                        <div className="text-[10px] text-[#8c8f94] mt-0.5 max-w-[140px] truncate" title={ref.adminNote}>
                          {ref.adminNote}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      {ref.status === "PENDING" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprove(ref.id)}
                            disabled={isLoading}
                            title="Approve commission"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-green-500 text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectModal({ id: ref.id, name: ref.affiliate?.user.name || "Affiliate" });
                              setRejectReason("");
                            }}
                            disabled={isLoading}
                            title="Reject referral"
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-red-400 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-[#50575e]">
          <span>{data.total} total referrals</span>
          <div className="flex gap-1">
            <button
              onClick={() => navigate({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-[#c3c4c7] hover:bg-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 bg-white border border-[#c3c4c7] rounded">
              {currentPage} / {data.totalPages}
            </span>
            <button
              onClick={() => navigate({ page: String(currentPage + 1) })}
              disabled={currentPage >= data.totalPages}
              className="p-1.5 rounded border border-[#c3c4c7] hover:bg-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-[14px] font-semibold text-[#1d2327]">
                Reject Referral — {rejectModal.name}
              </h3>
            </div>
            <p className="text-[12px] text-[#50575e] mb-3">
              This will mark the referral as REJECTED. The commission will NOT be added to the affiliate balance.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)…"
              rows={3}
              className="w-full border border-[#8c8f94] rounded px-3 py-2 text-[12px] focus:outline-none focus:border-[#2271b1] resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-[12px] border border-[#8c8f94] rounded text-[#50575e] hover:bg-[#f0f0f1]"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!loadingId}
                className="px-4 py-2 text-[12px] bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {loadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
