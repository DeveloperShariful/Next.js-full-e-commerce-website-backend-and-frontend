// app/admin/inventory/_components/stock-view.tsx

"use client";

import { useState, useEffect } from "react";
import { getInventory } from "@/app/actions/inventory";
import { Search, MapPin, Box, Loader2 } from "lucide-react";
import { AdjustStockModal } from "./adjust-stock-modal";

export function StockView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getInventory(search);
    if (res.success) setData(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by product, SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
            />
         </div>
         <div className="text-xs font-bold text-slate-500 uppercase">{data.length} Items Found</div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
               <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                  <tr>
                     <th className="p-4">Product</th>
                     <th className="p-4">SKU</th>
                     <th className="p-4">Location</th>
                     <th className="p-4 text-center">Stock</th>
                     <th className="p-4 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                     <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto"/></td></tr>
                  ) : data.length === 0 ? (
                     <tr><td colSpan={5} className="p-20 text-center text-slate-400">No inventory records found.</td></tr>
                  ) : (
                     data.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition group">
                           <td className="p-4 flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded border overflow-hidden flex items-center justify-center shrink-0">
                                 {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : <Box size={16} className="text-slate-300"/>}
                              </div>
                              <div>
                                 <div className="font-bold text-slate-800">{item.name}</div>
                                 {item.variant && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{item.variant}</span>}
                              </div>
                           </td>
                           <td className="p-4 font-mono text-xs text-slate-500">{item.sku || "—"}</td>
                           <td className="p-4 text-slate-600"><span className="flex items-center gap-1"><MapPin size={12}/> {item.location}</span></td>
                           <td className="p-4 text-center">
                              <span className={`font-bold px-2 py-1 rounded text-xs ${item.quantity > 5 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                 {item.quantity}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <button 
                                 onClick={() => setSelectedItem(item)}
                                 className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-900 hover:text-white transition"
                              >
                                 Adjust
                              </button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <AdjustStockModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onSuccess={() => { setSelectedItem(null); fetchData(); }} 
        />
      )}
    </div>
  );
}