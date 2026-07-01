// File: app/admin/settings/shipping/_components/Transdirect/Transdirect_Sender.tsx

"use client";

import { useState } from "react";
import { saveTransdirectSender } from "@/app/actions/backend/settings/shipping/transdirect-sender";
import { TransdirectConfig } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full animate-in fade-in">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Sender Information</h2>
            <p className="text-[13px] text-[#646970] mt-1 mb-[15px]">This address is used as the pickup location for couriers when calculating quotes and generating shipping labels.</p>

            <form onSubmit={handleSubmit}>
                <table className="w-full text-left border-collapse block md:table mb-[20px] mt-[10px]">
                    <tbody className="block md:table-row-group">
                        
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Sender Type</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <div className="flex items-center gap-[15px]">
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="radio" 
                                            name="senderType" 
                                            value="business" 
                                            defaultChecked={!config?.senderType || config.senderType === 'business'} 
                                            className="border-[#8c8f94] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <span className="text-[13px] text-[#3c434a]">Business</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <input 
                                            type="radio" 
                                            name="senderType" 
                                            value="residential" 
                                            defaultChecked={config?.senderType === 'residential'} 
                                            className="border-[#8c8f94] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                        />
                                        <span className="text-[13px] text-[#3c434a]">Residential</span>
                                    </label>
                                </div>
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Company Name</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="senderCompany" 
                                    defaultValue={config?.senderCompany || ""} 
                                    className={wpInputClass} 
                                />
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Contact Name <span className="text-[#d63638]">*</span></label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="senderName" 
                                    required 
                                    defaultValue={config?.senderName || ""} 
                                    className={wpInputClass} 
                                />
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Phone Number <span className="text-[#d63638]">*</span></label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="senderPhone" 
                                    required 
                                    defaultValue={config?.senderPhone || ""} 
                                    className={wpInputClass} 
                                />
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Street Address <span className="text-[#d63638]">*</span></label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="senderAddress" 
                                    required 
                                    defaultValue={config?.senderAddress || ""} 
                                    className={`${wpInputClass} !w-full md:!w-[35em]`} 
                                />
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Suburb <span className="text-[#d63638]">*</span></label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="senderSuburb" 
                                    required 
                                    defaultValue={config?.senderSuburb || ""} 
                                    className={wpInputClass} 
                                />
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">State <span className="text-[#d63638]">*</span></label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <select 
                                    name="senderState" 
                                    defaultValue={config?.senderState || ""} 
                                    className={wpInputClass}
                                >
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
                            </td>
                        </tr>

                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Postcode <span className="text-[#d63638]">*</span></label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="senderPostcode" 
                                    required 
                                    defaultValue={config?.senderPostcode || ""} 
                                    className={`${wpInputClass} !w-[100px]`} 
                                />
                            </td>
                        </tr>

                    </tbody>
                </table>

                {/* WP Style Notice */}
                <div className="bg-[#fff8e5] border-l-[4px] border-[#f56e28] p-[12px] text-[13px] text-[#3c434a] mb-[20px] max-w-[800px] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                    <p className="m-0"><strong>Note:</strong> Currently Transdirect integration is optimized for Australian pickups.</p>
                </div>

                <p className="mt-[20px] mb-[30px]">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-2 min-h-[30px] w-fit"
                    >
                        {loading && <Loader2 className="animate-spin" size={14}/>}
                        Update Sender Details
                    </button>
                </p>
            </form>
        </div>
    );
}