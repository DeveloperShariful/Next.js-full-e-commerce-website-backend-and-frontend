// File: app/admin/settings/general/_components/Store_Info.tsx

import { GeneralSettingsData } from "../page";

interface Props {
    data: GeneralSettingsData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Store_Info({ data, handleChange }: Props) {
    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Store Profile</h3>
            <div className="space-y-4 max-w-3xl">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Store Name</label>
                    <input name="storeName" value={data.storeName} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Store Email (Notifications)</label>
                        <input name="storeEmail" value={data.storeEmail} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                        <p className="text-[10px] text-gray-500 mt-1">This email receives all order alerts.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Store Phone</label>
                        <input name="storePhone" value={data.storePhone} onChange={handleChange} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                    </div>
                </div>
            </div>
        </div>
    );
}