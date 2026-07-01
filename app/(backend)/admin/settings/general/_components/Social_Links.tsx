//app/(backend)/admin/settings/_components/general/Social_Links.tsx

import { Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import { GeneralSettingsData } from "../_components/GeneralTab";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Social_Links({ data, updateNestedData }: Props) {
    
    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border pl-[32px] bg-white";
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    const socialPlatforms = [
        { icon: Facebook, key: 'facebook', label: 'Facebook' },
        { icon: Instagram, key: 'instagram', label: 'Instagram' },
        { icon: Twitter, key: 'twitter', label: 'X (Twitter)' },
        { icon: Youtube, key: 'youtube', label: 'YouTube' },
        { icon: Linkedin, key: 'linkedin', label: 'LinkedIn' },
    ];

    return (
        <div className="w-full mb-[30px]">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">Social Links</h2>
            <p className="text-[13px] text-[#646970] mt-1 mb-[15px]">Provide URLs to your social media profiles. These will be displayed on the frontend.</p>
            
            <table className="w-full text-left border-collapse block md:table">
                <tbody className="block md:table-row-group">
                    {socialPlatforms.map((item) => (
                        <tr key={item.key} className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">{item.label}</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <div className="relative inline-block w-full md:w-[25em] max-w-full">
                                    <item.icon size={14} className="absolute left-[10px] top-[8px] text-[#8c8f94]"/>
                                    <input 
                                        value={(data.socialLinks as any)[item.key]} 
                                        onChange={(e) => updateNestedData('socialLinks', item.key, e.target.value)} 
                                        placeholder={`https://`}
                                        className={wpInputClass}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}