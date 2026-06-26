// app/admin/inventory/_components/locations-view.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { getLocations, upsertLocation, deleteLocation } from "@/app/actions/backend/inventory/location-actions";
import { LocationData } from "../types";
import { Plus, Loader2, MapPin, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function LocationsView() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Partial<LocationData> | null>(null);

  const fetchLocs = useCallback(async () => {
    setLoading(true);
    const res = await getLocations();
    if (res.success) setLocations(res.data as LocationData[]);
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchLocs(); 
  }, [fetchLocs]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location? Note: You cannot delete a location that holds active inventory.")) return;
    const toastId = toast.loading("Deleting...");
    const res = await deleteLocation(id);
    if (res.success) { 
      toast.success(res.message as string, { id: toastId }); 
      fetchLocs(); 
    } else toast.error(res.error as string, { id: toastId });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const toastId = toast.loading("Saving location...");
    
    const isDefault = (e.currentTarget.elements.namedItem("isDefault") as HTMLInputElement)?.checked;
    const isActive = (e.currentTarget.elements.namedItem("isActive") as HTMLInputElement)?.checked;
    
    formData.set("isDefault", isDefault ? "true" : "false");
    formData.set("isActive", isActive ? "true" : "false");

    const res = await upsertLocation(formData);
    if (res.success) {
      toast.success(res.message as string, { id: toastId });
      setIsModalOpen(false);
      fetchLocs();
    } else {
      toast.error(res.error as string, { id: toastId });
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[14px] font-semibold text-[#1d2327]">Manage Warehouses & Store Locations</h2>
        <button 
          onClick={() => { setEditingData({ isDefault: false, isActive: true }); setIsModalOpen(true); }} 
          className="px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-[3px] transition-colors shadow-sm"
        >
          Add New
        </button>
      </div>

      {isModalOpen && (
        <div className="mb-4 bg-white border border-[#c3c4c7] p-4 shadow-sm animate-in slide-in-from-top-2">
          <h3 className="text-[14px] font-semibold text-[#1d2327] mb-4 border-b border-[#f0f0f1] pb-2">
            {editingData?.id ? "Edit Location" : "Add New Location"}
          </h3>
          <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
            <input type="hidden" name="id" value={editingData?.id || ""} />
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[13px] text-[#3c434a] mb-1">Location Name <span className="text-[#d63638]">*</span></label>
                <input required name="name" defaultValue={editingData?.name} className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" />
              </div>
              
              <div>
                <label className="block text-[13px] text-[#3c434a] mb-1">Full Address</label>
                <textarea name="address" defaultValue={editingData?.address || ""} rows={3} className="w-full px-2 py-[5px] bg-white border border-[#8c8f94] rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" />
              </div>

              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer">
                  <input type="checkbox" name="isDefault" defaultChecked={editingData?.isDefault} className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]" />
                  Set as Default Location
                </label>
                
                <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer">
                  <input type="checkbox" name="isActive" defaultChecked={editingData?.isActive ?? true} className="w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]" />
                  Location is Active
                </label>
              </div>
            </div>
            
            <div className="pt-2 flex items-center gap-2">
              <button type="submit" className="px-3 py-1.5 bg-[#2271b1] text-white text-[13px] rounded-[3px] hover:bg-[#135e96] shadow-sm border border-[#2271b1]">Save Location</button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-[#d63638] text-[13px] hover:underline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-[#c3c4c7] shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#3c434a] border-collapse min-w-[800px]">
               
               <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[13px] font-normal text-[#1d2327]">
                  <tr>
                     <th className="p-2 min-w-[200px] font-medium">Location Name</th>
                     <th className="p-2 w-64">Address</th>
                     <th className="p-2 w-32 text-center">Active Products</th>
                     <th className="p-2 w-24 text-center">Status</th>
                     <th className="p-2 w-32">Created</th>
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-[#f0f0f1]">
                  {loading ? (
                     <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin text-[#2271b1] mx-auto"/></td></tr>
                  ) : locations.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-[#50575e] italic">No locations found.</td></tr>
                  ) : (
                     locations.map((loc, index) => {
                       const isEven = index % 2 === 0;

                       return (
                          <tr key={loc.id} className={`group hover:bg-[#f0f6fc] transition-colors ${isEven ? 'bg-[#f9f9f9]' : 'bg-white'}`}>
                             
                             <td className="p-2 align-top pt-[10px]">
                                <div className="flex items-center gap-1.5 font-semibold text-[#2271b1]">
                                   {loc.name}
                                   {/* 🚀 FIXED: Wrapped CheckCircle in a span with title */}
                                   {loc.isDefault && (
                                     <span title="Default Location">
                                       <CheckCircle size={14} className="text-[#008a20]" />
                                     </span>
                                   )}
                                </div>
                                
                                <div className="text-[12px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                   <button onClick={() => { setEditingData(loc); setIsModalOpen(true); }} className="text-[#2271b1] hover:underline">Edit</button>
                                   {!loc.isDefault && (
                                     <>
                                        <span className="text-[#c3c4c7]">|</span>
                                        <button onClick={() => handleDelete(loc.id)} className="text-[#d63638] hover:underline">Delete</button>
                                     </>
                                   )}
                                </div>
                             </td>
                             
                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                                {loc.address ? (
                                  <div className="flex items-start gap-1.5">
                                    <MapPin size={12} className="text-[#8c8f94] mt-1 shrink-0"/> 
                                    <span className="leading-relaxed line-clamp-2">{loc.address}</span>
                                  </div>
                                ) : "—"}
                             </td>

                             <td className="p-2 text-center align-top pt-[10px]">
                                <span className="font-semibold text-[#2271b1]">
                                   {loc._count?.inventoryLevels || 0}
                                </span>
                             </td>

                             <td className="p-2 text-center align-top pt-[10px]">
                                {loc.isActive ? (
                                  <span className="text-[#008a20] font-semibold text-[11px]">Active</span>
                                ) : (
                                  <span className="text-[#d63638] font-semibold text-[11px]">Inactive</span>
                                )}
                             </td>

                             <td className="p-2 align-top pt-[10px] text-[#50575e]">
                               {format(new Date(loc.createdAt), "yyyy/MM/dd")}
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