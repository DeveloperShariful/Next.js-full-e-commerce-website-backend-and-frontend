// File: app/admin/settings/shipping/_components/Locations/Origin_Address.tsx

"use client";

import { useState } from "react";
import { saveOriginAddress } from "@/app/actions/backend/settings/shipping/locations";
import { Location } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OriginProps {
    location: Location | null; 
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

    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full mb-[30px] animate-in fade-in">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Shipping Origin</h2>
            <p className="text-[13px] text-[#646970] mt-1 mb-[15px]">This address is used to calculate shipping rates and is displayed on shipping labels as the "Sender Address".</p>

            <form onSubmit={handleSubmit}>
                <table className="w-full text-left border-collapse block md:table mb-[20px]">
                    <tbody className="block md:table-row-group">
                        
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Location Name</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <input 
                                    name="name" 
                                    defaultValue={location?.name || "Main Warehouse"} 
                                    required
                                    className={wpInputClass}
                                />
                            </td>
                        </tr>
                        
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Full Address</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <textarea 
                                    name="address" 
                                    defaultValue={location?.address || ""} 
                                    required
                                    rows={3}
                                    placeholder="Street address, City, State, Postcode"
                                    className={`${wpInputClass} !h-[80px] w-full md:w-[35em] py-2`}
                                />
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
                        Save Origin
                    </button>
                </p>
            </form>
        </div>
    );
}