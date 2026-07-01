// File: app/(backend)/admin/settings/_components/general/Store_Info.tsx

import { GeneralSettingsData } from "../_components/GeneralTab";

interface Props {
    data: GeneralSettingsData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Store_Info({ data, handleChange }: Props) {
    
    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full mb-[30px]">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Store Profile</h2>
            
            <table className="w-full text-left border-collapse block md:table mt-[10px]">
                <tbody className="block md:table-row-group">
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Store Name</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                name="storeName" 
                                value={data.storeName} 
                                onChange={handleChange} 
                                className={wpInputClass}
                            />
                        </td>
                    </tr>

                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Store Email</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                name="storeEmail" 
                                value={data.storeEmail} 
                                onChange={handleChange} 
                                className={wpInputClass}
                            />
                            <p className="text-[12px] text-[#646970] mt-1 mb-0">This email receives all order alerts and customer notifications.</p>
                        </td>
                    </tr>

                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Store Phone</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                name="storePhone" 
                                value={data.storePhone} 
                                onChange={handleChange} 
                                className={wpInputClass}
                            />
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>
    );
}