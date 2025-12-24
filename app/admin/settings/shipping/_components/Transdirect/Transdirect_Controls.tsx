// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Controls.tsx

"use client";

import { useState } from "react";
import { saveTransdirectPreferences } from "@/app/actions/settings/shipping/transdirect-config";
import { TransdirectConfig } from "@prisma/client";
import { Save, Loader2, Info } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
    config: TransdirectConfig | null;
    refreshData: () => void;
}

export default function Transdirect_Controls({ config, refreshData }: Props) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        // Manual checkbox handling
        const form = e.target as HTMLFormElement;
        formData.set("defaultTailgatePickup", String(form['defaultTailgatePickup'].checked));
        formData.set("defaultTailgateDelivery", String(form['defaultTailgateDelivery'].checked));
        formData.set("defaultDeclaredValue", String(form['defaultDeclaredValue'].checked));
        formData.set("enableOrderBoxing", String(form['enableOrderBoxing'].checked));

        const res = await saveTransdirectPreferences(formData);
        if (res.success) {
            toast.success(res.message || "Preferences updated");
            refreshData();
        } else {
            toast.error(res.error || "Failed to update");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl animate-in fade-in space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Shipping Preferences</h3>
                <p className="text-sm text-slate-500">Set default behaviors for quotes and bookings.</p>
            </div>

            <div className="space-y-4">
                {/* Tailgate Pickup */}
                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-md bg-white hover:border-[#2271b1] transition-colors">
                    <input 
                        type="checkbox" 
                        name="defaultTailgatePickup" 
                        defaultChecked={config?.defaultTailgatePickup ?? false} 
                        className="mt-1 w-4 h-4 text-[#2271b1] border-slate-300 rounded focus:ring-[#2271b1]"
                    />
                    <div>
                        <label className="block text-sm font-bold text-slate-800">Requires Tailgate at Pickup</label>
                        <p className="text-xs text-slate-500 mt-1">Check this if your warehouse does not have a forklift or loading dock.</p>
                    </div>
                </div>

                {/* Tailgate Delivery */}
                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-md bg-white hover:border-[#2271b1] transition-colors">
                    <input 
                        type="checkbox" 
                        name="defaultTailgateDelivery" 
                        defaultChecked={config?.defaultTailgateDelivery ?? false} 
                        className="mt-1 w-4 h-4 text-[#2271b1] border-slate-300 rounded focus:ring-[#2271b1]"
                    />
                    <div>
                        <label className="block text-sm font-bold text-slate-800">Requires Tailgate at Delivery (Default)</label>
                        <p className="text-xs text-slate-500 mt-1">If most of your customers are residential or lack forklifts, enable this.</p>
                    </div>
                </div>

                {/* Insurance */}
                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-md bg-white hover:border-[#2271b1] transition-colors">
                    <input 
                        type="checkbox" 
                        name="defaultDeclaredValue" 
                        defaultChecked={config?.defaultDeclaredValue ?? true} 
                        className="mt-1 w-4 h-4 text-[#2271b1] border-slate-300 rounded focus:ring-[#2271b1]"
                    />
                    <div>
                        <label className="block text-sm font-bold text-slate-800">Declare Value for Insurance</label>
                        <p className="text-xs text-slate-500 mt-1">Automatically declare item value for insurance coverage on quotes.</p>
                    </div>
                </div>

                {/* Smart Boxing */}
                <div className="flex items-start gap-3 p-4 border border-slate-200 rounded-md bg-blue-50 border-blue-100">
                    <input 
                        type="checkbox" 
                        name="enableOrderBoxing" 
                        defaultChecked={config?.enableOrderBoxing ?? false} 
                        className="mt-1 w-4 h-4 text-[#2271b1] border-slate-300 rounded focus:ring-[#2271b1]"
                    />
                    <div>
                        <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                            Enable Smart Boxing Calculation <Info size={14} className="text-[#2271b1]"/>
                        </label>
                        <p className="text-xs text-slate-600 mt-1">
                            If enabled, the system will try to fit cart items into your defined "Packaging Boxes" 
                            to get a more accurate quote, rather than shipping individual items.
                        </p>
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
                    Save Preferences
                </button>
            </div>
        </form>
    );
}