// app/admin/inventory/_components/suppliers-view.tsx

"use client";

import { useState, useEffect } from "react";
import { getSuppliers, upsertSupplier, deleteSupplier } from "@/app/actions/backend/inventory/supplier-actions";
import { SupplierData } from "../types";
import { Plus, Loader2, Users, MapPin, Mail, Phone, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function SuppliersView() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<SupplierData> | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    const res = await getSuppliers();
    if (res.success) setSuppliers(res.data as SupplierData[]);
    setLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    const toastId = toast.loading("Deleting...");
    const res = await deleteSupplier(id);
    if (res.success) { 
      toast.success(res.message as string, { id: toastId }); 
      fetchSuppliers(); 
    } else toast.error(res.error as string, { id: toastId });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const toastId = toast.loading("Saving supplier...");
    
    const res = await upsertSupplier(formData);
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      setIsModalOpen(false);
      fetchSuppliers();
    } else {
      toast.error(res.error as string, { id: toastId });
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {/* 🚀 WP Style Header & Add Button */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Manage Suppliers</h2>
        <button 
          onClick={() => { setEditingData({}); setIsModalOpen(true); }} 
          className="px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-[3px] transition-colors shadow-sm"
        >
          Add New
        </button>
      </div>

      {/* 🚀 WP Style Inline Form (Instead of Modal) */}
      {isModalOpen && (
        <div className="mb-4 bg-white border border-[#c3c4c7] p-4 shadow-sm animate-in slide-in-from-top-2">
          <h3 className="text-[14px] font-semibold text-[#1d2327] mb-4 border-b border-[#f0f0f1] pb-2">
            {editingData?.id ? "Edit Supplier" : "Add New Supplier"}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="hidden" name="id" value={editingData?.id || ""} />
            
            <div>
              <label className="block text-[13px] text-[#3c434a] mb-1">Company Name <span className="text-[#d63638]">*</span></label>
              <input required name="name" defaultValue={editingData?.name} className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" />
            </div>
            
            <div>
              <label className="block text-[13px] text-[#3c434a] mb-1">Contact Person</label>
              <input name="contactPerson" defaultValue={editingData?.contactPerson || ""} className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" />
            </div>
            
            <div>
              <label className="block text-[13px] text-[#3c434a] mb-1">Email Address</label>
              <input type="email" name="email" defaultValue={editingData?.email || ""} className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" />
            </div>
            
            <div>
              <label className="block text-[13px] text-[#3c434a] mb-1">Phone Number</label>
              <input name="phone" defaultValue={editingData?.phone || ""} className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[13px] text-[#3c434a] mb-1">Full Address</label>
              <input name="address" defaultValue={editingData?.address || ""} className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" />
            </div>
            
            <div className="md:col-span-2 pt-2 flex items-center gap-2">
              <button type="submit" className="px-3 py-1.5 bg-[#2271b1] text-white text-[13px] rounded-[3px] hover:bg-[#135e96] shadow-sm border border-[#2271b1]">Save Supplier</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-[#d63638] text-[13px] hover:underline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* 🚀 WP List Table */}
      <div className="bg-white border border-[#c3c4c7] shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[800px]">
               
               <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
                  <tr>
                     <th className="p-2 w-48 font-medium">Company Name</th>
                     <th className="p-2 w-48">Contact Info</th>
                     <th className="p-2 min-w-[200px]">Address</th>
                     <th className="p-2 w-24 text-center">Active P.O.</th>
                     <th className="p-2 w-32">Created</th>
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-[#f0f0f1]">
                  {loading ? (
                     <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin text-[#2271b1] mx-auto"/></td></tr>
                  ) : suppliers.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-[#50575e] italic">No suppliers found.</td></tr>
                  ) : (
                     suppliers.map((sup, index) => {
                       const isEven = index % 2 === 0;

                       return (
                          <tr key={sup.id} className={`group hover:bg-[#f0f6fc] transition-colors ${isEven ? 'bg-[#f9f9f9]' : 'bg-white'}`}>
                             
                             {/* Name & Row Actions */}
                             <td className="p-2 align-top pt-[10px]">
                                <div className="font-semibold text-[#2271b1]">{sup.name}</div>
                                
                                {/* WP Style Row Actions */}
                                <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                   <button onClick={() => { setEditingData(sup); setIsModalOpen(true); }} className="text-[#2271b1] hover:underline">Edit</button>
                                   <span className="text-[#c3c4c7]">|</span>
                                   <button onClick={() => handleDelete(sup.id)} className="text-[#d63638] hover:underline">Delete</button>
                                </div>
                             </td>
                             
                             {/* Contact Info */}
                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                                <div className="space-y-1">
                                  {sup.contactPerson && <div className="flex items-center gap-1.5"><Users size={12} className="text-[#8c8f94]"/> {sup.contactPerson}</div>}
                                  {sup.email && <div className="flex items-center gap-1.5"><Mail size={12} className="text-[#8c8f94]"/> <a href={`mailto:${sup.email}`} className="text-[#2271b1] hover:underline">{sup.email}</a></div>}
                                  {sup.phone && <div className="flex items-center gap-1.5"><Phone size={12} className="text-[#8c8f94]"/> {sup.phone}</div>}
                                </div>
                             </td>

                             {/* Address */}
                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                                {sup.address ? (
                                  <div className="flex items-start gap-1.5">
                                    <MapPin size={12} className="text-[#8c8f94] mt-1 shrink-0"/> 
                                    <span className="leading-relaxed">{sup.address}</span>
                                  </div>
                                ) : "—"}
                             </td>

                             {/* Purchase Orders Count */}
                             <td className="p-2 text-center align-top pt-[10px]">
                                <span className="font-semibold text-[#2271b1]">
                                   {sup._count?.purchaseOrders || 0}
                                </span>
                             </td>

                             {/* Created At */}
                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                               {format(new Date(sup.createdAt), "yyyy/MM/dd")}
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