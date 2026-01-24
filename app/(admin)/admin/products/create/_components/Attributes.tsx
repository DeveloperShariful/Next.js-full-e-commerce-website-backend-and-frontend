// File: app/admin/products/create/_components/Attributes.tsx

"use client";

import { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { getAttributes } from "@/app/actions/admin/product/product-read";
import { X, Save, ChevronUp, ChevronDown, AlertTriangle, Plus, Check } from "lucide-react";
import { ProductFormValues } from "../schema";

interface AttributesProps {
    loading?: boolean;
    onSubmit?: () => void;
}

export default function Attributes({ onSubmit, loading }: AttributesProps) {
    const { register, control, setValue, watch, formState: { errors } } = useFormContext<ProductFormValues>();
    
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "attributes"
    });

    const watchedAttributes = watch("attributes");
    const [globalAttrs, setGlobalAttrs] = useState<{id: string, name: string, values: string[]}[]>([]);
    const [selectedAttr, setSelectedAttr] = useState("");

    // Fetch Global Attributes (Colors, Sizes, etc.)
    useEffect(() => {
        getAttributes().then(res => {
            if(res.success) setGlobalAttrs(res.data as any || []);
        });
    }, []);

    const addAttribute = () => {
        let newAttr = {
            id: `temp_${Date.now()}`,
            name: "",
            values: [],
            visible: true,
            variation: true,
            position: fields.length,
            saveGlobally: false
        };

        if (selectedAttr) {
            const existingGlobal = globalAttrs.find(a => a.name === selectedAttr);
            if (existingGlobal) {
                if (watchedAttributes.some(a => a.name === existingGlobal.name)) {
                    alert("Attribute already added!");
                    return;
                }
                // Pre-fill name, but let user select values
                newAttr.name = existingGlobal.name;
                setSelectedAttr("");
            }
        }
        append(newAttr);
    };

    const addValue = (index: number, val: string) => {
        const currentValues = watchedAttributes[index]?.values || [];
        if (!currentValues.includes(val)) {
            setValue(`attributes.${index}.values`, [...currentValues, val], { shouldDirty: true });
        }
    };

    const removeValue = (index: number, valIdx: number) => {
        const currentValues = watchedAttributes[index]?.values || [];
        const newValues = currentValues.filter((_, i) => i !== valIdx);
        setValue(`attributes.${index}.values`, newValues, { shouldDirty: true });
    };

    const handleGlobalSaveCheck = (index: number, checked: boolean) => {
        if (checked) {
            const confirm = window.confirm(
                "⚠️ CAUTION: Enabling this will save any NEW values you add here to the global attribute list.\n\nAre you sure?"
            );
            if (!confirm) return;
        }
        setValue(`attributes.${index}.saveGlobally`, checked, { shouldDirty: true });
    };

    // Helper to find global values for a specific attribute row
    const getGlobalSuggestions = (attrName: string) => {
        const global = globalAttrs.find(g => g.name.toLowerCase() === attrName.toLowerCase());
        return global ? global.values : [];
    };

    return (
        <div>
            {/* Header: Add Attribute Dropdown */}
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
                <button type="button" onClick={addAttribute} className="px-4 py-1.5 bg-gray-100 border border-gray-300 text-[#2271b1] rounded-sm text-sm font-medium hover:bg-gray-200 transition">Add</button>
            </div>

            <div className="space-y-3">
                {fields.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No attributes added yet.</p>
                )}

                {fields.map((field, i) => {
                    const currentName = watchedAttributes[i]?.name || "";
                    const suggestions = getGlobalSuggestions(currentName);
                    const currentValues = watchedAttributes[i]?.values || [];

                    return (
                        <div key={field.id} className="border border-gray-300 bg-gray-50 p-4 rounded-sm transition-all hover:shadow-sm">
                            
                            {/* Accordion Header */}
                            <div className="flex justify-between mb-3 pb-2 border-b border-gray-200">
                                 <span className="font-bold text-sm text-gray-700">{currentName || `Attribute #${i + 1}`}</span>
                                 <div className="flex items-center gap-2">
                                    <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronUp size={16}/></button>
                                    <button type="button" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} className="text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronDown size={16}/></button>
                                    <button type="button" onClick={() => remove(i)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                                 </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-[#3c434a]">Name</label>
                                    <input 
                                        {...register(`attributes.${i}.name`)}
                                        list={`global-list-${i}`}
                                        className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white"
                                        placeholder="e.g. Color or Size"
                                    />
                                    <datalist id={`global-list-${i}`}>
                                        {globalAttrs.map(g => <option key={g.id} value={g.name} />)}
                                    </datalist>
                                    {errors.attributes?.[i]?.name && <p className="text-red-500 text-xs mt-1">{errors.attributes[i]?.name?.message}</p>}
                                </div>

                                {/* Values Input & Selection */}
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-[#3c434a]">Values</label>
                                    
                                    {/* Selected Values Container */}
                                    <div className="bg-white border border-gray-400 p-1.5 rounded-sm flex flex-wrap gap-2 min-h-[36px] focus-within:ring-1 focus-within:ring-[#2271b1] focus-within:border-[#2271b1]">
                                        {currentValues.map((v, vIdx) => (
                                            <span key={vIdx} className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-sm flex items-center gap-1 text-gray-700">
                                                {v} <X size={12} className="cursor-pointer hover:text-red-600" onClick={() => removeValue(i, vIdx)} />
                                            </span>
                                        ))}
                                        <input 
                                            className="flex-1 outline-none text-sm min-w-[60px] bg-transparent"
                                            placeholder={currentValues.length === 0 ? "Enter values..." : ""}
                                            onKeyDown={(e) => {
                                                if(e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                    e.preventDefault();
                                                    addValue(i, e.currentTarget.value.trim());
                                                    e.currentTarget.value = "";
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* 🔥 Quick Select Suggestions (Colors/Sizes) */}
                                    {suggestions.length > 0 && (
                                        <div className="mt-2 animate-in fade-in">
                                            <p className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">Quick Select:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {suggestions.map(sug => {
                                                    const isSelected = currentValues.includes(sug);
                                                    return (
                                                        <button 
                                                            key={sug}
                                                            type="button"
                                                            onClick={() => isSelected ? null : addValue(i, sug)} // Toggle logic can be added if needed
                                                            disabled={isSelected}
                                                            className={`px-2 py-1 text-xs rounded border transition flex items-center gap-1
                                                                ${isSelected 
                                                                    ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-default' 
                                                                    : 'bg-white border-gray-300 text-gray-600 hover:border-[#2271b1] hover:text-[#2271b1]'
                                                                }`}
                                                        >
                                                            {sug}
                                                            {isSelected ? <Check size={10}/> : <Plus size={10}/>}
                                                        </button>
                                                    )
                                                })}
                                                
                                                {/* Select All Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newVals = Array.from(new Set([...currentValues, ...suggestions]));
                                                        setValue(`attributes.${i}.values`, newVals, { shouldDirty: true });
                                                    }}
                                                    className="px-2 py-1 text-xs rounded border border-dashed border-gray-400 text-gray-500 hover:bg-gray-100"
                                                >
                                                    Select All
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex gap-6 flex-wrap">
                                <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer">
                                    <input type="checkbox" {...register(`attributes.${i}.visible`)} className="rounded text-[#2271b1] focus:ring-[#2271b1]" /> 
                                    Visible on product page
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer">
                                    <input type="checkbox" {...register(`attributes.${i}.variation`)} className="rounded text-[#2271b1] focus:ring-[#2271b1]" /> 
                                    Used for variations
                                </label>
                                <label className={`flex items-center gap-1.5 text-xs font-medium select-none cursor-pointer px-2 py-0.5 rounded border ${watchedAttributes[i]?.saveGlobally ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={watchedAttributes[i]?.saveGlobally}
                                        onChange={(e) => handleGlobalSaveCheck(i, e.target.checked)}
                                        className="rounded text-red-600 focus:ring-red-600" 
                                    /> 
                                    {watchedAttributes[i]?.saveGlobally && <AlertTriangle size={12}/>} Save new values globally
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            {fields.length > 0 && (
                <div className="mt-5 border-t border-gray-200 pt-4 flex justify-end">
                    <button type="button" onClick={() => onSubmit && onSubmit()} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] disabled:opacity-50 transition text-sm shadow-sm">
                        <Save size={16} /> Save attributes
                    </button>
                </div>
            )}
        </div>
    );
}