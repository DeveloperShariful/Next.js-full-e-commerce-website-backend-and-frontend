"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { CustomerHistoryType } from "../types";
import Link from "next/link";

export const CustomerHistoryMeta = ({ history }: { history: CustomerHistoryType }) => {
  const { formatPrice } = useGlobalStore();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5">

      {/* Header */}
      <div
        className="px-4 py-3 border-b border-[#c3c4c7] flex justify-between items-center cursor-pointer select-none bg-white hover:bg-[#f6f7f7] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Customer history</h2>
        <button type="button" className="text-[#646970] hover:text-[#1d2327]">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4">
          {history.orders.length === 0 ? (
            <p className="text-[13px] text-[#646970] m-0">No order history found.</p>
          ) : (
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-[#c3c4c7]">
                  <th className="text-left text-[#3c434a] font-semibold pb-2 w-1/3">Order</th>
                  <th className="text-right text-[#3c434a] font-semibold pb-2 w-1/3">Value</th>
                  <th className="text-right text-[#3c434a] font-semibold pb-2 w-1/3">Avg value</th>
                </tr>
              </thead>
              <tbody>
                {history.orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                    <td className="py-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-[#2271b1] hover:text-[#135e96] hover:underline font-medium"
                      >
                        #{o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-right text-[#1d2327]">
                      {formatPrice(o.total)}
                    </td>
                    <td className="py-2 text-right text-[#1d2327]"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#c3c4c7]">
                  <td className="pt-3 text-[#3c434a] font-semibold">
                    Total Orders : {history.totalOrders} 
                  </td>
                  <td className="pt-3 text-right text-[#1d2327] font-semibold">
                    Total Value : {formatPrice(history.totalRevenue)}
                  </td>
                  <td className="pt-3 text-right text-[#1d2327] font-semibold">
                    Avg value : {formatPrice(history.avgValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
