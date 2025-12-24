// app/admin/products/create/_components/LinkedProduct.tsx

import { useState } from "react";
import { ComponentProps } from "../types";
import { X, Search } from "lucide-react";

export default function LinkedProducts({ data, updateData }: ComponentProps) {
    const [upsellInput, setUpsellInput] = useState("");
    const [crossSellInput, setCrossSellInput] = useState("");

    const addProduct = (type: 'upsells' | 'crossSells', value: string) => {
        if (!value.trim()) return;
        updateData(type, [...data[type], value.trim()]);
        if (type === 'upsells') setUpsellInput("");
        else setCrossSellInput("");
    };

    const removeProduct = (type: 'upsells' | 'crossSells', value: string) => {
        updateData(type, data[type].filter(item => item !== value));
    };

    return (
        <div className="space-y-6 max-w-lg">
            {/* Upsells */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs font-bold text-gray-700">Upsells</label>
                    <span className="text-[10px] text-gray-400 cursor-help" title="Products you recommend instead of the currently viewed product">(?)</span>
                </div>
                <div className="relative">
                    <input 
                        value={upsellInput}
                        onChange={(e) => setUpsellInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct('upsells', upsellInput))}
                        className="w-full border border-gray-400 pl-8 pr-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        placeholder="Search for a product..."
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                </div>
                {/* Selected Items List */}
                <div className="flex flex-wrap gap-2">
                    {data.upsells?.map((prod, i) => (
                        <span key={i} className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                            {prod} 
                            <X size={12} className="cursor-pointer hover:text-red-600" onClick={() => removeProduct('upsells', prod)}/>
                        </span>
                    ))}
                </div>
            </div>

            {/* Cross-sells */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs font-bold text-gray-700">Cross-sells</label>
                    <span className="text-[10px] text-gray-400 cursor-help" title="Products you promote in the cart, based on the current product">(?)</span>
                </div>
                <div className="relative">
                    <input 
                        value={crossSellInput}
                        onChange={(e) => setCrossSellInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct('crossSells', crossSellInput))}
                        className="w-full border border-gray-400 pl-8 pr-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        placeholder="Search for a product..."
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                </div>
                 {/* Selected Items List */}
                 <div className="flex flex-wrap gap-2">
                    {data.crossSells?.map((prod, i) => (
                        <span key={i} className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                            {prod} 
                            <X size={12} className="cursor-pointer hover:text-red-600" onClick={() => removeProduct('crossSells', prod)}/>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}