// app/admin/settings/general/_components/Currency_options.tsx

import { useState, useEffect } from "react";
import { ComponentProps } from "../types";
import { HelpCircle } from "lucide-react";
import { getAllCurrencies } from "@/lib/location-helpers";

export default function Currency_options({ data, updateNestedData }: ComponentProps) {
    const [currencies, setCurrencies] = useState<{code: string, symbol: string, label: string}[]>([]);

    useEffect(() => {
        setCurrencies(getAllCurrencies());
    }, []);

    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Currency options</h3>
            <p className="text-sm text-gray-500 mb-6">The following options affect how prices are displayed on the frontend.</p>
            
            <div className="space-y-4 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Currency <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <select 
                            value={data.currencyOptions.currency} 
                            onChange={(e) => updateNestedData('currencyOptions', 'currency', e.target.value)} 
                            className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white shadow-sm"
                        >
                            <option value="">Select currency...</option>
                            {currencies.map((c) => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Currency position <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <select 
                            value={data.currencyOptions.currencyPosition} 
                            onChange={(e) => updateNestedData('currencyOptions', 'currencyPosition', e.target.value)} 
                            className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white shadow-sm"
                        >
                            <option value="left">Left ($99.99)</option>
                            <option value="right">Right (99.99$)</option>
                            <option value="left_space">Left with space ($ 99.99)</option>
                            <option value="right_space">Right with space (99.99 $)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Thousand separator <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <input 
                            value={data.currencyOptions.thousandSeparator} 
                            onChange={(e) => updateNestedData('currencyOptions', 'thousandSeparator', e.target.value)} 
                            className="w-16 border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Decimal separator <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <input 
                            value={data.currencyOptions.decimalSeparator} 
                            onChange={(e) => updateNestedData('currencyOptions', 'decimalSeparator', e.target.value)} 
                            className="w-16 border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Number of decimals <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <input 
                            type="number"
                            value={data.currencyOptions.numDecimals} 
                            onChange={(e) => updateNestedData('currencyOptions', 'numDecimals', e.target.value)} 
                            className="w-16 border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm shadow-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}