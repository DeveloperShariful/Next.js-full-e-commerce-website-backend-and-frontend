// app/admin/inventory/_components/locations-view.tsx

"use client";

import { useState, useEffect } from "react";
import { getLocations, saveLocation } from "@/app/actions/admin/inventory/inventory";
import { Plus, MapPin, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export function LocationsView() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchLocs = async () => {
    setLoading(true);
    const res = await getLocations();
    if (res.success) setLocations(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLocs(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await saveLocation(null, formData);
    if (res.success) {
      toast.success(res.message || "Location saved successfully");
      setIsModalOpen(false);
      fetchLocs();
    } else {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-end">
         <button onClick={() => { setEditingData({}); setIsModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
            <Plus size={16}/> Add Location
         </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase text-slate-500">
               <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Address</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4 text-right">Actions</th>
               </tr>
            </thead>
            <tbody>
               {loading ? (
                  <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-400"/></td></tr>
               ) : locations.map(loc => (
                  <tr key={loc.id} className="border-b last:border-0 hover:bg-gray-50">
                     <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400"/>
                        {loc.name} {loc.isDefault && <span className="bg-green-100 text-green-700 text-[10px] px-1.5 rounded">DEFAULT</span>}
                     </td>
                     <td className="p-4 text-slate-600">{loc.address || "—"}</td>
                     <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{loc._count?.inventoryLevels || 0}</span></td>
                     <td className="p-4 text-right">
                        <button onClick={() => { setEditingData(loc); setIsModalOpen(true); }} className="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
              <h3 className="text-xl font-bold mb-6">{editingData.id ? "Edit" : "Add"} Location</h3>
              <form onSubmit={handleSave} className="space-y-4">
                 <input type="hidden" name="id" value={editingData.id || ""} />
                 <div><label className="text-xs font-bold">Location Name *</label><input required name="name" defaultValue={editingData.name} className="w-full border p-2 rounded mt-1 outline-none focus:ring-1"/></div>
                 <div><label className="text-xs font-bold">Address</label><textarea name="address" defaultValue={editingData.address} className="w-full border p-2 rounded mt-1 outline-none focus:ring-1" rows={3}/></div>
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