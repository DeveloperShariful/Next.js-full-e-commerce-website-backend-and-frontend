// File: app/(backend)/admin/settings/_components/general/Store_Address.tsx

import { getCountryStateOptions } from "@/app/actions/backend/settings/general/location-helpers";
import { GeneralSettingsData } from "../GeneralTab";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Store_Address({ data, updateNestedData }: Props) {
    // ✅ Using your original helper
    const locations = getCountryStateOptions();

    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full mb-[30px]">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Store Address</h2>
            <p className="text-[13px] text-[#646970] mt-1 mb-[15px]">This is where your business is located. Tax rates and shipping rates will use this address.</p>
            
            <table className="w-full text-left border-collapse block md:table">
                <tbody className="block md:table-row-group">
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Address line 1</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                value={data.storeAddress.address1} 
                                onChange={(e) => updateNestedData('storeAddress', 'address1', e.target.value)} 
                                className={wpInputClass}
                            />
                        </td>
                    </tr>

                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Address line 2</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                value={data.storeAddress.address2} 
                                onChange={(e) => updateNestedData('storeAddress', 'address2', e.target.value)} 
                                className={wpInputClass}
                            />
                        </td>
                    </tr>

                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">City</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                value={data.storeAddress.city} 
                                onChange={(e) => updateNestedData('storeAddress', 'city', e.target.value)} 
                                className={wpInputClass}
                            />
                        </td>
                    </tr>

                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Country / State</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                value={data.storeAddress.country} 
                                onChange={(e) => updateNestedData('storeAddress', 'country', e.target.value)} 
                                className={wpInputClass}
                            >
                                <option value="">Select a country / region...</option>
                                {locations.map((loc) => (
                                    <option key={loc.value} value={loc.value}>{loc.label}</option>
                                ))}
                            </select>
                        </td>
                    </tr>

                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Postcode / ZIP</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                value={data.storeAddress.postcode} 
                                onChange={(e) => updateNestedData('storeAddress', 'postcode', e.target.value)} 
                                className={wpInputClass}
                            />
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>
    );
}