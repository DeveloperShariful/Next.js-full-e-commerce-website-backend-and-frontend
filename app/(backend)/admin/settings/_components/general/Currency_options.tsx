// File: app/(backend)/admin/settings/_components/general/Currency_options.tsx

import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { getAllCurrencies } from "@/app/actions/backend/settings/general/location-helpers";
import { GeneralSettingsData } from "../GeneralTab";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Currency_options({ data, updateNestedData }: Props) {
    const [currencies, setCurrencies] = useState<{code: string, symbol: string, label: string}[]>([]);

    useEffect(() => {
        setCurrencies(getAllCurrencies());
    }, []);

    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full mb-[30px]">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Currency options</h2>
            <p className="text-[13px] text-[#646970] mt-1 mb-[15px]">The following options affect how prices are displayed on the frontend.</p>
            
            <table className="w-full text-left border-collapse block md:table">
                <tbody className="block md:table-row-group">
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="flex items-center gap-1 cursor-pointer">
                                Currency <HelpCircle size={14} className="text-[#a7aaad]"/>
                            </label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                value={data.currencyOptions.currency} 
                                onChange={(e) => updateNestedData('currencyOptions', 'currency', e.target.value)} 
                                className={wpInputClass}
                            >
                                <option value="">Select currency...</option>
                                {currencies.map((c) => (
                                    <option key={c.code} value={c.code}>{c.label}</option>
                                ))}
                            </select>
                        </td>
                    </tr>
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="flex items-center gap-1 cursor-pointer">
                                Currency position <HelpCircle size={14} className="text-[#a7aaad]"/>
                            </label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                value={data.currencyOptions.currencyPosition} 
                                onChange={(e) => updateNestedData('currencyOptions', 'currencyPosition', e.target.value)} 
                                className={wpInputClass}
                            >
                                <option value="left">Left ($99.99)</option>
                                <option value="right">Right (99.99$)</option>
                                <option value="left_space">Left with space ($ 99.99)</option>
                                <option value="right_space">Right with space (99.99 $)</option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Thousand separator</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                value={data.currencyOptions.thousandSeparator} 
                                onChange={(e) => updateNestedData('currencyOptions', 'thousandSeparator', e.target.value)} 
                                className={`${wpInputClass} !w-[80px]`}
                            />
                        </td>
                    </tr>
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Decimal separator</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                value={data.currencyOptions.decimalSeparator} 
                                onChange={(e) => updateNestedData('currencyOptions', 'decimalSeparator', e.target.value)} 
                                className={`${wpInputClass} !w-[80px]`}
                            />
                        </td>
                    </tr>
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Number of decimals</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <input 
                                type="number" 
                                value={data.currencyOptions.numDecimals} 
                                onChange={(e) => updateNestedData('currencyOptions', 'numDecimals', e.target.value)} 
                                className={`${wpInputClass} !w-[80px]`}
                            />
                        </td>
                    </tr>

                </tbody>
            </table>
        </div>
    );
}