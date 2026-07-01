// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Credentials.tsx

"use client";

import { useState } from "react";
import { saveTransdirectCredentials } from "@/app/actions/backend/settings/shipping/transdirect-config";
import { testTransdirectConnection } from "@/app/actions/backend/settings/shipping/transdirect-service";
import { TransdirectConfig } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full animate-in fade-in">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">API Credentials</h2>

            <form onSubmit={handleSave}>
                <table className="w-full text-left border-collapse block md:table mb-[20px] mt-[10px]">
                    <tbody className="block md:table-row-group">
                        
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Enable Transdirect</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                    <input 
                                        type="checkbox" 
                                        name="isEnabled" 
                                        defaultChecked={config?.isEnabled ?? false} 
                                        className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                    />
                                    <span className="text-[13px] text-[#3c434a]">Activate to calculate shipping rates at checkout</span>
                                </label>
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Account Email</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="email" 
                                    type="email" 
                                    required 
                                    defaultValue={config?.email || ""} 
                                    className={wpInputClass} 
                                />
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Password</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="password" 
                                    type="password" 
                                    required 
                                    defaultValue={config?.password || ""} 
                                    className={wpInputClass} 
                                />
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">API Key</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="apiKey" 
                                    type="text" 
                                    defaultValue={config?.apiKey || ""} 
                                    className={`${wpInputClass} font-mono text-[12px]`} 
                                />
                                <p className="text-[12px] text-[#646970] mt-1 mb-0">Found in your Transdirect Member Area &gt; API Settings.</p>
                            </td>
                        </tr>

                        {config?.memberId && (
                            <tr className={trResponsiveClass}>
                                <th scope="row" className={thResponsiveClass}>
                                    <label className="cursor-pointer">Member ID</label>
                                </th>
                                <td className={tdResponsiveClass}>
                                    <span className="text-[13px] font-mono font-semibold text-[#1d2327] bg-[#f0f0f1] px-2 py-1 rounded-[3px] border border-[#dcdcde]">{config.memberId}</span>
                                    <p className="text-[12px] text-[#646970] mt-1 mb-0">Auto-fetched from API upon successful connection.</p>
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>

                <div className="mt-[20px] mb-[30px] flex items-center gap-3 flex-wrap">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2 min-h-[30px]"
                    >
                        {loading && <Loader2 className="animate-spin" size={14}/>}
                        Save Credentials
                    </button>

                    <button 
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testing || !config?.id}
                        className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px] flex items-center gap-2 disabled:opacity-60"
                    >
                        {testing && <Loader2 className="animate-spin" size={14}/>}
                        {testing ? "Testing..." : "Test Connection"}
                    </button>
                    
                    {config?.accountStatus === 'active' && !testing && (
                        <span className="text-[#007017] text-[13px] font-semibold flex items-center gap-1">✓ Connection Successful</span>
                    )}
                </div>
            </form>
        </div>
    );
}