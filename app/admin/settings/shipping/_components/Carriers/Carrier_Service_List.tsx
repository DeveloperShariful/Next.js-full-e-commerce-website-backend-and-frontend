// File: app/admin/settings/shipping/_components/Carriers/Carrier_Service_List.tsx

"use client";

import { useState } from "react";
import { saveCarrierService, toggleCarrierStatus, deleteCarrierService } from "@/app/actions/settings/shipping/carriers";
import { CarrierService } from "@prisma/client";
import { Truck, Plus, Power, Settings, Trash2, Save, X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
    carriers: CarrierService[];
    refreshData: () => void;
}

export default function Carrier_Service_List({ carriers, refreshData }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCarrier, setEditingCarrier] = useState<CarrierService | null>(null);
    const [loading, setLoading] = useState(false);

    // --- HANDLERS ---
    const handleToggle = async (id: string, current: boolean) => {
        const res = await toggleCarrierStatus(id, !current);
        if(res.success) {
            toast.success("Status updated");
            refreshData();
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete this carrier integration?")) {
            const res = await deleteCarrierService(id);
            if(res.success) {
                toast.success("Carrier deleted");
                refreshData();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        if(editingCarrier) formData.append("id", editingCarrier.id);
        
        // Checkbox manual handle
        const form = e.target as HTMLFormElement;
        formData.set("isSandbox", String(form['isSandbox'].checked));

        const res = await saveCarrierService(formData);
        if(res.success) {
            toast.success(res.message || "Saved");
            setIsModalOpen(false);
            refreshData();
        } else {
            toast.error(res.error || "Error");
        }
        setLoading(false);
    };

    const openModal = (carrier: CarrierService | null) => {
        setEditingCarrier(carrier);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Truck size={20} className="text-[#2271b1]" />
                        Other Carriers
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Connect other courier services (e.g. Pathao, DHL) via API if Transdirect does not cover your needs.
                    </p>
                </div>
                <button onClick={() => openModal(null)} className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] text-sm shadow-sm transition-colors">
                    <Plus size={16} /> Add Custom Carrier
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carriers.map(carrier => (
                    <div key={carrier.id} className={`p-5 rounded-lg border transition-all ${carrier.isEnabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded text-slate-600">
                                    <Truck size={20}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{carrier.name}</h3>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {carrier.isSandbox ? "Sandbox Mode" : "Live Mode"}
                                    </span>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${carrier.isEnabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`}></div>
                        </div>

                        <div className="flex gap-2 border-t pt-4">
                            <button 
                                onClick={() => handleToggle(carrier.id, carrier.isEnabled)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm font-bold border ${carrier.isEnabled ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}
                            >
                                <Power size={14}/> {carrier.isEnabled ? "Disable" : "Enable"}
                            </button>
                            <button 
                                onClick={() => openModal(carrier)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            >
                                <Settings size={14}/> Configure
                            </button>
                            <button 
                                onClick={() => handleDelete(carrier.id)}
                                className="px-3 py-2 rounded border border-red-100 bg-red-50 text-red-600 hover:bg-red-100"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                ))}
                
                {carriers.length === 0 && (
                     <div className="col-span-full p-8 text-center bg-slate-50 rounded border border-dashed border-slate-300 text-slate-500 italic">
                        No custom carriers added. Use Transdirect for integrated Australian shipping.
                     </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-slate-800">{editingCarrier ? "Edit Carrier" : "Add Carrier"}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-slate-400"/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Service Name</label>
                                <input name="name" required defaultValue={editingCarrier?.name || ""} placeholder="e.g. Pathao Courier" className="w-full border p-2 rounded outline-none focus:border-[#2271b1]"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">API Key</label>
                                <input name="apiKey" defaultValue={editingCarrier?.apiKey || ""} type="password" placeholder="••••••••" className="w-full border p-2 rounded outline-none focus:border-[#2271b1]"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">API Secret</label>
                                <input name="apiSecret" defaultValue={editingCarrier?.apiSecret || ""} type="password" placeholder="••••••••" className="w-full border p-2 rounded outline-none focus:border-[#2271b1]"/>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer p-3 border rounded bg-slate-50">
                                <input type="checkbox" name="isSandbox" defaultChecked={editingCarrier?.isSandbox ?? true} className="text-[#2271b1] focus:ring-[#2271b1] rounded"/>
                                <span className="text-sm font-medium text-slate-700">Sandbox Mode (Test)</span>
                            </label>

                            <button type="submit" disabled={loading} className="w-full py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] disabled:opacity-50 flex justify-center items-center gap-2">
                                {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Configuration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}