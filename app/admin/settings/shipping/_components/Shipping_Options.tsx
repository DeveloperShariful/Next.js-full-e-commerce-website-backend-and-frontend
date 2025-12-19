// File: app/admin/settings/shipping/_components/Shipping_Options.tsx

"use client";

import { useState } from "react";
import { updateShippingOptions } from "@/app/actions/settings/shipping";
import { ComponentProps } from "../types";
import { Loader2, Save, HelpCircle } from "lucide-react";
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

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded-sm border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Shipping Options</h2>
            
            <div className="space-y-6 max-w-3xl">
                
                {/* Calculations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start border-b border-slate-100 pb-6">
                    <div className="text-sm font-bold text-slate-700">Calculations</div>
                    <div className="md:col-span-2 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="enable_shipping_calc" 
                                value="true"
                                defaultChecked={options.enableShippingCalc} 
                                className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-slate-300 min-w-[16px]"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-700">Enable the shipping calculator on the cart page</span>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="hide_shipping_costs" 
                                value="true"
                                defaultChecked={options.hideShippingCosts} 
                                className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-slate-300 min-w-[16px]"
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-700">Hide shipping costs until an address is entered</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Destination */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start">
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                        Shipping Destination <HelpCircle size={14} className="text-slate-400"/>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="shipping_destination" 
                                value="shipping"
                                defaultChecked={options.shippingDestination === 'shipping'} 
                                className="w-4 h-4 text-[#2271b1] border-slate-300 focus:ring-[#2271b1] min-w-[16px]"
                            />
                            <span className="text-sm text-slate-700">Default to customer shipping address</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="shipping_destination" 
                                value="billing"
                                defaultChecked={options.shippingDestination === 'billing'} 
                                className="w-4 h-4 text-[#2271b1] border-slate-300 focus:ring-[#2271b1] min-w-[16px]"
                            />
                            <span className="text-sm text-slate-700">Default to customer billing address</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="radio" 
                                name="shipping_destination" 
                                value="force_billing"
                                defaultChecked={options.shippingDestination === 'force_billing'} 
                                className="w-4 h-4 text-[#2271b1] border-slate-300 focus:ring-[#2271b1] min-w-[16px]"
                            />
                            <span className="text-sm text-slate-700">Force shipping to the customer billing address</span>
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-[#2271b1] text-white font-bold rounded shadow-sm hover:bg-[#135e96] disabled:opacity-50 text-sm"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                        Save changes
                    </button>
                </div>
            </div>
        </form>
    );
}