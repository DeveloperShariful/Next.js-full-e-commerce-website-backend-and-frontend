// File: app/admin/settings/shipping/_components/Local/Shipping_Options.tsx

"use client";

import { useState } from "react";
import { updateShippingOptions } from "@/app/actions/backend/settings/shipping/local";
import { ComponentProps } from "./types";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function Shipping_Options({ options, refreshData }: ComponentProps) {
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        const res = await updateShippingOptions(formData);
        if (res.success) {
            toast.success("Options saved successfully");
            refreshData();
        } else {
            toast.error("Failed to save options");
        }
        setSaving(false);
    };

    // WP Responsive Form Classes
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full mb-[30px] animate-in fade-in">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Shipping Options</h2>
            <p className="text-[13px] text-[#646970] mt-1 mb-[15px]">Configure how shipping is calculated and displayed during checkout.</p>

            <form onSubmit={handleSubmit}>
                <table className="w-full text-left border-collapse block md:table mb-[20px]">
                    <tbody className="block md:table-row-group">
                        
                        {/* Calculations */}
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Calculations</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <div className="space-y-[10px]">
                                    <label className="flex items-start gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="checkbox" 
                                            name="enable_shipping_calc" 
                                            value="true"
                                            defaultChecked={options.enableShippingCalc} 
                                            className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <span className="text-[13px] text-[#3c434a]">Enable the shipping calculator on the cart page</span>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="checkbox" 
                                            name="hide_shipping_costs" 
                                            value="true"
                                            defaultChecked={options.hideShippingCosts} 
                                            className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <span className="text-[13px] text-[#3c434a]">Hide shipping costs until an address is entered</span>
                                    </label>
                                </div>
                            </td>
                        </tr>

                        {/* Destination */}
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Shipping Destination</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <div className="space-y-[10px]">
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="radio" 
                                            name="shipping_destination" 
                                            value="shipping"
                                            defaultChecked={options.shippingDestination === 'shipping'} 
                                            className="border-[#8c8f94] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <span className="text-[13px] text-[#3c434a]">Default to customer shipping address</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="radio" 
                                            name="shipping_destination" 
                                            value="billing"
                                            defaultChecked={options.shippingDestination === 'billing'} 
                                            className="border-[#8c8f94] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <span className="text-[13px] text-[#3c434a]">Default to customer billing address</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="radio" 
                                            name="shipping_destination" 
                                            value="force_billing"
                                            defaultChecked={options.shippingDestination === 'force_billing'} 
                                            className="border-[#8c8f94] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <span className="text-[13px] text-[#3c434a]">Force shipping to the customer billing address</span>
                                    </label>
                                </div>
                            </td>
                        </tr>

                    </tbody>
                </table>

                <p className="mt-[20px] mb-[30px]">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2 min-h-[30px] w-fit"
                    >
                        {saving && <Loader2 className="animate-spin" size={14}/>}
                        Save changes
                    </button>
                </p>
            </form>
        </div>
    );
}