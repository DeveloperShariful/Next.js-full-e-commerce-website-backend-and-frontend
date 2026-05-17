// File Location: app/admin/orders/[orderId]/_components/customer-history-meta.tsx

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, HelpCircle } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";

export const CustomerHistoryMeta = ({ history }: { history: { totalOrders: number, totalRevenue: number, avgValue: number } }) => {
  const { formatPrice } = useGlobalStore();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5">
      
      {/* WordPress Meta Box Header (Collapsible) */}
      <div 
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none bg-white hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Customer history</h2>
        <button type="button" className="text-[#646970] hover:text-[#1d2327]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Meta Box Content (3 Columns) */}
      {isOpen && (
        <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Column 1: Total Orders */}
            <div>
                <p className="text-[13px] text-[#3c434a] font-medium m-0 flex items-center gap-1 mb-1">
                    Total orders 
                    {/* ✅ FIX: Wrapped icon in span for title attribute */}
                    <span title="Total successful orders by this customer">
                        <HelpCircle size={12} className="text-[#a7aaad]" />
                    </span>
                </p>
                <p className="text-[13px] text-[#1d2327] m-0">
                    {history.totalOrders}
                </p>
            </div>

            {/* Column 2: Total Revenue */}
            <div>
                <p className="text-[13px] text-[#3c434a] font-medium m-0 flex items-center gap-1 mb-1">
                    Total revenue 
                    {/* ✅ FIX: Wrapped icon in span for title attribute */}
                    <span title="Total amount spent by this customer">
                        <HelpCircle size={12} className="text-[#a7aaad]" />
                    </span>
                </p>
                <p className="text-[13px] text-[#1d2327] m-0">
                    {formatPrice(history.totalRevenue)}
                </p>
            </div>

            {/* Column 3: Average Order Value */}
            <div>
                <p className="text-[13px] text-[#3c434a] font-medium m-0 flex items-center gap-1 mb-1">
                    Average order value
                </p>
                <p className="text-[13px] text-[#1d2327] m-0">
                    {formatPrice(history.avgValue)}
                </p>
            </div>

        </div>
      )}
    </div>
  );
};