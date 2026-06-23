// File: app/admin/settings/shipping/_components/Carriers/Carrier_Service_List.tsx

"use client";

import { useState } from "react";
import { saveCarrierService, toggleCarrierStatus, deleteCarrierService } from "@/app/actions/backend/settings/shipping/carriers";
import { CarrierService } from "@prisma/client";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

    // WP Input Class Helper for Modal
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white";

    return (
        <div className="w-full text-[13px] text-[#3c434a] mb-[30px]">
            
            {/* WP Page Title & Action */}
            <div className="flex items-center gap-3 mb-[15px]">
                <h2 className="text-[23px] font-normal text-[#1d2327] m-0">Other Carriers</h2>
                <button 
                    onClick={() => openModal(null)} 
                    className="bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[10px] py-[2px] text-[13px] font-semibold cursor-pointer"
                >
                    Add Custom Carrier
                </button>
            </div>
            <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">Connect other courier services (e.g. Pathao, DHL) via API if Transdirect does not cover your needs.</p>

            {/* WP List Table */}
            <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Carrier Name</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Mode</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Status</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carriers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-[10px] py-[20px] text-center text-[#646970] italic">
                                    No custom carriers added. Use Transdirect for integrated Australian shipping.
                                </td>
                            </tr>
                        ) : carriers.map((carrier, index) => (
                            <tr key={carrier.id} className={`border-b border-[#f0f0f1] last:border-none hover:bg-[#f6f7f7] ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                <td className="px-[10px] py-[10px] text-[#2271b1] font-bold">
                                    {carrier.name}
                                </td>
                                <td className="px-[10px] py-[10px] text-[#646970] font-mono text-[11px] uppercase">
                                    {carrier.isSandbox ? "Sandbox" : "Live"}
                                </td>
                                <td className="px-[10px] py-[10px]">
                                    {carrier.isEnabled ? (
                                        <span className="text-[#007017] font-semibold">Enabled</span>
                                    ) : (
                                        <span className="text-[#d63638]">Disabled</span>
                                    )}
                                </td>
                                <td className="px-[10px] py-[10px] text-right">
                                    <div className="flex justify-end gap-2 text-[13px]">
                                        <button 
                                            onClick={() => handleToggle(carrier.id, carrier.isEnabled)}
                                            className="bg-transparent border-none text-[#2271b1] hover:underline cursor-pointer p-0"
                                        >
                                            {carrier.isEnabled ? "Disable" : "Enable"}
                                        </button>
                                        <span className="text-[#c3c4c7]">|</span>
                                        <button 
                                            onClick={() => openModal(carrier)}
                                            className="bg-transparent border-none text-[#2271b1] hover:underline cursor-pointer p-0"
                                        >
                                            Configure
                                        </button>
                                        <span className="text-[#c3c4c7]">|</span>
                                        <button 
                                            onClick={() => handleDelete(carrier.id)}
                                            className="bg-transparent border-none text-[#d63638] hover:underline cursor-pointer p-0"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* WP Style Flat Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#000000b3] z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-[#f0f0f1] shadow-md w-full max-w-md flex flex-col font-sans text-[13px] text-[#3c434a]">
                        
                        <div className="flex justify-between items-center px-[20px] py-[15px] border-b border-[#c3c4c7] bg-white shrink-0">
                            <h3 className="text-[18px] font-normal text-[#1d2327] m-0 leading-tight">
                                {editingCarrier ? "Edit Carrier" : "Add Carrier"}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="bg-white p-[20px]">
                            <form id="carrier-form" onSubmit={handleSubmit} className="space-y-[15px]">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Service Name</label>
                                    <input name="name" required defaultValue={editingCarrier?.name || ""} placeholder="e.g. Pathao Courier" className={wpInputClass}/>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">API Key</label>
                                    <input name="apiKey" defaultValue={editingCarrier?.apiKey || ""} type="password" placeholder="••••••••" className={wpInputClass}/>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">API Secret</label>
                                    <input name="apiSecret" defaultValue={editingCarrier?.apiSecret || ""} type="password" placeholder="••••••••" className={wpInputClass}/>
                                </div>
                                <div className="mt-[10px]">
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input type="checkbox" name="isSandbox" defaultChecked={editingCarrier?.isSandbox ?? true} className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4"/>
                                        <span className="text-[13px] text-[#3c434a]">Sandbox Mode (Test Environment)</span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        <div className="p-[15px] border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
                            <button 
                                type="button" onClick={() => setIsModalOpen(false)} 
                                className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" form="carrier-form" disabled={loading} 
                                className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[30px]"
                            >
                                {loading && <Loader2 size={14} className="animate-spin"/>} 
                                Save Configuration
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}