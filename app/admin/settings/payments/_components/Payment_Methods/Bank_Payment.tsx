// File: app/admin/settings/payments/_components/Payment_Methods/Bank_Payment.tsx

"use client";

import { useState } from "react";
import { updateBankSettings } from "@/app/actions/settings/payments/bank";
import { PaymentMethod } from "../../types";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
    method: PaymentMethod;
    onBack: () => void;
    refreshData: () => void;
}

export default function Bank_Payment({ method, onBack, refreshData }: Props) {
    const [loading, setLoading] = useState(false);
    const settings = method.settings || {};

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        // Append ID explicitly
        formData.append("id", method.id);

        const res = await updateBankSettings(formData);
        if(res.success) {
            toast.success("Bank settings saved");
            refreshData();
            onBack();
        } else {
            toast.error("Failed to save settings");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input name="name" defaultValue={method.name} className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" required />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea name="description" defaultValue={method.description || ""} rows={2} className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Instructions</label>
                <textarea 
                    name="setting_instructions" 
                    defaultValue={settings.instructions || ""} 
                    rows={3} 
                    className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" 
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Account Details</label>
                <textarea 
                    name="setting_accountDetails" 
                    defaultValue={settings.accountDetails || ""} 
                    rows={4} 
                    className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" 
                    placeholder="Bank Name: XYZ&#10;Account Number: 123456789"
                />
                <p className="text-xs text-slate-500 mt-1">Enter bank account details here.</p>
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