// app/admin/inventory/page.tsx

"use client";

import { useState, useEffect } from "react";
import { 
  getInventory, adjustStock, 
  getSuppliers, saveSupplier, deleteSupplier,
  getLocations, saveLocation,
  InventoryItem, SupplierData 
} from "@/app/actions/inventory";
import { toast } from "react-hot-toast";
import { 
  Box, Search, Plus, RefreshCcw, Loader2, 
  MapPin, Users, History, Save, X, Trash2, Pencil,
  ArrowRightLeft, Package
} from "lucide-react";
import Image from "next/image";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"stock" | "suppliers" | "locations">("stock");
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [reason, setReason] = useState("");

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState<any>({});

  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [locForm, setLocForm] = useState<any>({});

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const [invRes, supRes, locRes] = await Promise.all([
      getInventory(searchQuery),
      getSuppliers(),
      getLocations()
    ]);
    
    if (invRes.success) setInventory(invRes.data || []);
    // ✅ FIX: Type safety handled in actions file
    if (supRes.success) setSuppliers(supRes.data || []);
    if (locRes.success) setLocations(locRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  // --- HANDLERS ---

  // 1. Stock Adjustment
  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    const res = await adjustStock(selectedItem.id, adjustmentQty, reason);
    if (res.success) {
      // ✅ FIX: Added 'as string' to fix toast error
      toast.success(res.message as string);
      setIsAdjustModalOpen(false);
      setAdjustmentQty(0);
      setReason("");
      fetchData();
    } else {
      toast.error(res.error as string);
    }
  };

  // 2. Supplier Save
  const handleSupplierSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(supplierForm).forEach(key => formData.append(key, supplierForm[key] || ""));
    
    const res = await saveSupplier(formData);
    if (res.success) {
      toast.success(res.message as string);
      setIsSupplierModalOpen(false);
      fetchData();
    } else {
      toast.error(res.error as string);
    }
  };

  const handleSupplierDelete = async (id: string) => {
    if (!confirm("Delete supplier?")) return;
    const res = await deleteSupplier(id);
    if (res.success) { 
        toast.success(res.message as string); 
        fetchData(); 
    }
  };

  // 3. Location Save
  const handleLocSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(locForm).forEach(key => formData.append(key, locForm[key]));

    const res = await saveLocation(formData);
    if(res.success) { 
        toast.success(res.message as string); 
        setIsLocModalOpen(false); 
        fetchData(); 
    } else {
        toast.error(res.error as string);
    }
  };

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F0F0F1] font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Box className="text-blue-600" /> Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track stock, manage suppliers, and warehouses.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={fetchData} className="px-3 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50 flex gap-2">
             <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> Refresh
           </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { id: "stock", label: "Stock Levels", icon: Package },
          { id: "suppliers", label: "Suppliers", icon: Users },
          { id: "locations", label: "Locations", icon: MapPin },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === tab.id 
                ? "border-blue-600 text-blue-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* === TAB 1: STOCK LEVELS === */}
      {activeTab === "stock" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
           <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gray-50">
              <div className="relative w-72">
                 <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Search product, SKU..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                 />
              </div>
              <div className="text-xs text-slate-500 font-bold">{inventory.length} items</div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                 <thead className="bg-slate-100 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <tr>
                       <th className="p-4 w-16">Image</th>
                       <th className="p-4">Product / Variant</th>
                       <th className="p-4">SKU</th>
                       <th className="p-4">Location</th>
                       <th className="p-4 text-center">Available</th>
                       <th className="p-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => (
                       <tr key={item.id} className="hover:bg-blue-50/30 transition">
                          <td className="p-4">
                             <div className="w-10 h-10 bg-slate-100 rounded border overflow-hidden flex items-center justify-center">
                                {item.image ? (
                                   <img src={item.image} alt="" className="w-full h-full object-cover" />
                                ) : <Box size={16} className="text-slate-300"/>}
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="font-bold text-slate-800">{item.productName}</div>
                             {item.variantName && <div className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">{item.variantName}</div>}
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-500">{item.sku || "—"}</td>
                          <td className="p-4 text-slate-600 flex items-center gap-1"><MapPin size={12}/> {item.locationName}</td>
                          <td className="p-4 text-center font-bold">
                             <span className={item.quantity > 5 ? "text-green-600" : "text-red-600"}>{item.quantity}</span>
                          </td>
                          <td className="p-4 text-right">
                             <button 
                                onClick={() => { setSelectedItem(item); setIsAdjustModalOpen(true); }}
                                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold hover:bg-slate-50 transition"
                             >
                                Adjust
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* === TAB 2: SUPPLIERS === */}
      {activeTab === "suppliers" && (
        <div className="space-y-4 animate-in fade-in">
           <div className="flex justify-end">
              <button onClick={() => { setSupplierForm({}); setIsSupplierModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
                 <Plus size={16}/> Add Supplier
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suppliers.map((sup) => (
                 <div key={sup.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-bold text-lg text-slate-800">{sup.name}</h3>
                       <div className="flex gap-2">
                          <button onClick={() => { setSupplierForm(sup); setIsSupplierModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Pencil size={14}/></button>
                          <button onClick={() => handleSupplierDelete(sup.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={14}/></button>
                       </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                       <div className="flex gap-2"><Users size={14} className="mt-0.5 text-slate-400"/> {sup.contactName || "—"}</div>
                       <div className="flex gap-2"><Box size={14} className="mt-0.5 text-slate-400"/> {sup.email || "—"}</div>
                       <div className="flex gap-2"><MapPin size={14} className="mt-0.5 text-slate-400"/> {sup.address || "—"}</div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* === TAB 3: LOCATIONS === */}
      {activeTab === "locations" && (
         <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-end">
               <button onClick={() => { setLocForm({}); setIsLocModalOpen(true); }} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
                  <Plus size={16}/> Add Location
               </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b text-xs font-bold uppercase text-slate-500">
                     <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Address</th>
                        <th className="p-4">Stock Items</th>
                        <th className="p-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {locations.map(loc => (
                        <tr key={loc.id} className="border-b last:border-0 hover:bg-gray-50">
                           <td className="p-4 font-bold text-slate-800">{loc.name} {loc.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-2">DEFAULT</span>}</td>
                           <td className="p-4 text-slate-600">{loc.address}</td>
                           <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{loc._count.inventoryLevels}</span></td>
                           <td className="p-4 text-right">
                              <button onClick={() => { setLocForm(loc); setIsLocModalOpen(true); }} className="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      {/* === MODALS === */}
      {/* ... (Modals code remains same as before) ... */}
      
      {/* (MODAL CODE - Copied for completeness) */}
      {isAdjustModalOpen && selectedItem && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Adjust Stock</h3>
                  <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-red-500"><X/></button>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm flex gap-3">
                  {selectedItem.image && <img src={selectedItem.image} className="w-12 h-12 rounded object-cover border"/>}
                  <div>
                     <p className="font-bold text-slate-800">{selectedItem.productName}</p>
                     <p className="text-xs text-slate-500">{selectedItem.variantName} | {selectedItem.locationName}</p>
                     <p className="text-xs mt-1">Current Stock: <strong>{selectedItem.quantity}</strong></p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div><label className="block text-sm font-bold mb-1">Adjustment (+ / -)</label><input type="number" className="w-full border p-2 rounded" placeholder="e.g. 10 or -5" onChange={(e) => setAdjustmentQty(parseInt(e.target.value))} /></div>
                  <div><label className="block text-sm font-bold mb-1">Reason</label><input type="text" className="w-full border p-2 rounded" placeholder="e.g. Restock, Return" onChange={(e) => setReason(e.target.value)} /></div>
                  <div className="pt-4 flex gap-2"><button onClick={handleAdjustStock} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Save Adjustment</button></div>
               </div>
            </div>
         </div>
      )}
      
      {isSupplierModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
               <h3 className="text-xl font-bold mb-6">{supplierForm.id ? "Edit" : "Add"} Supplier</h3>
               <form onSubmit={handleSupplierSave} className="space-y-4">
                  <input type="hidden" name="id" value={supplierForm.id || ""} />
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs font-bold">Company Name *</label><input required name="name" defaultValue={supplierForm.name} className="w-full border p-2 rounded mt-1"/></div>
                     <div><label className="text-xs font-bold">Contact Person</label><input name="contactName" defaultValue={supplierForm.contactName} className="w-full border p-2 rounded mt-1"/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-xs font-bold">Email</label><input name="email" defaultValue={supplierForm.email} className="w-full border p-2 rounded mt-1"/></div>
                     <div><label className="text-xs font-bold">Phone</label><input name="phone" defaultValue={supplierForm.phone} className="w-full border p-2 rounded mt-1"/></div>
                  </div>
                  <div><label className="text-xs font-bold">Address</label><textarea name="address" defaultValue={supplierForm.address} className="w-full border p-2 rounded mt-1" rows={2}/></div>
                  <div className="flex justify-end gap-2 mt-4">
                     <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 border rounded text-sm hover:bg-slate-50">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-bold hover:bg-slate-800">Save Supplier</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {isLocModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
               <h3 className="text-xl font-bold mb-6">{locForm.id ? "Edit" : "Add"} Location</h3>
               <form onSubmit={handleLocSave} className="space-y-4">
                  <input type="hidden" name="id" value={locForm.id || ""} />
                  <div><label className="text-xs font-bold">Location Name *</label><input required name="name" defaultValue={locForm.name} className="w-full border p-2 rounded mt-1"/></div>
                  <div><label className="text-xs font-bold">Address</label><textarea name="address" defaultValue={locForm.address} className="w-full border p-2 rounded mt-1" rows={3}/></div>
                  <div className="flex justify-end gap-2 mt-4">
                     <button type="button" onClick={() => setIsLocModalOpen(false)} className="px-4 py-2 border rounded text-sm hover:bg-slate-50">Cancel</button>
                     <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-bold hover:bg-slate-800">Save Location</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}