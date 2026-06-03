// File: app/admin/products/create/_components/Attributes.tsx

// File: app/admin/products/create/_components/Attributes.tsx

"use client";

import { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { getAttributes } from "@/app/actions/backend/product/product-read";
import { X, ChevronUp, ChevronDown, AlertTriangle, Plus, Check } from "lucide-react";
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

    // WP Input Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white";

    return (
        <div className="w-full text-[13px] text-[#3c434a]">
            
            {/* Header: Add Attribute Dropdown */}
            <div className="flex gap-2 items-center mb-[15px] bg-[#f6f7f7] p-[10px] border border-[#c3c4c7] rounded-[3px]">
                <select 
                    className={`${wpInputClass} !w-auto min-w-[200px]`}
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
                    className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2c3338] hover:bg-[#f0f0f1] hover:border-[#8c8f94] hover:text-[#2c3338] rounded-[3px] px-[12px] py-[4px] text-[13px] cursor-pointer min-h-[30px]"
                >
                    Add
                </button>
            </div>

            <div className="space-y-[10px]">
                {fields.length === 0 && (
                    <div className="text-[13px] text-[#646970] italic border border-dashed border-[#c3c4c7] bg-[#f6f7f7] p-[20px] text-center rounded-[3px]">
                        No attributes added yet. Add an attribute to configure variations or display extra product data.
                    </div>
                )}

                {fields.map((field, i) => {
                    const currentName = watchedAttributes[i]?.name || "";
                    const suggestions = getGlobalSuggestions(currentName);
                    const currentValues = watchedAttributes[i]?.values || [];

                    return (
                        <div key={field.id} className="border border-[#c3c4c7] bg-[#f6f7f7] rounded-[3px] overflow-hidden">
                            
                            {/* Accordion Header (WP Style) */}
                            <div className="flex justify-between items-center p-[10px] border-b border-[#c3c4c7] bg-white cursor-pointer select-none hover:bg-[#f0f0f1]">
                                 <strong className="text-[13px] text-[#1d2327]">
                                     {currentName || `Attribute #${i + 1}`}
                                 </strong>
                                 <div className="flex items-center gap-[10px]">
                                    <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="bg-transparent border-none text-[#8c8f94] hover:text-[#1d2327] disabled:opacity-30 cursor-pointer p-0"><ChevronUp size={16}/></button>
                                    <button type="button" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} className="bg-transparent border-none text-[#8c8f94] hover:text-[#1d2327] disabled:opacity-30 cursor-pointer p-0"><ChevronDown size={16}/></button>
                                    <button type="button" onClick={() => remove(i)} className="bg-transparent border-none text-[#d63638] hover:underline text-[12px] cursor-pointer p-0">Remove</button>
                                 </div>
                            </div>
                            
                            <div className="p-[15px] flex flex-col md:flex-row gap-[20px] items-start">
                                {/* Name Input */}
                                <div className="w-full md:w-[250px] shrink-0">
                                    <label className="block text-[13px] font-semibold mb-[5px] text-[#1d2327]">Name:</label>
                                    <input 
                                        {...register(`attributes.${i}.name`)}
                                        list={`global-list-${i}`}
                                        className={wpInputClass}
                                        placeholder="e.g. Color or Size"
                                    />
                                    <datalist id={`global-list-${i}`}>
                                        {globalAttrs.map(g => <option key={g.id} value={g.name} />)}
                                    </datalist>
                                    {errors.attributes?.[i]?.name && <p className="text-[#d63638] text-[12px] mt-1 m-0">{errors.attributes[i]?.name?.message}</p>}
                                </div>

                                {/* Values Input & Selection */}
                                <div className="w-full border-l-0 md:border-l border-[#c3c4c7] pt-[15px] md:pt-0 pl-0 md:pl-[20px]">
                                    <label className="block text-[13px] font-semibold mb-[5px] text-[#1d2327]">Value(s):</label>
                                    
                                    {/* Selected Values Container (Select2 mimic) */}
                                    <div className="bg-white border border-[#8c8f94] p-[4px] rounded-[3px] flex flex-wrap gap-[4px] min-h-[30px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus-within:border-[#2271b1] focus-within:shadow-[0_0_0_1px_#2271b1]">
                                        {currentValues.map((v, vIdx) => (
                                            <span key={vIdx} className="bg-[#f0f0f1] border border-[#c3c4c7] text-[#3c434a] text-[12px] px-[6px] py-[2px] rounded-[3px] flex items-center gap-[4px] leading-tight">
                                                {v} <X size={12} className="cursor-pointer text-[#8c8f94] hover:text-[#d63638]" onClick={() => removeValue(i, vIdx)} />
                                            </span>
                                        ))}
                                        <input 
                                            className="flex-1 outline-none text-[13px] min-w-[100px] bg-transparent py-[2px] border-none shadow-none"
                                            placeholder={currentValues.length === 0 ? "Enter some text, or some attributes by | separating values." : ""}
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
                                        <div className="mt-[10px] flex flex-wrap gap-[5px]">
                                            {suggestions.map(sug => {
                                                const isSelected = currentValues.includes(sug);
                                                return (
                                                    <button 
                                                        key={sug}
                                                        type="button"
                                                        onClick={() => isSelected ? null : addValue(i, sug)} 
                                                        disabled={isSelected}
                                                        className={`bg-white border border-[#c3c4c7] text-[#50575e] hover:border-[#8c8f94] hover:bg-[#f6f7f7] rounded-[3px] px-[8px] py-[2px] text-[11px] cursor-pointer flex items-center gap-[4px] disabled:opacity-50 disabled:cursor-default`}
                                                    >
                                                        {sug}
                                                        {isSelected ? <Check size={10} className="text-[#007017]"/> : <Plus size={10}/>}
                                                    </button>
                                                )
                                            })}
                                            
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newVals = Array.from(new Set([...currentValues, ...suggestions]));
                                                    setValue(`attributes.${i}.values`, newVals, { shouldDirty: true });
                                                }}
                                                className="bg-transparent border border-dashed border-[#c3c4c7] text-[#2271b1] hover:text-[#135e96] hover:border-[#135e96] rounded-[3px] px-[8px] py-[2px] text-[11px] cursor-pointer ml-[5px]"
                                            >
                                                Select All
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Checkboxes Row */}
                            <div className="bg-[#f0f0f1] p-[10px] border-t border-[#c3c4c7] flex gap-[20px] flex-wrap items-center">
                                <label className="flex items-center gap-[6px] text-[13px] text-[#3c434a] cursor-pointer">
                                    <input type="checkbox" {...register(`attributes.${i}.visible`)} className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 m-0" /> 
                                    Visible on the product page
                                </label>
                                <label className="flex items-center gap-[6px] text-[13px] text-[#3c434a] cursor-pointer">
                                    <input type="checkbox" {...register(`attributes.${i}.variation`)} className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 m-0" /> 
                                    Used for variations
                                </label>
                                <label className="flex items-center gap-[6px] text-[13px] text-[#d63638] cursor-pointer ml-auto">
                                    <input 
                                        type="checkbox" 
                                        checked={watchedAttributes[i]?.saveGlobally}
                                        onChange={(e) => handleGlobalSaveCheck(i, e.target.checked)}
                                        className="border-[#8c8f94] rounded-[3px] focus:ring-[#d63638] text-[#d63638] w-4 h-4 m-0" 
                                    /> 
                                    Save new values globally
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            {fields.length > 0 && (
                <div className="mt-[20px]">
                    <button 
                        type="button" 
                        onClick={() => onSubmit && onSubmit()} 
                        disabled={loading} 
                        className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2c3338] hover:bg-[#f0f0f1] hover:border-[#8c8f94] hover:text-[#2c3338] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
                    >
                        Save attributes
                    </button>
                </div>
            )}
        </div>
    );
}