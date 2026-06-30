//app/(backend)/admin/inventory/_components/history-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { getStockHistory } from "@/app/actions/backend/inventory/stock-actions";
import { StockHistoryData } from "../types";
import { Loader2, History, TrendingUp, TrendingDown } from "lucide-react";
import { formatTz } from "@/lib/store-time";
import { useGlobalStore } from "@/app/providers/global-store-provider";

export function HistoryView() {
  const { timezone } = useGlobalStore();
  const [history, setHistory] = useState<StockHistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const res = await getStockHistory(50); // Get latest 50 records
    if (res.success) setHistory(res.data as StockHistoryData[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* 🚀 WP Style Header */}
      <div className="flex items-center gap-2 mb-3 text-[#1d2327]">
        <History size={16} className="text-[#8c8f94]" />
        <h2 className="text-[14px] font-semibold">Recent Stock Adjustments</h2>
      </div>

      {/* 🚀 WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[800px]">
               
               <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
                  <tr>
                     <th className="p-2 w-48">Date & Time</th>
                     <th className="p-2 min-w-[200px]">Product / Target</th>
                     <th className="p-2 w-32 text-center">Change</th>
                     <th className="p-2 w-24 text-center">Final Stock</th>
                     <th className="p-2 w-48">Reason / Note</th>
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-[#f0f0f1]">
                  {loading ? (
                     <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin text-[#2271b1] mx-auto"/></td></tr>
                  ) : history.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-[#50575e] italic">No stock history recorded yet.</td></tr>
                  ) : (
                     history.map((log, index) => {
                       const isEven = index % 2 === 0;
                       const isIncrease = log.change > 0;
                       const isDecrease = log.change < 0;

                       return (
                          <tr key={log.id} className={`hover:bg-[#f0f6fc] transition-colors ${isEven ? 'bg-[#f9f9f9]' : 'bg-white'}`}>
                             
                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                               {formatTz(new Date(log.createdAt), timezone, "MMM d, yyyy 'at' hh:mm a")}
                             </td>
                             
                             <td className="p-2 align-top pt-[10px]">
                                <div className="font-semibold text-[#2271b1]">{log.product?.name || "Unknown Product"}</div>
                                <div className="text-[11px] text-[#8c8f94] mt-0.5">
                                   ID: {log.productId.slice(-8)}
                                </div>
                             </td>
                             
                             <td className="p-2 text-center align-top pt-[10px]">
                                <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-[2px] text-[11px] border ${
                                  isIncrease ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]' : 
                                  isDecrease ? 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]' : 
                                  'bg-[#f0f0f1] text-[#50575e] border-[#c3c4c7]'
                                }`}>
                                   {isIncrease && <TrendingUp size={12}/>}
                                   {isDecrease && <TrendingDown size={12}/>}
                                   {isIncrease ? '+' : ''}{log.change}
                                </span>
                             </td>

                             <td className="p-2 text-center align-top pt-[10px] font-bold text-[#1d2327]">
                                {log.finalStock}
                             </td>

                             <td className="p-2 align-top pt-[10px] text-[#50575e] italic">
                                {log.reason || "Manual Adjustment"}
                             </td>

                          </tr>
                       );
                     })
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}