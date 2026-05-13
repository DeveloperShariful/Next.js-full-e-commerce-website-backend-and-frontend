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

    // Fetch Global Attributes
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

    const getGlobalSuggestions = (attrName: string) => {
        const global = globalAttrs.find(g => g.name.toLowerCase() === attrName.toLowerCase());
        return global ? global.values : [];
    };

    return (
        <div className="max-w-full">
            {/* Header: Add Attribute Dropdown */}
            <div className="flex gap-2 items-center mb-4">
                <select 
                    className="border border-[#8c8f94] px-2 py-1 text-[13px] rounded-[3px] outline-none focus:border-[#2271b1] bg-white text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
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
                    className="px-3 py-1 bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] rounded-[3px] text-[13px] hover:bg-[#f0f0f1] transition-colors shadow-sm"
                >
                    Add
                </button>
            </div>

            <div className="space-y-3">
                {fields.length === 0 && (
                    <p className="text-[13px] text-[#8c8f94] italic border border-dashed border-[#c3c4c7] p-4 text-center rounded-[3px]">
                        No attributes added yet.
                    </p>
                )}

                {fields.map((field, i) => {
                    const currentName = watchedAttributes[i]?.name || "";
                    const suggestions = getGlobalSuggestions(currentName);
                    const currentValues = watchedAttributes[i]?.values || [];

                    return (
                        <div key={field.id} className="border border-[#c3c4c7] bg-[#f6f7f7] p-3 rounded-[3px] transition-all hover:shadow-sm">
                            
                            {/* Accordion Header */}
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#e2e4e7]">
                                 <span className="font-semibold text-[13px] text-[#1d2327]">
                                     {currentName || `Attribute #${i + 1}`}
                                 </span>
                                 <div className="flex items-center gap-2">
                                    <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="text-[#8c8f94] hover:text-[#1d2327] disabled:opacity-30 transition-colors"><ChevronUp size={16}/></button>
                                    <button type="button" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} className="text-[#8c8f94] hover:text-[#1d2327] disabled:opacity-30 transition-colors"><ChevronDown size={16}/></button>
                                    <span className="text-[#c3c4c7]">|</span>
                                    <button type="button" onClick={() => remove(i)} className="text-[#d63638] hover:underline text-[12px]">Remove</button>
                                 </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-[12px] font-semibold mb-1 text-[#3c434a]">Name:</label>
                                    <input 
                                        {...register(`attributes.${i}.name`)}
                                        list={`global-list-${i}`}
                                        className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] focus:border-[#2271b1] outline-none text-[13px] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
                                        placeholder="e.g. Color or Size"
                                    />
                                    <datalist id={`global-list-${i}`}>
                                        {globalAttrs.map(g => <option key={g.id} value={g.name} />)}
                                    </datalist>
                                    {errors.attributes?.[i]?.name && <p className="text-[#d63638] text-[11px] mt-1">{errors.attributes[i]?.name?.message}</p>}
                                </div>

                                {/* Values Input & Selection */}
                                <div>
                                    <label className="block text-[12px] font-semibold mb-1 text-[#3c434a]">Value(s):</label>
                                    
                                    {/* Selected Values Container */}
                                    <div className="bg-white border border-[#8c8f94] p-1.5 rounded-[3px] flex flex-wrap gap-1.5 min-h-[34px] focus-within:ring-1 focus-within:ring-[#2271b1] focus-within:border-[#2271b1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]">
                                        {currentValues.map((v, vIdx) => (
                                            <span key={vIdx} className="bg-[#f0f0f1] border border-[#c3c4c7] px-2 py-0.5 rounded-[2px] text-[12px] flex items-center gap-1 text-[#3c434a]">
                                                {v} <X size={12} className="cursor-pointer text-[#8c8f94] hover:text-[#d63638]" onClick={() => removeValue(i, vIdx)} />
                                            </span>
                                        ))}
                                        <input 
                                            className="flex-1 outline-none text-[12px] min-w-[60px] bg-transparent"
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

                                    {/* Quick Select Suggestions */}
                                    {suggestions.length > 0 && (
                                        <div className="mt-2">
                                            <div className="flex flex-wrap gap-1.5">
                                                {suggestions.map(sug => {
                                                    const isSelected = currentValues.includes(sug);
                                                    return (
                                                        <button 
                                                            key={sug}
                                                            type="button"
                                                            onClick={() => isSelected ? null : addValue(i, sug)} 
                                                            disabled={isSelected}
                                                            className={`px-2 py-0.5 text-[11px] rounded-[2px] border transition flex items-center gap-1
                                                                ${isSelected 
                                                                    ? 'bg-[#f0f6fc] border-[#c5d9ed] text-[#2271b1] cursor-default' 
                                                                    : 'bg-white border-[#c3c4c7] text-[#50575e] hover:border-[#2271b1] hover:text-[#2271b1]'
                                                                }`}
                                                        >
                                                            {sug}
                                                            {isSelected ? <Check size={10}/> : <Plus size={10}/>}
                                                        </button>
                                                    )
                                                })}
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newVals = Array.from(new Set([...currentValues, ...suggestions]));
                                                        setValue(`attributes.${i}.values`, newVals, { shouldDirty: true });
                                                    }}
                                                    className="px-2 py-0.5 text-[11px] rounded-[2px] border border-dashed border-[#8c8f94] text-[#2271b1] hover:bg-white transition-colors"
                                                >
                                                    Select All
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Checkboxes Row */}
                            <div className="mt-3 pt-3 border-t border-[#e2e4e7] flex gap-6 flex-wrap">
                                <label className="flex items-center gap-1.5 text-[12px] text-[#3c434a] select-none cursor-pointer">
                                    <input type="checkbox" {...register(`attributes.${i}.visible`)} className="rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] w-3.5 h-3.5" /> 
                                    Visible on the product page
                                </label>
                                <label className="flex items-center gap-1.5 text-[12px] text-[#3c434a] select-none cursor-pointer">
                                    <input type="checkbox" {...register(`attributes.${i}.variation`)} className="rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1] w-3.5 h-3.5" /> 
                                    Used for variations
                                </label>
                                <label className={`flex items-center gap-1.5 text-[12px] select-none cursor-pointer px-2 py-0.5 rounded-[2px] border transition-colors ${watchedAttributes[i]?.saveGlobally ? 'bg-[#fef2f2] border-[#fecaca] text-[#d63638]' : 'bg-transparent border-transparent text-[#50575e] hover:bg-white'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={watchedAttributes[i]?.saveGlobally}
                                        onChange={(e) => handleGlobalSaveCheck(i, e.target.checked)}
                                        className="rounded-[2px] border-[#8c8f94] text-[#d63638] focus:ring-[#d63638] w-3.5 h-3.5" 
                                    /> 
                                    {watchedAttributes[i]?.saveGlobally && <AlertTriangle size={12}/>} Save new values globally
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            {fields.length > 0 && (
                <div className="mt-5 border-t border-[#f0f0f1] pt-4 flex justify-start">
                    <button 
                        type="button" 
                        onClick={() => onSubmit && onSubmit()} 
                        disabled={loading} 
                        className="px-4 py-1.5 bg-[#2271b1] text-white font-medium rounded-[3px] border border-[#2271b1] text-[13px] hover:bg-[#135e96] hover:border-[#135e96] disabled:opacity-50 transition-colors shadow-sm"
                    >
                        Save attributes
                    </button>
                </div>
            )}
        </div>
    );
}