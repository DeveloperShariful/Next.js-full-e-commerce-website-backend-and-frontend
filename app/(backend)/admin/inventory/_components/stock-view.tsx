// app/admin/inventory/_components/stock-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { getInventoryList, adjustStock } from "@/app/actions/backend/inventory/stock-actions";
import { InventoryLevelData } from "../types";
import { Search, Box, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

export function StockView() {
  const [data, setData] = useState<InventoryLevelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // States for Inline Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>("Manual Adjustment");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventoryList(search);
      if (res.success) setData(res.data as InventoryLevelData[]);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleAdjustClick = (item: InventoryLevelData) => {
    setEditingId(item.id);
    setEditQty(item.quantity);
    setEditReason("Manual Adjustment");
  };

  const handleSaveAdjustment = async (id: string) => {
    setIsSaving(true);
    const toastId = toast.loading("Updating stock...");
    try {
      const res = await adjustStock(id, editQty, editReason);
      if (res.success) {
        toast.success(res.message as string, { id: toastId });
        setEditingId(null);
        fetchData();
      } else {
        toast.error(res.error as string, { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* 🚀 WP Style Search Input */}
      <div className="flex justify-end mb-2">
        <div className="flex items-stretch shadow-sm w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search products or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-[250px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow rounded-l-[3px]"
          />
          <button className="px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px]">
            Search stock
          </button>
        </div>
      </div>

      {/* 🚀 WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
         <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[800px]">
               
               <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
                  <tr>
                     <th className="p-2 w-14 border-r border-[#e2e4e7]">Image</th>
                     <th className="p-2 min-w-[200px]">Product / Variant</th>
                     <th className="p-2 w-32">SKU</th>
                     <th className="p-2 w-48">Location</th>
                     <th className="p-2 w-24 text-center">Reserved</th>
                     <th className="p-2 w-24 text-center">Available</th>
                     <th className="p-2 w-24 text-center">Total Stock</th>
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-[#f0f0f1]">
                  {loading ? (
                     <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="animate-spin text-[#2271b1] mx-auto"/></td></tr>
                  ) : data.length === 0 ? (
                     <tr><td colSpan={7} className="p-8 text-center text-[#50575e] italic">No inventory records found.</td></tr>
                  ) : (
                     data.map((item, index) => {
                       const isEven = index % 2 === 0;
                       const isEditing = editingId === item.id;
                       const productImage = item.variant?.image || item.product.featuredImage;
                       const isLowStock = item.available <= 2;

                       return (
                          <tr key={item.id} className={`group hover:bg-[#f0f6fc] transition-colors ${isEven ? 'bg-[#f9f9f9]' : 'bg-white'} ${isEditing ? 'bg-[#fff8e5]' : ''}`}>
                             
                             {/* Image */}
                             <td className="p-2 border-r border-[#f0f0f1]">
                                <div className="w-[32px] h-[32px] bg-[#f0f0f1] border border-[#c3c4c7] rounded-[2px] overflow-hidden mx-auto flex items-center justify-center">
                                   {productImage ? <img src={productImage} className="w-full h-full object-cover"/> : <Box size={14} className="text-[#8c8f94]"/>}
                                </div>
                             </td>
                             
                             {/* Name & Row Actions */}
                             <td className="p-2 align-top pt-[10px]">
                                <div className="font-semibold text-[#2271b1]">{item.product.name}</div>
                                {item.variant && <div className="text-[11px] text-[#50575e] mt-0.5">— {item.variant.name}</div>}
                                
                                {/* Row Actions (WP Style) */}
                                {!isEditing && (
                                  <div className="text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                     <button onClick={() => handleAdjustClick(item)} className="text-[#2271b1] hover:underline">Adjust Stock</button>
                                  </div>
                                )}
                             </td>

                             {/* SKU */}
                             <td className="p-2 font-mono text-[12px] text-[#50575e] align-top pt-[10px]">
                                {item.variant?.sku || item.product.sku || "—"}
                             </td>
                             
                             {/* Location */}
                             <td className="p-2 align-top pt-[10px]">
                                <span className="flex items-center gap-1 text-[#50575e]">
                                  <MapPin size={12} className="text-[#8c8f94]"/> {item.location.name}
                                </span>
                             </td>
                             
                             {/* Reserved (From InventoryReservations model) */}
                             <td className="p-2 text-center align-top pt-[10px] text-[#8c8f94]">
                                {item.reserved}
                             </td>

                             {/* Available */}
                             <td className="p-2 text-center align-top pt-[10px]">
                                <span className={`font-semibold ${isLowStock ? 'text-[#d63638]' : 'text-[#008a20]'}`}>
                                   {item.available}
                                </span>
                             </td>

                             {/* Total Stock / Edit Box */}
                             <td className="p-2 text-center align-top pt-[10px]">
                                {!isEditing ? (
                                   <span className="font-bold text-[#1d2327]">{item.quantity}</span>
                                ) : (
                                   <div className="flex flex-col gap-1 items-center animate-in slide-in-from-top-1">
                                     <input 
                                       type="number" 
                                       value={editQty}
                                       onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                                       className="w-16 px-1 py-0.5 text-center text-[12px] border border-[#2271b1] rounded-[2px] outline-none"
                                     />
                                     <input 
                                       type="text" 
                                       value={editReason}
                                       onChange={(e) => setEditReason(e.target.value)}
                                       placeholder="Reason..."
                                       className="w-24 px-1 py-0.5 text-[10px] border border-[#c3c4c7] rounded-[2px] outline-none"
                                     />
                                     <div className="flex gap-1 mt-1">
                                       <button onClick={() => handleSaveAdjustment(item.id)} disabled={isSaving} className="text-[10px] bg-[#2271b1] text-white px-2 py-0.5 rounded-[2px]">Save</button>
                                       <button onClick={() => setEditingId(null)} className="text-[10px] bg-[#f0f0f1] text-[#3c434a] border border-[#c3c4c7] px-2 py-0.5 rounded-[2px]">Cancel</button>
                                     </div>
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
      </div>
    </div>
  );
}