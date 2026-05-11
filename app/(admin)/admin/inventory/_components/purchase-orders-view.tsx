//app/(admin)/admin/inventory/_components/purchase-orders-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { getPurchaseOrders, createPurchaseOrder } from "@/app/actions/admin/inventory/supplier-actions";
import { PurchaseOrderData } from "../types";
import { Plus, Loader2, FileText, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { useGlobalStore } from "@/app/providers/global-store-provider";

export function PurchaseOrdersView() {
  const { formatPrice } = useGlobalStore();
  const [pos, setPos] = useState<PurchaseOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    const res = await getPurchaseOrders();
    if (res.success) setPos(res.data as PurchaseOrderData[]);
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchPOs(); 
  }, [fetchPOs]);

  // Note: For a full PO system, you'd need a separate page to select products.
  // This is a simplified version just to create the PO record as per schema.
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const toastId = toast.loading("Creating Purchase Order...");
    
    const res = await createPurchaseOrder(formData);
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      setIsModalOpen(false);
      fetchPOs();
    } else {
      toast.error(res.error as string, { id: toastId });
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RECEIVED": return "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]";
      case "PROCESSING": return "bg-[#f0f6fc] text-[#2271b1] border-[#c5d9ed]";
      case "PENDING": return "bg-[#fff5eb] text-[#c05621] border-[#fbd38d]";
      case "CANCELLED": return "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]";
      default: return "bg-[#f6f7f7] text-[#50575e] border-[#c3c4c7]";
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* 🚀 WP Style Header & Add Button */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Purchase Orders (POs)</h2>
        {/* We disable the add button here in this simple view, as a real PO needs a complex product selector */}
        <button 
          onClick={() => alert("Creating a full PO requires a product selector interface. This is a display view for your schema.")} 
          className="px-2.5 py-1 text-[13px] border border-[#c3c4c7] text-[#8c8f94] bg-[#f6f7f7] rounded-[3px] shadow-sm cursor-not-allowed"
        >
          Add New PO
        </button>
      </div>

      {/* 🚀 WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
         <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[800px]">
               
               <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
                  <tr>
                     <th className="p-2 w-32 font-medium">PO Number</th>
                     <th className="p-2 min-w-[200px]">Supplier</th>
                     <th className="p-2 w-32 text-center">Status</th>
                     <th className="p-2 w-32 text-right">Total Cost</th>
                     <th className="p-2 w-48">Date Issued</th>
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-[#f0f0f1]">
                  {loading ? (
                     <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin text-[#2271b1] mx-auto"/></td></tr>
                  ) : pos.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-[#50575e] italic">No purchase orders found.</td></tr>
                  ) : (
                     pos.map((order, index) => {
                       const isEven = index % 2 === 0;

                       return (
                          <tr key={order.id} className={`group hover:bg-[#f0f6fc] transition-colors ${isEven ? 'bg-[#f9f9f9]' : 'bg-white'}`}>
                             
                             {/* PO Number */}
                             <td className="p-2 align-top pt-[10px]">
                                <div className="flex items-center gap-1.5 font-semibold text-[#2271b1]">
                                   <FileText size={14} className="text-[#8c8f94]"/>
                                   {order.poNumber}
                                </div>
                                <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                   <button className="text-[#2271b1] hover:underline">View</button>
                                   <span className="text-[#c3c4c7]">|</span>
                                   <button className="text-[#2271b1] hover:underline flex items-center gap-0.5"><Download size={10}/> PDF</button>
                                </div>
                             </td>
                             
                             {/* Supplier */}
                             <td className="p-2 align-top pt-[10px]">
                                <div className="font-semibold text-[#3c434a]">{order.supplier?.name || "Unknown Supplier"}</div>
                                <div className="text-[11px] text-[#8c8f94] mt-0.5">{order.supplier?.email}</div>
                             </td>

                             {/* Status */}
                             <td className="p-2 text-center align-top pt-[10px]">
                                <span className={`px-1.5 py-0.5 rounded-sm border text-[11px] font-semibold inline-block ${getStatusStyle(order.status)}`}>
                                   {order.status}
                                </span>
                             </td>

                             {/* Total Cost */}
                             <td className="p-2 text-right align-top pt-[10px] font-bold text-[#1d2327]">
                                {formatPrice(order.totalCost)}
                             </td>

                             {/* Created At */}
                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                               {format(new Date(order.createdAt), "MMM d, yyyy")}
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