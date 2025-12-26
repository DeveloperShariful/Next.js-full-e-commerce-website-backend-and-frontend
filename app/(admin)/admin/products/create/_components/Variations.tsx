// app/admin/products/create/_components/variation.tsx

import { ComponentProps } from "../types";
import { toast } from "react-hot-toast";

export default function Variations({ data, updateData }: ComponentProps) {
    const addVariation = () => {
        const varAttrs = data.attributes.filter(a => a.variation);
        if(varAttrs.length === 0) {
            toast.error("Add attributes used for variations first");
            return;
        }
        
        // 🚀 FIX: Use 'temp_' prefix to match Server Action Logic for new items
        const newId = `temp_${Date.now()}`;
        const defaultAttrs: Record<string, string> = {};
        varAttrs.forEach(a => defaultAttrs[a.name] = "");

        updateData('variations', [...data.variations, {
            id: newId,
            name: `Variation #${data.variations.length + 1}`,
            price: 0,
            stock: 0,
            sku: "",
            attributes: defaultAttrs
        }]);
    };

    const updateVar = (index: number, field: string, value: any) => {
        const newVars = [...data.variations];
        (newVars[index] as any)[field] = value;
        updateData('variations', newVars);
    };

    const updateVarAttr = (idx: number, attrName: string, val: string) => {
        const newVars = [...data.variations];
        newVars[idx].attributes = { ...newVars[idx].attributes, [attrName]: val };
        updateData('variations', newVars);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 p-3 bg-white border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-600">{data.variations.length} variations defined</span>
                <button type="button" onClick={addVariation} className="px-3 py-1 bg-gray-100 border border-gray-300 text-[#2271b1] rounded-sm text-xs font-medium hover:bg-gray-200">Add Manually</button>
            </div>

            <div className="border border-gray-300 rounded-sm divide-y divide-gray-300">
                {data.variations.map((v, i) => (
                    <div key={v.id} className="bg-white">
                        <div className="p-3 bg-gray-50 flex items-center gap-4">
                            <span className="text-xs font-mono text-gray-500">#{i + 1}</span>
                            <div className="flex-1 flex flex-wrap gap-2">
                                {data.attributes.filter(a => a.variation).map(attr => (
                                    <div key={attr.name} className="flex items-center gap-1">
                                        <label className="text-xs font-bold text-gray-700">{attr.name}:</label>
                                        <select 
                                            value={v.attributes[attr.name] || ""}
                                            onChange={e => updateVarAttr(i, attr.name, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-1 py-0.5"
                                        >
                                            <option value="">Any {attr.name}</option>
                                            {attr.values.map(val => <option key={val} value={val}>{val}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => updateData('variations', data.variations.filter((_, vi) => vi !== i))} className="text-red-600 hover:underline text-xs">Remove</button>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-4 border-t border-gray-100">
                            <div><label className="text-xs font-bold block mb-1">SKU</label><input value={v.sku} onChange={e => updateVar(i, 'sku', e.target.value)} className="w-full border border-gray-400 p-1 rounded-sm text-sm" /></div>
                            <div><label className="text-xs font-bold block mb-1">Price ($)</label><input type="number" value={v.price} onChange={e => updateVar(i, 'price', parseFloat(e.target.value))} className="w-full border border-gray-400 p-1 rounded-sm text-sm" /></div>
                            <div><label className="text-xs font-bold block mb-1">Stock</label><input type="number" value={v.stock} onChange={e => updateVar(i, 'stock', parseInt(e.target.value))} className="w-full border border-gray-400 p-1 rounded-sm text-sm" /></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}