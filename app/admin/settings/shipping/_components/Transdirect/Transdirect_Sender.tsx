// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Sender.tsx

"use client";

import { useState } from "react";
import { saveTransdirectSender } from "@/app/actions/settings/shipping/transdirect-sender";
import { TransdirectConfig } from "@prisma/client";
import { Save, Loader2, Building, User } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
    config: TransdirectConfig | null;
    refreshData: () => void;
}

export default function Transdirect_Sender({ config, refreshData }: Props) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        const res = await saveTransdirectSender(formData);
        if (res.success) {
            toast.success(res.message || "Sender details updated");
            refreshData();
        } else {
            toast.error(res.error || "Failed to update");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl animate-in fade-in space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Sender Information</h3>
                <p className="text-sm text-slate-500">This address is used as the pickup location for couriers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Col */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Sender Type</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="senderType" value="business" defaultChecked={!config?.senderType || config.senderType === 'business'} className="w-4 h-4 text-[#2271b1] focus:ring-[#2271b1]" />
                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><Building size={14}/> Business</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="senderType" value="residential" defaultChecked={config?.senderType === 'residential'} className="w-4 h-4 text-[#2271b1] focus:ring-[#2271b1]" />
                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1"><User size={14}/> Residential</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
                        <input name="senderCompany" defaultValue={config?.senderCompany || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
                        <input name="senderName" required defaultValue={config?.senderName || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                        <input name="senderPhone" required defaultValue={config?.senderPhone || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                    </div>
                </div>

                {/* Right Col */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Street Address <span className="text-red-500">*</span></label>
                        <input name="senderAddress" required defaultValue={config?.senderAddress || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Suburb <span className="text-red-500">*</span></label>
                            <input name="senderSuburb" required defaultValue={config?.senderSuburb || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Postcode <span className="text-red-500">*</span></label>
                            <input name="senderPostcode" required defaultValue={config?.senderPostcode || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
                        <select name="senderState" defaultValue={config?.senderState || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1] bg-white">
                            <option value="">Select State</option>
                            <option value="NSW">New South Wales (NSW)</option>
                            <option value="VIC">Victoria (VIC)</option>
                            <option value="QLD">Queensland (QLD)</option>
                            <option value="WA">Western Australia (WA)</option>
                            <option value="SA">South Australia (SA)</option>
                            <option value="TAS">Tasmania (TAS)</option>
                            <option value="ACT">ACT</option>
                            <option value="NT">Northern Territory (NT)</option>
                        </select>
                    </div>
                    
                    <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 mt-4">
                        <strong>Note:</strong> Currently Transdirect integration is optimized for Australian pickups.
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t">
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] disabled:opacity-50 transition-colors shadow-sm"
                >
                    {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                    Update Sender Details
                </button>
            </div>
        </form>
    );
}