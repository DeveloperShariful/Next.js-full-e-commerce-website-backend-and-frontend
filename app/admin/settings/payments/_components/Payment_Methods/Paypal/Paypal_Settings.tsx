"use client";

import { useState } from "react";
import { updatePaypalSettings } from "@/app/actions/settings/payments/paypal";
import { PaymentMethod } from "../../../types"; 
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
// ✅ [FIX 1] Import PaypalConfig type
import { PaypalConfig } from "@prisma/client";

interface Props {
    method: PaymentMethod;
    onBack: () => void;
    refreshData: () => void;
}

export default function Paypal_Settings({ method, onBack, refreshData }: Props) {
    const [loading, setLoading] = useState(false);
    
    // ✅ [FIX 2] Explicitly define type as Partial<PaypalConfig>
    const config: Partial<PaypalConfig> = method.paypalConfig || {};

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        formData.append("id", method.id);

        const res = await updatePaypalSettings(formData);
        if(res.success) {
            toast.success("PayPal settings saved");
            refreshData();
            onBack();
        } else {
            toast.error("Failed to save settings");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* ... বাকি কোড একই থাকবে ... */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input name="name" defaultValue={method.name} className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" required />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea name="description" defaultValue={method.description || ""} rows={2} className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" />
            </div>

            <div className="p-4 bg-slate-50 border rounded-md space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">PayPal Email</label>
                    {/* ✅ Now email is recognized */}
                    <input name="setting_email" defaultValue={config.email || ""} className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Environment</label>
                    <select name="setting_environment" defaultValue={config.environment || "sandbox"} className="w-full border p-2 rounded outline-none focus:border-[#2271b1] bg-white">
                        <option value="sandbox">Sandbox (Test)</option>
                        <option value="production">Production (Live)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Client ID</label>
                    <input name="setting_clientId" defaultValue={config.clientId || ""} className="w-full border p-2 rounded outline-none focus:border-[#2271b1] font-mono text-xs" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Client Secret</label>
                    <input name="setting_clientSecret" type="password" defaultValue={config.clientSecret || ""} className="w-full border p-2 rounded outline-none focus:border-[#2271b1] font-mono text-xs" />
                </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
                <button type="button" onClick={onBack} className="px-4 py-2 border rounded text-sm font-bold">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2271b1] text-white rounded text-sm font-bold flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin" size={16}/>} Save changes
                </button>
            </div>
        </form>
    );
}