// File: app/admin/settings/shipping/_components/Locations/Origin_Address.tsx

"use client";

import { useState } from "react";
import { saveOriginAddress } from "@/app/actions/settings/shipping/locations";
import { Location } from "@prisma/client";
import { MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface OriginProps {
    location: Location | null; // This is the default warehouse
}

export default function Origin_Address({ location }: OriginProps) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        if (location) {
            formData.append("id", location.id);
        }

        const res = await saveOriginAddress(formData);
        
        if (res.success) {
            toast.success(res.message || "Origin saved");
        } else {
            toast.error(res.error || "Failed to save");
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-sm border border-slate-200 shadow-sm mb-6 animate-in fade-in">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-50 text-[#2271b1] rounded-full hidden sm:block">
                    <MapPin size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Shipping Origin</h2>
                    <p className="text-sm text-slate-500">
                        This address is used to calculate shipping rates and is displayed on shipping labels as the "Sender Address".
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Location Name</label>
                    <input 
                        name="name" 
                        defaultValue={location?.name || "Main Warehouse"} 
                        required
                        className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                    <textarea 
                        name="address" 
                        defaultValue={location?.address || ""} 
                        required
                        rows={3}
                        placeholder="Street address, City, State, Postcode"
                        className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] disabled:opacity-50 transition-colors text-sm"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                        Save Origin
                    </button>
                </div>
            </form>
        </div>
    );
}