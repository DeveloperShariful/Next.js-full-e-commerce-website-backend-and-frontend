// app/admin/coupons/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getCoupons, saveCoupon, deleteCoupon, CouponData } from "@/app/actions/admin/coupon";
import { toast } from "react-hot-toast";
import { 
  TicketPercent, Plus, Search, Trash2, Pencil, 
  Calendar, CheckCircle2, XCircle, Save, X, Loader2 
} from "lucide-react";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    minSpend: "",
    usageLimit: "",
    endDate: "",
    isActive: true
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const res = await getCoupons();
    if (res.success) setCoupons(res.data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleEdit = (coupon: CouponData) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toString(),
      minSpend: coupon.minSpend ? coupon.minSpend.toString() : "",
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : "",
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : "",
      isActive: coupon.isActive
    });
    setViewMode("form");
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this coupon?")) return;
    const res = await deleteCoupon(id);
    if(res.success) {
        // ✅ FIX: Type Assertion
        toast.success(res.message as string);
        fetchData();
    } else {
        // ✅ FIX: Type Assertion
        toast.error(res.error as string);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const data = new FormData();
    if(editingId) data.append("id", editingId);
    data.append("code", formData.code);
    data.append("type", formData.type);
    data.append("value", formData.value);
    data.append("minSpend", formData.minSpend);
    data.append("usageLimit", formData.usageLimit);
    data.append("endDate", formData.endDate);
    data.append("isActive", String(formData.isActive));

    const res = await saveCoupon(data);
    setSubmitting(false);

    if (res.success) {
      // ✅ FIX: Type Assertion
      toast.success(res.message as string);
      setViewMode("list");
      setEditingId(null);
      setFormData({ code: "", type: "PERCENTAGE", value: "", minSpend: "", usageLimit: "", endDate: "", isActive: true });
      fetchData();
    } else {
      // ✅ FIX: Type Assertion
      toast.error(res.error as string);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TicketPercent className="text-blue-600" /> Coupons
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage discount codes for your customers.</p>
        </div>
        {viewMode === "list" ? (
            <button onClick={() => setViewMode("form")} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium shadow-lg">
                <Plus size={18} /> Add Coupon
            </button>
        ) : (
            <button onClick={() => {setViewMode("list"); setEditingId(null);}} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium">
                <X size={18} /> Cancel
            </button>
        )}
      </div>

      {viewMode === "form" ? (
        // === FORM VIEW ===
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-xl mb-6 text-slate-800 border-b pb-4">
                {editingId ? "Edit Coupon" : "Create New Coupon"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Coupon Code</label>
                        <input 
                            required
                            type="text" 
                            value={formData.code}
                            onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. SUMMER20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Status</label>
                        <select 
                            value={String(formData.isActive)}
                            onChange={e => setFormData({...formData, isActive: e.target.value === "true"})}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Discount Type</label>
                        <select 
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value})}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED_AMOUNT">Fixed Amount</option>
                            <option value="FREE_SHIPPING">Free Shipping</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Coupon Amount</label>
                        <input 
                            required
                            type="number" 
                            value={formData.value}
                            onChange={e => setFormData({...formData, value: e.target.value})}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Min Spend</label>
                        <input 
                            type="number" 
                            value={formData.minSpend}
                            onChange={e => setFormData({...formData, minSpend: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="No limit"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Usage Limit</label>
                        <input 
                            type="number" 
                            value={formData.usageLimit}
                            onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Unlimited"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Expiry Date</label>
                        <input 
                            type="date" 
                            value={formData.endDate}
                            onChange={e => setFormData({...formData, endDate: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
                >
                    {submitting ? <Loader2 className="animate-spin"/> : <Save size={18}/>} 
                    {editingId ? "Update Coupon" : "Save Coupon"}
                </button>
            </form>
        </div>
      ) : (
        // === LIST VIEW ===
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 bg-gray-50 flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="text" placeholder="Search coupons..." className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"/>
                </div>
                <div className="text-xs text-slate-500 font-medium">{coupons.length} coupons</div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                        <tr>
                            <th className="p-4">Code</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4 text-center">Usage</th>
                            <th className="p-4">Expiry</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="p-10 text-center text-slate-500">Loading...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan={7} className="p-10 text-center text-slate-500">No coupons found.</td></tr>
                        ) : (
                            coupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-blue-50/30 transition group">
                                    <td className="p-4 font-mono font-bold text-blue-600">{coupon.code}</td>
                                    <td className="p-4 text-xs font-medium text-slate-500 bg-slate-50 inline-block rounded px-2 py-1 mt-3">{coupon.type.replace('_', ' ')}</td>
                                    <td className="p-4 font-bold text-slate-700">
                                        {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `৳${coupon.value}`}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                                            {coupon.usedCount} / {coupon.usageLimit || "∞"}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-500">
                                        {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : "Never expires"}
                                    </td>
                                    <td className="p-4 text-center">
                                        {coupon.isActive ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">Active</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">Inactive</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(coupon)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"><Pencil size={16}/></button>
                                            <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
}