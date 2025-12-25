// app/admin/shipments/page.tsx

"use client";

import { useState, useEffect } from "react";
import { 
  getShipments, updateTracking, 
  markAsDelivered, deleteShipment, ShipmentData 
} from "@/app/actions/admin/shipment";
import { toast } from "react-hot-toast";
import { 
  Truck, Search, RefreshCcw, Loader2, 
  MapPin, PackageCheck, Pencil, Trash2,
  ExternalLink, X, Save, Calendar
} from "lucide-react";
import Link from "next/link";

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ShipmentData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getShipments(searchQuery);
    if (res.success) setShipments(res.data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  // --- HANDLERS ---
  const handleMarkDelivered = async (id: string) => {
    if(!confirm("Mark this shipment as Delivered? This will also update the Order status.")) return;
    const res = await markAsDelivered(id);
    if(res.success) {
      // ✅ FIX: Added 'as string' to satisfy TypeScript
      toast.success(res.message as string);
      fetchData();
    } else {
      // ✅ FIX: Added 'as string'
      toast.error(res.error as string);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this shipment record?")) return;
    const res = await deleteShipment(id);
    if(res.success) {
      // ✅ FIX: Added 'as string'
      toast.success(res.message as string);
      fetchData();
    } else {
       toast.error(res.error as string || "Failed to delete");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!editingItem) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const res = await updateTracking(formData);
    
    if(res.success) {
      // ✅ FIX: Added 'as string'
      toast.success(res.message as string);
      setEditingItem(null);
      fetchData();
    } else {
      // ✅ FIX: Added 'as string'
      toast.error(res.error as string);
    }
  };

  const formatDate = (date: Date | null) => {
    if(!date) return "-";
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-blue-600" /> Shipments
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage order fulfillments.</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50 flex gap-2">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
           <input 
             type="text" 
             placeholder="Search order #, tracking..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition"
           />
        </div>
        <div className="text-xs text-slate-500 font-bold">
           Total: {shipments.length}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
        {loading ? (
            <div className="p-20 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
        ) : shipments.length === 0 ? (
            <div className="p-20 text-center text-slate-500">No shipments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Date Shipped</th>
                  <th className="p-4">Courier</th>
                  <th className="p-4">Tracking</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((ship) => (
                  <tr key={ship.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-4">
                       <Link href={`/admin/orders/${ship.order.id}`} className="font-bold text-blue-600 hover:underline">
                          #{ship.order.orderNumber}
                       </Link>
                       <div className="text-xs text-slate-500 mt-0.5">{ship.order.user?.name || "Guest"}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                       <div className="flex items-center gap-1">
                          <Calendar size={12}/> {formatDate(ship.shippedDate)}
                       </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                       {ship.courier || "N/A"}
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{ship.trackingNumber || "N/A"}</span>
                          {ship.trackingUrl && (
                             <a href={ship.trackingUrl} target="_blank" className="text-blue-500 hover:text-blue-700">
                                <ExternalLink size={14}/>
                             </a>
                          )}
                       </div>
                    </td>
                    <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">
                       <MapPin size={12} className="inline mr-1"/>
                       {ship.order.shippingAddress?.city}, {ship.order.shippingAddress?.country}
                    </td>
                    <td className="p-4 text-center">
                       {ship.deliveredDate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                             <PackageCheck size={12}/> Delivered
                          </span>
                       ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                             <Truck size={12}/> In Transit
                          </span>
                       )}
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {!ship.deliveredDate && (
                             <button onClick={() => handleMarkDelivered(ship.id)} className="p-2 text-green-600 hover:bg-green-50 rounded border" title="Mark as Delivered">
                                <PackageCheck size={16} />
                             </button>
                          )}
                          <button onClick={() => setEditingItem(ship)} className="p-2 text-blue-600 hover:bg-blue-50 rounded border" title="Edit Tracking">
                             <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(ship.id)} className="p-2 text-red-600 hover:bg-red-50 rounded border" title="Delete">
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === EDIT MODAL === */}
      {editingItem && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Update Tracking</h3>
                  <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-red-500"><X/></button>
               </div>
               
               <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <input type="hidden" name="id" value={editingItem.id} />
                  
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Courier Service</label>
                     <input name="courier" defaultValue={editingItem.courier || ""} className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" placeholder="e.g. DHL, FedEx, Pathao"/>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Tracking Number</label>
                     <input name="trackingNumber" defaultValue={editingItem.trackingNumber || ""} className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" placeholder="e.g. TRK123456789"/>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Tracking URL</label>
                     <input name="trackingUrl" defaultValue={editingItem.trackingUrl || ""} className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" placeholder="https://courier.com/track/..."/>
                  </div>

                  <div className="pt-4 flex gap-2">
                     <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 border rounded text-sm font-bold hover:bg-slate-50">Cancel</button>
                     <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Save size={16}/> Save Changes
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}