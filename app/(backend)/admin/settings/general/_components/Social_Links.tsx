//app/admin/settings/general/_components/Social_Links.tsx

import { Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import { GeneralSettingsData } from "../page";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Social_Links({ data, updateNestedData }: Props) {
    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
                {[
                    { icon: Facebook, key: 'facebook', label: 'Facebook' },
                    { icon: Instagram, key: 'instagram', label: 'Instagram' },
                    { icon: Twitter, key: 'twitter', label: 'X (Twitter)' },
                    { icon: Youtube, key: 'youtube', label: 'YouTube' },
                    { icon: Linkedin, key: 'linkedin', label: 'LinkedIn' },
                ].map((item) => (
                    <div key={item.key} className="relative">
                        <item.icon size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                        <input 
                            value={(data.socialLinks as any)[item.key]} 
                            onChange={(e) => updateNestedData('socialLinks', item.key, e.target.value)} 
                            placeholder={`${item.label} URL`}
                            className="w-full border border-gray-300 pl-9 pr-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}