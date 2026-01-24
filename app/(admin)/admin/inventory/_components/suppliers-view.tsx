// app/admin/inventory/_components/suppliers-view.tsx

"use client";

import { useState, useEffect } from "react";
import { getSuppliers, saveSupplier, deleteSupplier } from "@/app/actions/admin/inventory/inventory";
import { Plus, Pencil, Trash2, Users, MapPin, Mail, Phone, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function SuppliersView() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    const res = await getSuppliers();
    if (res.success) setSuppliers(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteSupplier(id);
    if (res.success) { toast.success("Deleted"); fetchSuppliers(); }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await saveSupplier(null, formData);
    if (res.success) {
      toast.success(res.message || "Supplier saved successfully");
      setIsModalOpen(false);
      fetchSuppliers();
    } else {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-end">
         <button onClick={() => { setEditingData({}); setIsModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
            <Plus size={16}/> Add Supplier
         </button>
      </div>

      {loading ? (
         <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-400"/></div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((sup) => (
               <div key={sup.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-4">
                     <h3 className="font-bold text-lg text-slate-800">{sup.name}</h3>
                     <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => { setEditingData(sup); setIsModalOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"><Pencil size={14}/></button>
                        <button onClick={() => handleDelete(sup.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14}/></button>
                     </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                     <div className="flex gap-2 items-center"><Users size={14} className="text-slate-400"/> {sup.contactName || "—"}</div>
                     <div className="flex gap-2 items-center"><Mail size={14} className="text-slate-400"/> {sup.email || "—"}</div>
                     <div className="flex gap-2 items-center"><Phone size={14} className="text-slate-400"/> {sup.phone || "—"}</div>
                     <div className="flex gap-2 items-center"><MapPin size={14} className="text-slate-400"/> {sup.address || "—"}</div>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Simplified Modal inside Component for cleanliness */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
              <h3 className="text-xl font-bold mb-6">{editingData.id ? "Edit" : "Add"} Supplier</h3>
              <form onSubmit={handleSave} className="space-y-4">
                 <input type="hidden" name="id" value={editingData.id || ""} />
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold">Company Name *</label><input required name="name" defaultValue={editingData.name} className="w-full border p-2 rounded mt-1 outline-none focus:ring-1"/></div>
                    <div><label className="text-xs font-bold">Contact Person</label><input name="contactName" defaultValue={editingData.contactName} className="w-full border p-2 rounded mt-1 outline-none focus:ring-1"/></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold">Email</label><input type="email" name="email" defaultValue={editingData.email} className="w-full border p-2 rounded mt-1 outline-none focus:ring-1"/></div>
                    <div><label className="text-xs font-bold">Phone</label><input name="phone" defaultValue={editingData.phone} className="w-full border p-2 rounded mt-1 outline-none focus:ring-1"/></div>
                 </div>
                 <div><label className="text-xs font-bold">Address</label><textarea name="address" defaultValue={editingData.address} className="w-full border p-2 rounded mt-1 outline-none focus:ring-1" rows={2}/></div>
                 <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-slate-50 text-sm">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 text-sm">Save</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}