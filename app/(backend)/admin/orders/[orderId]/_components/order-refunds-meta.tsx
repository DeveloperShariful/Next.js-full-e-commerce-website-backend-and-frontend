"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, RefreshCcw } from "lucide-react";
import { formatTz } from "@/lib/store-time";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { OrderRefund } from "../types";

interface OrderRefundsMetaProps {
  refunds: OrderRefund[];
  timezone?: string;
}

const refundStatusBadge: Record<string, { bg: string; text: string; label: string }> = {
  COMPLETED:  { bg: "bg-[#edfaef]", text: "text-[#5b841b]",  label: "Completed"  },
  PENDING:    { bg: "bg-[#fff8e5]", text: "text-[#996800]",  label: "Pending"    },
  FAILED:     { bg: "bg-[#fce8e8]", text: "text-[#d63638]",  label: "Failed"     },
  PROCESSING: { bg: "bg-[#e9f0f8]", text: "text-[#2271b1]",  label: "Processing" },
};

export const OrderRefundsMeta = ({ refunds, timezone = "UTC" }: OrderRefundsMetaProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { formatPrice } = useGlobalStore();

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5 rounded-[3px]">

      <div
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0 flex items-center gap-2">
          <RefreshCcw size={14} className="text-[#646970]" />
          Refunds
          {refunds.length > 0 && (
            <span className="bg-[#d63638] text-white text-[11px] font-normal px-1.5 py-0.5 rounded-full">
              {refunds.length}
            </span>
          )}
        </h2>
        <button type="button" className="text-[#646970]">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4">
          {refunds.length === 0 ? (
            <p className="text-[13px] text-[#646970] m-0">No refunds have been issued for this order.</p>
          ) : (
            <div className="space-y-3">
              {refunds.map((refund, index) => {
                const badge = refundStatusBadge[refund.status] ?? {
                  bg: "bg-[#f0f0f1]",
                  text: "text-[#646970]",
                  label: refund.status,
                };
                return (
                  <div
                    key={refund.id}
                    className="border border-[#e2e4e7] rounded-[3px] overflow-hidden"
                  >
                    <div className="bg-[#f6f7f7] px-3 py-2 border-b border-[#e2e4e7] flex justify-between items-center">
                      <span className="text-[13px] font-semibold text-[#1d2327]">
                        Refund #{index + 1}
                      </span>
                      <span
                        className={`text-[12px] font-medium px-2 py-0.5 rounded-[3px] ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <span className="text-[#646970] block text-[12px] mb-0.5">Amount</span>
                        <span className="font-semibold text-[#d63638] text-[14px]">
                          {formatPrice(refund.amount)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#646970] block text-[12px] mb-0.5">Date</span>
                        <span className="text-[#1d2327]">
                          {formatTz(new Date(refund.createdAt), timezone, "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>

                      {refund.reason && (
                        <div className="sm:col-span-2">
                          <span className="text-[#646970] block text-[12px] mb-0.5">Reason</span>
                          <span className="text-[#1d2327]">{refund.reason}</span>
                        </div>
                      )}

                      {refund.gatewayRefundId && (
                        <div className="sm:col-span-2">
                          <span className="text-[#646970] block text-[12px] mb-0.5">Gateway Refund ID</span>
                          <span className="font-mono text-[11px] text-[#646970] bg-[#f0f0f1] px-1.5 py-0.5 rounded">
                            {refund.gatewayRefundId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
