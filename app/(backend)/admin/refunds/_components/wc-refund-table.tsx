// File: app/admin/refunds/_components/wc-refund-table.tsx

"use client";

import Link from "next/link";
import { RefundWithRelations } from "../types";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { updateRefundStatus, deleteRefund } from "@/app/actions/backend/refund/refund";
import { toast } from "sonner";

interface WcRefundTableProps {
  refunds: RefundWithRelations[];
  loading: boolean;
  selectedIds: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onRefresh: () => void;
}

export const WcRefundTable = ({
  refunds,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onRefresh
}: WcRefundTableProps) => {

  // Dynamic Currency Formatter
  const formatPrice = (amount: number | string, currency: string = "AUD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  // WooCommerce-style Status Badge Generator
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Pending</span>;
      case "approved":
        return <span className="bg-[#c6e1c6] text-[#5b841b] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Approved</span>;
      case "rejected":
        return <span className="bg-[#eaa4a4] text-[#761919] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="bg-[#e5e5e5] text-[#777] px-2 py-[2px] rounded-[3px] text-[11px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  // Status Action Handler
  const handleAction = async (id: string, action: "approved" | "rejected" | "delete") => {
    const confirmMsg = action === "delete" 
      ? "Delete this record permanently?"
      : `Are you sure you want to ${action.slice(0, -1)} this refund?`;

    if (!confirm(confirmMsg)) return;

    if (action === "delete") {
      const res = await deleteRefund(id);
      res.success ? toast.success(res.message) : toast.error(res.error);
    } else {
      const res = await updateRefundStatus(id, action);
      res.success ? toast.success(res.message) : toast.error(res.error);
    }
    
    onRefresh();
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2271b1] w-8 h-8" />
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] p-8 text-center text-[#50575e] text-[13px]">
        No refund requests found.
      </div>
    );
  }

  const allSelected = refunds.length > 0 && selectedIds.length === refunds.length;

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] overflow-x-auto">
      <table className="w-full text-left border-collapse text-[13px] text-[#2c3338]">
        <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] font-semibold">
          <tr>
            <th className="w-[40px] pl-3 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
              />
            </th>
            <th className="py-2 px-3">Order / Customer</th>
            <th className="py-2 px-3">Refund Amount</th>
            <th className="py-2 px-3">Reason</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3 text-right pr-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f1]">
          {refunds.map((refund) => (
            <tr key={refund.id} className="group hover:bg-[#f6f7f7] transition-colors relative">
              
              {/* Checkbox */}
              <td className="pl-3 py-3 align-top">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(refund.id)}
                  onChange={(e) => onSelectOne(refund.id, e.target.checked)}
                  className="rounded-sm border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                />
              </td>

              {/* Order Info & Hover Actions */}
              <td className="py-3 px-3 align-top">
                <Link href={`/admin/orders/${refund.order.id}`} className="text-[#2271b1] font-bold hover:text-[#135e96] hover:underline">
                  #{refund.order.orderNumber}
                </Link>
                <div className="text-[12px] text-[#50575e] mt-0.5">
                  {refund.order.user?.name || "Guest"} <br/>
                  <a href={`mailto:${refund.order.user?.email || refund.order.guestEmail}`} className="text-[#2271b1] hover:underline">
                    {refund.order.user?.email || refund.order.guestEmail}
                  </a>
                </div>
                
                {/* Hidden Hover Actions (Like WordPress) */}
                <div className="text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-2">
                  <Link href={`/admin/orders/${refund.order.id}`} className="text-[#2271b1] hover:text-[#135e96]">View Order</Link>
                  
                  {refund.status === "pending" && (
                    <>
                      <span className="text-[#a7aaad]">|</span>
                      <button onClick={() => handleAction(refund.id, "approved")} className="text-[#5b841b] hover:underline">Approve</button>
                      <span className="text-[#a7aaad]">|</span>
                      <button onClick={() => handleAction(refund.id, "rejected")} className="text-[#d63638] hover:underline">Reject</button>
                    </>
                  )}
                  
                  <span className="text-[#a7aaad]">|</span>
                  <button onClick={() => handleAction(refund.id, "delete")} className="text-[#d63638] hover:underline">Delete</button>
                </div>
              </td>

              {/* Refund Amount */}
              <td className="py-3 px-3 align-top">
                <span className="font-bold text-[#2c3338]">
                  {formatPrice(Number(refund.amount), refund.order.currency)}
                </span>
                {refund.gatewayRefundId && (
                  <div className="text-[11px] text-[#8c8f94] font-mono mt-1" title="Gateway Transaction ID">
                    ID: {refund.gatewayRefundId}
                  </div>
                )}
              </td>

              {/* Reason */}
              <td className="py-3 px-3 align-top text-[#50575e]">
                <div className="max-w-xs truncate" title={refund.reason || ""}>
                   {refund.reason || <span className="italic text-[#8c8f94]">No reason provided</span>}
                </div>
              </td>

              {/* Status Badge */}
              <td className="py-3 px-3 align-top">
                {getStatusBadge(refund.status)}
              </td>

              {/* Date */}
              <td className="py-3 px-3 text-right pr-4 align-top text-[#50575e]">
                <abbr title={new Date(refund.createdAt).toLocaleString()} className="no-underline cursor-help">
                  {formatDistanceToNow(new Date(refund.createdAt), { addSuffix: true })}
                </abbr>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};