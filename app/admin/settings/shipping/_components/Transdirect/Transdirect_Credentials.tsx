// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Credentials.tsx

"use client";

import { useState } from "react";
import { saveTransdirectCredentials } from "@/app/actions/settings/shipping/transdirect-config";
import { testTransdirectConnection } from "@/app/actions/settings/shipping/transdirect-service";
import { TransdirectConfig } from "@prisma/client";
import { Save, Loader2, Wifi, WifiOff, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
    config: TransdirectConfig | null;
    refreshData: () => void;
}

export default function Transdirect_Credentials({ config, refreshData }: Props) {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        
        // Checkbox value fix
        const isEnabled = (e.target as HTMLFormElement)['isEnabled'].checked;
        formData.set('isEnabled', String(isEnabled));

        const res = await saveTransdirectCredentials(formData);
        if (res.success) {
            toast.success(res.message || "Credentials saved");
            refreshData();
        } else {
            toast.error(res.error || "Failed to save");
        }
        setLoading(false);
    };

    const handleTestConnection = async () => {
        setTesting(true);
        const res = await testTransdirectConnection();
        if (res.success) {
            toast.success(res.message || "Connected!");
            refreshData();
        } else {
            toast.error(res.error || "Connection failed");
        }
        setTesting(false);
    };

    return (
        <div className="space-y-6 max-w-2xl animate-in fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">API Credentials</h3>
                    <p className="text-sm text-slate-500">Enter your Transdirect account details to enable real-time quoting.</p>
                </div>
                {config?.memberId && (
                    <div className="text-right">
                        <span className="text-xs text-slate-400 block uppercase">Member ID</span>
                        <span className="text-sm font-mono font-bold text-slate-700">{config.memberId}</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                {/* Enable Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded border border-slate-200">
                    <div>
                        <span className="block font-bold text-slate-700">Enable Transdirect</span>
                        <span className="text-xs text-slate-500">Activate to calculate shipping rates at checkout.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isEnabled" defaultChecked={config?.isEnabled ?? false} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Account Email <span className="text-red-500">*</span></label>
                    <input name="email" type="email" required defaultValue={config?.email || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                    <input name="password" type="password" required defaultValue={config?.password || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1]" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">API Key</label>
                    <input name="apiKey" type="text" defaultValue={config?.apiKey || ""} className="w-full border border-slate-300 p-2 rounded outline-none focus:border-[#2271b1] font-mono text-sm" />
                    <p className="text-xs text-slate-500 mt-1">Found in your Transdirect Member Area &gt; API Settings.</p>
                </div>

                <div className="pt-4 flex items-center gap-4">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                        Save Credentials
                    </button>

                    <button 
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || !config?.id}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 font-bold rounded hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        {testing ? <Loader2 size={16} className="animate-spin"/> : (config?.accountStatus === 'active' ? <CheckCircle size={16} className="text-green-600"/> : <Wifi size={16}/>)}
                        Test Connection
                    </button>
                </div>
            </form>
        </div>
    );
}