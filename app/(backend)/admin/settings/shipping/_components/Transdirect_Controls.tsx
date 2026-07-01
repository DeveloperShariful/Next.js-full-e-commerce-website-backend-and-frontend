// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Controls.tsx

"use client";

import { useState } from "react";
import { saveTransdirectPreferences } from "@/app/actions/backend/settings/shipping/transdirect-config";
import { TransdirectConfig } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

    // WP Responsive Form Classes
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full animate-in fade-in">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Shipping Preferences</h2>

            <form onSubmit={handleSubmit}>
                <table className="w-full text-left border-collapse block md:table mb-[20px] mt-[10px]">
                    <tbody className="block md:table-row-group">
                        
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Tailgate Options</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <div className="space-y-[10px]">
                                    <label className="flex items-start gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="checkbox" 
                                            name="defaultTailgatePickup" 
                                            defaultChecked={config?.defaultTailgatePickup ?? false} 
                                            className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <div>
                                            <span className="text-[13px] text-[#3c434a] font-semibold block">Requires Tailgate at Pickup</span>
                                            <span className="text-[12px] text-[#646970] mt-1 block">Check this if your warehouse does not have a forklift or loading dock.</span>
                                        </div>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="checkbox" 
                                            name="defaultTailgateDelivery" 
                                            defaultChecked={config?.defaultTailgateDelivery ?? false} 
                                            className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <div>
                                            <span className="text-[13px] text-[#3c434a] font-semibold block">Requires Tailgate at Delivery (Default)</span>
                                            <span className="text-[12px] text-[#646970] mt-1 block">If most of your customers are residential or lack forklifts, enable this.</span>
                                        </div>
                                    </label>
                                </div>
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Insurance</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <label className="flex items-start gap-2 cursor-pointer w-fit">
                                    <input 
                                        type="checkbox" 
                                        name="defaultDeclaredValue" 
                                        defaultChecked={config?.defaultDeclaredValue ?? true} 
                                        className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                    />
                                    <div>
                                        <span className="text-[13px] text-[#3c434a] font-semibold block">Declare Value for Insurance</span>
                                        <span className="text-[12px] text-[#646970] mt-1 block">Automatically declare item value for insurance coverage on quotes.</span>
                                    </div>
                                </label>
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Smart Boxing</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <label className="flex items-start gap-2 cursor-pointer w-fit">
                                    <input 
                                        type="checkbox" 
                                        name="enableOrderBoxing" 
                                        defaultChecked={config?.enableOrderBoxing ?? false} 
                                        className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                    />
                                    <div>
                                        <span className="text-[13px] text-[#3c434a] font-semibold block">Enable Smart Boxing Calculation</span>
                                        <span className="text-[12px] text-[#646970] mt-1 block max-w-[400px] leading-relaxed">If enabled, the system will try to fit cart items into your defined "Packaging Boxes" to get a more accurate quote, rather than shipping individual items.</span>
                                    </div>
                                </label>
                            </td>
                        </tr>

                    </tbody>
                </table>

                <p className="mt-[20px] mb-[30px]">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2 min-h-[30px] w-fit"
                    >
                        {loading && <Loader2 className="animate-spin" size={14}/>}
                        Save Preferences
                    </button>
                </p>
            </form>
        </div>
    );
}