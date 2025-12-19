import { useState, useEffect } from "react";
import { ComponentProps } from "../types";
import { getAttributes } from "@/app/actions/attribute";
import { X } from "lucide-react";

export default function Attributes({ data, updateData }: ComponentProps) {
    const [globalAttrs, setGlobalAttrs] = useState<any[]>([]);

    useEffect(() => {
        getAttributes().then(res => {
            if(res.success) setGlobalAttrs(res.data || []);
        });
    }, []);

    const addAttribute = () => {
        // Unique ID fix using Date.now()
        updateData('attributes', [...data.attributes, { id: `temp_${Date.now()}`, name: "", values: [], visible: true, variation: true }]);
    };

    const updateAttr = (index: number, field: string, val: any) => {
        const newAttrs = [...data.attributes];
        (newAttrs[index] as any)[field] = val;
        updateData('attributes', newAttrs);
    };

    const removeAttr = (index: number) => {
        updateData('attributes', data.attributes.filter((_, i) => i !== index));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <select className="border border-gray-400 px-2 py-1 text-xs rounded-sm" disabled>
                    <option>Custom product attribute</option>
                </select>
                <button type="button" onClick={addAttribute} className="px-3 py-1 bg-gray-100 border border-gray-300 text-[#2271b1] rounded-sm text-xs font-medium hover:bg-gray-200">Add</button>
            </div>

            <div className="space-y-3">
                <datalist id="global-attrs">
                    {globalAttrs.map(a => <option key={a.id} value={a.name} />)}
                </datalist>

                {data.attributes.map((attr, i) => (
                    <div key={attr.id} className="border border-gray-300 bg-gray-50 p-3 rounded-sm">
                        <div className="flex justify-between mb-2 pb-2 border-b border-gray-200">
                             <span className="font-semibold text-xs">Attribute #{i + 1}</span>
                             <button type="button" onClick={() => removeAttr(i)} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Name</label>
                                <input 
                                    list="global-attrs"
                                    value={attr.name} 
                                    onChange={(e) => updateAttr(i, 'name', e.target.value)}
                                    className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                                    placeholder="e.g. Color"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Values</label>
                                <div className="bg-white border border-gray-400 p-1 rounded-sm flex flex-wrap gap-1 min-h-[32px]">
                                    {attr.values.map((v, vIdx) => (
                                        <span key={vIdx} className="bg-gray-100 border border-gray-300 px-1.5 rounded text-xs flex items-center gap-1">
                                            {v} <X size={10} className="cursor-pointer" onClick={() => {
                                                const newVals = attr.values.filter((_, vi) => vi !== vIdx);
                                                updateAttr(i, 'values', newVals);
                                            }} />
                                        </span>
                                    ))}
                                    <input 
                                        className="flex-1 outline-none text-sm min-w-[50px] bg-transparent"
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                e.preventDefault();
                                                updateAttr(i, 'values', [...attr.values, e.currentTarget.value.trim()]);
                                                e.currentTarget.value = "";
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 flex gap-4">
                            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={attr.visible} onChange={() => updateAttr(i, 'visible', !attr.visible)} /> Visible on product page</label>
                            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={attr.variation} onChange={() => updateAttr(i, 'variation', !attr.variation)} /> Used for variations</label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}