// app/admin/inventory/_components/adjust-stock-modal.tsx

"use client";

import { useState } from "react";
import { adjustStock } from "@/app/actions/admin/inventory/inventory";
import { toast } from "react-hot-toast";
import { X, Loader2 } from "lucide-react";

interface AdjustStockModalProps {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdjustStockModal({ item, onClose, onSuccess }: AdjustStockModalProps) {
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (qty === 0) return toast.error("Enter a valid quantity");
    
    setLoading(true);
    const res = await adjustStock(item.id, qty, reason);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      onSuccess();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Adjust Stock</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition"><X size={20}/></button>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg mb-5 flex gap-3 border border-slate-100">
          <div className="w-12 h-12 bg-white rounded border overflow-hidden shrink-0">
             {item.image && <img src={item.image} className="w-full h-full object-cover"/>}
          </div>
          <div>
             <p className="font-bold text-slate-800 text-sm">{item.name}</p>
             <p className="text-xs text-slate-500">{item.variant ? item.variant : "Base Product"}</p>
             <p className="text-xs mt-1 text-slate-700">Current: <strong>{item.quantity}</strong></p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment (+ Add / - Reduce)</label>
            <input 
              type="number" 
              className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. 10 or -5" 
              onChange={(e) => setQty(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. Restock, Damaged, Return" 
              onChange={(e) => setReason(e.target.value)} 
            />
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition flex justify-center gap-2 mt-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="animate-spin" size={18}/>} Save Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}