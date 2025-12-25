// File: app/admin/settings/general/_components/Store_Address.tsx

import { getCountryStateOptions } from "@/app/actions/admin/settings/general/location-helpers";
import { GeneralSettingsData } from "../page";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Store_Address({ data, updateNestedData }: Props) {
    // ✅ Using your original helper
    const locations = getCountryStateOptions();

    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Store Address</h3>
            <div className="space-y-4 max-w-3xl">
                {/* ... Address lines inputs ... */}
                <div className="grid grid-cols-1 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Address line 1</label>
                        <input value={data.storeAddress.address1} onChange={(e) => updateNestedData('storeAddress', 'address1', e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Address line 2</label>
                        <input value={data.storeAddress.address2} onChange={(e) => updateNestedData('storeAddress', 'address2', e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                            <input value={data.storeAddress.city} onChange={(e) => updateNestedData('storeAddress', 'city', e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Postcode</label>
                            <input value={data.storeAddress.postcode} onChange={(e) => updateNestedData('storeAddress', 'postcode', e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Country / State</label>
                        <select value={data.storeAddress.country} onChange={(e) => updateNestedData('storeAddress', 'country', e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm bg-white">
                            <option value="">Select a country / region...</option>
                            {locations.map((loc) => (
                                <option key={loc.value} value={loc.value}>{loc.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}