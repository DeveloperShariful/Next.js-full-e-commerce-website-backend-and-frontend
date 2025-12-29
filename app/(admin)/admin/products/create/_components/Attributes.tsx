// app/admin/products/create/_components/Attributes.tsx

import { useState, useEffect } from "react";
import { getAttributes } from "@/app/actions/admin/product/product-read"; 
import { ComponentProps } from "../types";
import { X, Save, ChevronUp, ChevronDown } from "lucide-react"; 

export default function Attributes({ data, updateData, onSubmit, loading }: ComponentProps) {
    const [globalAttrs, setGlobalAttrs] = useState<{id: string, name: string, values: string[]}[]>([]);
    const [selectedAttr, setSelectedAttr] = useState("");

    useEffect(() => {
        getAttributes().then(res => {
            if(res.success) setGlobalAttrs(res.data as any || []);
        });
    }, []);

    const addAttribute = () => {
        if (!selectedAttr) {
            updateData('attributes', [...data.attributes, { 
                id: `temp_${Date.now()}`, 
                name: "", 
                values: [], 
                visible: true, 
                variation: true,
                position: data.attributes.length 
            }]);
            return;
        }

        const existingGlobal = globalAttrs.find(a => a.name === selectedAttr);
        if (existingGlobal) {
            if (data.attributes.some(a => a.name === existingGlobal.name)) {
                alert("Attribute already added!");
                return;
            }

            updateData('attributes', [...data.attributes, { 
                id: `temp_${Date.now()}`, 
                name: existingGlobal.name, 
                values: existingGlobal.values, 
                visible: true, 
                variation: true,
                position: data.attributes.length
            }]);
            setSelectedAttr("");
        }
    };

    const updateAttr = (index: number, field: string, val: any) => {
        const newAttrs = [...data.attributes];
        (newAttrs[index] as any)[field] = val;
        updateData('attributes', newAttrs);
    };

    const removeAttr = (index: number) => {
        updateData('attributes', data.attributes.filter((_, i) => i !== index));
    };

    // 🔥 NEW: Function to reorder attributes
    const moveAttr = (index: number, direction: 'up' | 'down') => {
        const newAttrs = [...data.attributes];
        if (direction === 'up' && index > 0) {
            [newAttrs[index], newAttrs[index - 1]] = [newAttrs[index - 1], newAttrs[index]];
        } else if (direction === 'down' && index < newAttrs.length - 1) {
            [newAttrs[index], newAttrs[index + 1]] = [newAttrs[index + 1], newAttrs[index]];
        }
        // Update positions based on new index
        newAttrs.forEach((attr, idx) => attr.position = idx);
        updateData('attributes', newAttrs);
    };

    return (
        <div>
            <div className="flex gap-2 items-center mb-4">
                <select 
                    className="border border-gray-400 px-3 py-1.5 text-sm rounded-sm outline-none focus:border-[#2271b1] bg-white text-[#3c434a]"
                    value={selectedAttr}
                    onChange={(e) => setSelectedAttr(e.target.value)}
                >
                    <option value="">Custom product attribute</option>
                    {globalAttrs.map(attr => (
                        <option key={attr.id} value={attr.name}>{attr.name}</option>
                    ))}
                </select>
                <button 
                    type="button" 
                    onClick={addAttribute} 
                    className="px-4 py-1.5 bg-gray-100 border border-gray-300 text-[#2271b1] rounded-sm text-sm font-medium hover:bg-gray-200 transition"
                >
                    Add
                </button>
            </div>

            <div className="space-y-3">
                <datalist id="global-attrs">
                    {globalAttrs.map(a => <option key={a.id} value={a.name} />)}
                </datalist>

                {data.attributes.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No attributes added yet. Add one from the dropdown above.</p>
                )}

                {data.attributes.map((attr, i) => (
                    <div key={attr.id} className="border border-gray-300 bg-gray-50 p-4 rounded-sm transition-all hover:shadow-sm">
                        <div className="flex justify-between mb-3 pb-2 border-b border-gray-200">
                             <span className="font-bold text-sm text-gray-700">{attr.name || `Attribute #${i + 1}`}</span>
                             <div className="flex items-center gap-2">
                                {/* 🔥 NEW: Move Up/Down Buttons */}
                                <button type="button" disabled={i === 0} onClick={() => moveAttr(i, 'up')} className="text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronUp size={16}/></button>
                                <button type="button" disabled={i === data.attributes.length - 1} onClick={() => moveAttr(i, 'down')} className="text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronDown size={16}/></button>
                                <span className="text-gray-300">|</span>
                                <button type="button" onClick={() => removeAttr(i)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold mb-1 text-[#3c434a]">Name</label>
                                <input 
                                    list="global-attrs"
                                    value={attr.name} 
                                    onChange={(e) => updateAttr(i, 'name', e.target.value)}
                                    className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white"
                                    placeholder="e.g. Color or Size"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-1 text-[#3c434a]">Values</label>
                                <div className="bg-white border border-gray-400 p-1.5 rounded-sm flex flex-wrap gap-2 min-h-[36px] focus-within:border-[#2271b1] focus-within:ring-1 focus-within:ring-[#2271b1]">
                                    {attr.values.map((v, vIdx) => (
                                        <span key={vIdx} className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-sm flex items-center gap-1 text-gray-700">
                                            {v} 
                                            <X 
                                                size={12} 
                                                className="cursor-pointer text-gray-500 hover:text-red-600" 
                                                onClick={() => {
                                                    const newVals = attr.values.filter((_, vi) => vi !== vIdx);
                                                    updateAttr(i, 'values', newVals);
                                                }} 
                                            />
                                        </span>
                                    ))}
                                    <input 
                                        className="flex-1 outline-none text-sm min-w-[60px] bg-transparent placeholder:text-gray-300"
                                        placeholder={attr.values.length === 0 ? "Enter values..." : ""}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if(!attr.values.includes(val)) {
                                                    updateAttr(i, 'values', [...attr.values, val]);
                                                }
                                                e.currentTarget.value = "";
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Press Enter to add a value.</p>
                            </div>
                        </div>

                        <div className="mt-3 flex gap-6">
                            <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer">
                                <input type="checkbox" checked={attr.visible} onChange={() => updateAttr(i, 'visible', !attr.visible)} className="rounded text-[#2271b1] focus:ring-[#2271b1]" /> 
                                Visible on the product page
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer">
                                <input type="checkbox" checked={attr.variation} onChange={() => updateAttr(i, 'variation', !attr.variation)} className="rounded text-[#2271b1] focus:ring-[#2271b1]" /> 
                                Used for variations
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {data.attributes.length > 0 && (
                <div className="mt-5 border-t border-gray-200 pt-4 flex justify-end">
                    <button 
                        type="button"
                        onClick={() => onSubmit && onSubmit()} 
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] disabled:opacity-50 transition text-sm shadow-sm"
                    >
                        <Save size={16} />
                        Save attributes
                    </button>
                </div>
            )}
        </div>
    );
}