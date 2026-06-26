//app/(backend)/admin/inventory/_components/transfers-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { getStockTransfers } from "@/app/actions/backend/inventory/location-actions";
import { StockTransferData } from "../types";
import { Loader2, ArrowRightLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export function TransfersView() {
  const [transfers, setTransfers] = useState<StockTransferData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    const res = await getStockTransfers();
    if (res.success) setTransfers(res.data as unknown as StockTransferData[]);
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchTransfers(); 
  }, [fetchTransfers]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]";
      case "IN_TRANSIT": return "bg-[#f0f6fc] text-[#2271b1] border-[#c5d9ed]";
      case "PENDING": return "bg-[#fff5eb] text-[#c05621] border-[#fbd38d]";
      case "CANCELLED": return "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]";
      default: return "bg-[#f6f7f7] text-[#50575e] border-[#c3c4c7]";
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* 🚀 WP Style Header & Action Button */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Stock Transfers</h2>
        
        {/* We disable the add button here in this simple view, as a real Transfer needs a complex product selector */}
        <button 
          onClick={() => alert("Initiating a stock transfer requires a product selection interface. This is a display view for your schema.")} 
          className="px-2.5 py-1 text-[13px] border border-[#c3c4c7] text-[#8c8f94] bg-[#f6f7f7] rounded-[3px] shadow-sm cursor-not-allowed"
        >
          New Transfer
        </button>
      </div>

      {/* 🚀 WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
         <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[800px]">
               
               <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
                  <tr>
                     <th className="p-2 w-32 font-medium">Reference</th>
                     <th className="p-2 min-w-[250px]">Transfer Route</th>
                     <th className="p-2 w-32 text-center">Items Qty</th>
                     <th className="p-2 w-32 text-center">Status</th>
                     <th className="p-2 w-48">Date Initiated</th>
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-[#f0f0f1]">
                  {loading ? (
                     <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin text-[#2271b1] mx-auto"/></td></tr>
                  ) : transfers.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-[#50575e] italic">No stock transfers found.</td></tr>
                  ) : (
                     transfers.map((transfer, index) => {
                       const isEven = index % 2 === 0;
                       
                       // Calculate total items being transferred (Assuming items is saved as an array of objects in JSON)
                       let totalItems = 0;
                       if (Array.isArray(transfer.items)) {
                         totalItems = transfer.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                       }

                       return (
                          <tr key={transfer.id} className={`group hover:bg-[#f0f6fc] transition-colors ${isEven ? 'bg-[#f9f9f9]' : 'bg-white'}`}>
                             
                             {/* Reference & Actions */}
                             <td className="p-2 align-top pt-[10px]">
                                <div className="flex items-center gap-1.5 font-semibold text-[#2271b1]">
                                   <ArrowRightLeft size={14} className="text-[#8c8f94]"/>
                                   {transfer.reference}
                                </div>
                                
                                <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                   <button className="text-[#2271b1] hover:underline">View Details</button>
                                   {transfer.status === "PENDING" && (
                                     <>
                                        <span className="text-[#c3c4c7]">|</span>
                                        <button className="text-[#d63638] hover:underline">Cancel</button>
                                     </>
                                   )}
                                </div>
                             </td>
                             
                             {/* Transfer Route (From -> To) */}
                             <td className="p-2 align-top pt-[10px]">
                                <div className="flex items-center gap-3 text-[#3c434a]">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] text-[#8c8f94] uppercase tracking-wide">Origin</span>
                                    <span className="font-medium">{transfer.fromLocation?.name || "Unknown"}</span>
                                  </div>
                                  <ArrowRight size={16} className="text-[#c3c4c7] mt-3" />
                                  <div className="flex flex-col">
                                    <span className="text-[11px] text-[#8c8f94] uppercase tracking-wide">Destination</span>
                                    <span className="font-medium">{transfer.toLocation?.name || "Unknown"}</span>
                                  </div>
                                </div>
                             </td>

                             {/* Items Qty */}
                             <td className="p-2 text-center align-top pt-[10px] font-semibold text-[#50575e]">
                                {totalItems}
                             </td>

                             {/* Status */}
                             <td className="p-2 text-center align-top pt-[10px]">
                                <span className={`px-1.5 py-0.5 rounded-sm border text-[11px] font-semibold inline-block ${getStatusStyle(transfer.status)}`}>
                                   {transfer.status.replace('_', ' ')}
                                </span>
                             </td>

                             {/* Created At */}
                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                               {format(new Date(transfer.createdAt), "MMM d, yyyy 'at' hh:mm a")}
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