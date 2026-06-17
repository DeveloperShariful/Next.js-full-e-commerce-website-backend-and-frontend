// File Location: app/admin/orders/[orderId]/_components/transdirect-booking.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, RefreshCw, FileText, Printer, CheckCircle, AlertTriangle } from "lucide-react";
import { syncOrderToTransdirect } from "@/app/actions/backend/order/transdirect-sync-order";
import { toast } from "sonner"; 
import { useRouter } from "next/navigation";

// ✅ STRICT TYPES IMPORT
import { OrderDetailsType } from "../types";

interface TransdirectSidebarProps {
  order: OrderDetailsType;
}

export const TransdirectSidebar = ({ order }: TransdirectSidebarProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSync = async () => {
    setLoading(true);
    const res = await syncOrderToTransdirect(order.id);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else toast.error(res.error);
    setLoading(false);
  };

  const status = order.transdirectOrderStatus;
  const isSynced = status === "booked" && !!order.transdirectBookingId;
  const isFailed = status === "failed";

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">

      <div
        className="px-3 py-2 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Transdirect Sync</h2>
        <button type="button" className="text-[#646970]">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 text-[13px] text-[#3c434a]">

          {/* Status badge */}
          <div className="mb-3">
            <span className="font-semibold text-[#1d2327]">Status: </span>
            {isSynced ? (
              <span className="text-[#5b841b] font-medium flex items-center gap-1 mt-1">
                <CheckCircle size={12} /> Booked
              </span>
            ) : isFailed ? (
              <span className="text-[#d63638] font-medium flex items-center gap-1 mt-1">
                <AlertTriangle size={12} /> Booking Failed
              </span>
            ) : (
              <span className="text-[#996800] font-medium flex items-center gap-1 mt-1">
                <AlertTriangle size={12} /> Pending Booking
              </span>
            )}
          </div>

          {/* Error message */}
          {isFailed && order.transdirectError && (
            <div className="mb-3 p-2 bg-[#fcf0f1] border border-[#f5c6c6] rounded-[3px] text-[#d63638] text-[11px] break-words">
              <span className="font-semibold block mb-1">Error:</span>
              {order.transdirectError}
            </div>
          )}

          {/* Booking ID */}
          {isSynced && order.transdirectBookingId && (
            <div className="mb-3 p-2 bg-[#f6f7f7] border border-[#e2e4e7] rounded-[3px]">
              <span className="font-semibold text-[#1d2327] block mb-1">Transdirect ID:</span>
              <span className="font-mono text-[#2271b1]">{order.transdirectBookingId}</span>
            </div>
          )}

            {/* Labels & Invoices (Schema Based) */}
            {isSynced && (order.transdirectLabelUrl || order.transdirectInvoiceUrl) && (
                <div className="flex gap-2 mb-3">
                    {order.transdirectLabelUrl && (
                        <a 
                            href={order.transdirectLabelUrl} 
                            target="_blank"
                            className="border border-[#8c8f94] bg-white text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[12px] rounded-[3px] font-medium transition-colors shadow-sm flex-1 flex justify-center items-center gap-1"
                        >
                            <Printer size={12}/> Print Label
                        </a>
                    )}
                    {order.transdirectInvoiceUrl && (
                        <a 
                            href={order.transdirectInvoiceUrl} 
                            target="_blank"
                            className="border border-[#8c8f94] bg-white text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] h-[30px] px-3 text-[12px] rounded-[3px] font-medium transition-colors shadow-sm flex-1 flex justify-center items-center gap-1"
                        >
                            <FileText size={12}/> Invoice
                        </a>
                    )}
                </div>
            )}

            <button 
                onClick={handleSync} 
                disabled={loading}
                className="w-full bg-[#2271b1] text-white hover:bg-[#135e96] h-[30px] px-3 text-[13px] rounded-[3px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mb-2"
            >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
                {loading ? "Processing..." : "Recalculate & Send"}
            </button>
            
            <p className="text-[11px] text-[#646970] m-0 leading-snug">
                Clicking this will re-calculate shipping based on current order details, generate a new Booking ID, and send it to Transdirect.
            </p>
        </div>
      )}
    </div>
  );
};