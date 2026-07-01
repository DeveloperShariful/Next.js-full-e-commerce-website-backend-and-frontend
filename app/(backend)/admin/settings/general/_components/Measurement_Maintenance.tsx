//app/(backend)/admin/settings/_components/general/Measurement_Maintenance.tsx

import { Ruler, Scale, AlertTriangle } from "lucide-react";
import { GeneralSettingsData } from "../_components/GeneralTab";

interface Props {
    data: GeneralSettingsData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Measurement_Maintenance({ data, handleChange, updateNestedData }: Props) {
    
    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full mb-[30px]">
            
            {/* 1. Measurements Section */}
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Measurements</h2>
            <table className="w-full text-left border-collapse block md:table mt-[10px] mb-[30px]">
                <tbody className="block md:table-row-group">
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="flex items-center gap-1 cursor-pointer">
                                Weight unit <Scale size={14} className="text-[#a7aaad]"/>
                            </label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                name="weightUnit" 
                                value={data.weightUnit} 
                                onChange={handleChange} 
                                className={wpInputClass}
                            >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="lbs">lbs</option>
                                <option value="oz">oz</option>
                            </select>
                        </td>
                    </tr>
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="flex items-center gap-1 cursor-pointer">
                                Dimensions unit <Ruler size={14} className="text-[#a7aaad]"/>
                            </label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                name="dimensionUnit" 
                                value={data.dimensionUnit} 
                                onChange={handleChange} 
                                className={wpInputClass}
                            >
                                <option value="m">m</option>
                                <option value="cm">cm</option>
                                <option value="mm">mm</option>
                                <option value="in">in</option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 2. Site Visibility / Maintenance Section */}
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none flex items-center gap-2">
                Site Visibility <AlertTriangle size={16} className="text-[#d63638]"/>
            </h2>
            <table className="w-full text-left border-collapse block md:table mt-[10px]">
                <tbody className="block md:table-row-group">
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer text-[#d63638]">Maintenance Mode</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <label className="flex items-start gap-2 cursor-pointer w-fit">
                                <input 
                                    type="checkbox" 
                                    id="maintenance" 
                                    name="maintenance"
                                    checked={data.maintenance} 
                                    onChange={(e) => updateNestedData('maintenance', '', e.target.checked)} 
                                    className="border-[#8c8f94] rounded-[3px] focus:ring-[#d63638] text-[#d63638] w-4 h-4 mt-[1px]"
                                />
                                <div>
                                    <span className="text-[13px] font-semibold text-[#d63638] block leading-tight">Enable Maintenance Mode</span>
                                    <span className="text-[12px] text-[#646970] block mt-1">If enabled, the frontend store will be hidden from public visitors.</span>
                                </div>
                            </label>
                        </td>
                    </tr>
                </tbody>
            </table>

        </div>
    );
}