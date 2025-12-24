// File: app/admin/settings/general/_components/Currency_options.tsx

import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { getAllCurrencies } from "@/app/actions/settings/general/location-helpers";
import { GeneralSettingsData } from "../page";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function Currency_options({ data, updateNestedData }: Props) {
    const [currencies, setCurrencies] = useState<{code: string, symbol: string, label: string}[]>([]);

    useEffect(() => {
        // ✅ Using your original helper
        setCurrencies(getAllCurrencies());
    }, []);

    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Currency options</h3>
            <div className="space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">Currency</label>
                    <div className="md:col-span-2">
                        <select 
                            value={data.currencyOptions.currency} 
                            onChange={(e) => updateNestedData('currencyOptions', 'currency', e.target.value)} 
                            className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm bg-white"
                        >
                            <option value="">Select currency...</option>
                            {currencies.map((c) => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* ... Other currency fields same as before ... */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700">Currency position</label>
                    <div className="md:col-span-2">
                        <select value={data.currencyOptions.currencyPosition} onChange={(e) => updateNestedData('currencyOptions', 'currencyPosition', e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded-sm text-sm">
                            <option value="left">Left ($99.99)</option>
                            <option value="right">Right (99.99$)</option>
                            <option value="left_space">Left with space ($ 99.99)</option>
                            <option value="right_space">Right with space (99.99 $)</option>
                        </select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700">Thousand separator</label>
                    <div className="md:col-span-2">
                        <input value={data.currencyOptions.thousandSeparator} onChange={(e) => updateNestedData('currencyOptions', 'thousandSeparator', e.target.value)} className="w-16 border border-gray-300 px-3 py-2 rounded-sm text-sm"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700">Decimal separator</label>
                    <div className="md:col-span-2">
                        <input value={data.currencyOptions.decimalSeparator} onChange={(e) => updateNestedData('currencyOptions', 'decimalSeparator', e.target.value)} className="w-16 border border-gray-300 px-3 py-2 rounded-sm text-sm"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700">Number of decimals</label>
                    <div className="md:col-span-2">
                        <input type="number" value={data.currencyOptions.numDecimals} onChange={(e) => updateNestedData('currencyOptions', 'numDecimals', e.target.value)} className="w-16 border border-gray-300 px-3 py-2 rounded-sm text-sm"/>
                    </div>
                </div>
            </div>
        </div>
    );
}