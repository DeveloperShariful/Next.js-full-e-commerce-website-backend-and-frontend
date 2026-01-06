// File: app/admin/products/create/_components/Attributes.tsx

import { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form"; // 🔥 RHF Imports
import { getAttributes } from "@/app/actions/admin/product/product-read";
import { X, Save, ChevronUp, ChevronDown } from "lucide-react";
import { ProductFormValues } from "../schema"; // স্কিমা ইম্পোর্ট

interface AttributesProps {
    loading?: boolean;
    onSubmit?: () => void;
}

export default function Attributes({ onSubmit, loading }: AttributesProps) {
    const { register, control, setValue, watch, formState: { errors } } = useFormContext<ProductFormValues>();
    
    // 🔥 useFieldArray দিয়ে অ্যারে ম্যানেজমেন্ট (Add, Remove, Move)
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "attributes"
    });

    // রিয়েল-টাইম ডাটা দেখার জন্য (ডুপ্লিকেট চেক এবং ভ্যালু রেন্ডারিংয়ের জন্য)
    const watchedAttributes = watch("attributes");

    const [globalAttrs, setGlobalAttrs] = useState<{id: string, name: string, values: string[]}[]>([]);
    const [selectedAttr, setSelectedAttr] = useState("");

    useEffect(() => {
        getAttributes().then(res => {
            if(res.success) setGlobalAttrs(res.data as any || []);
        });
    }, []);

    const addAttribute = () => {
        // ডুপ্লিকেট চেকিং
        if (selectedAttr) {
            const existingGlobal = globalAttrs.find(a => a.name === selectedAttr);
            if (existingGlobal) {
                if (watchedAttributes.some(a => a.name === existingGlobal.name)) {
                    alert("Attribute already added!");
                    return;
                }
                // Append via RHF
                append({
                    id: `temp_${Date.now()}`,
                    name: existingGlobal.name,
                    values: existingGlobal.values,
                    visible: true,
                    variation: true,
                    position: fields.length
                });
                setSelectedAttr("");
                return;
            }
        }

        // Custom Attribute Add
        append({
            id: `temp_${Date.now()}`,
            name: "",
            values: [],
            visible: true,
            variation: true,
            position: fields.length
        });
    };

    // 🔥 Value (Tag) System Logic
    const addValue = (index: number, val: string) => {
        const currentValues = watchedAttributes[index]?.values || [];
        if (!currentValues.includes(val)) {
            setValue(`attributes.${index}.values`, [...currentValues, val]);
        }
    };

    const removeValue = (index: number, valIdx: number) => {
        const currentValues = watchedAttributes[index]?.values || [];
        const newValues = currentValues.filter((_, i) => i !== valIdx);
        setValue(`attributes.${index}.values`, newValues);
    };

    return (
        <div>
            {/* Header / Add Controls */}
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

                {fields.length === 0 && (
                    <p className="text-sm text-gray-400 italic">No attributes added yet. Add one from the dropdown above.</p>
                )}

                {/* 🔥 Loop through fields using RHF map */}
                {fields.map((field, i) => (
                    <div key={field.id} className="border border-gray-300 bg-gray-50 p-4 rounded-sm transition-all hover:shadow-sm">
                        
                        {/* Row Header */}
                        <div className="flex justify-between mb-3 pb-2 border-b border-gray-200">
                             {/* Watch name to display in header dynamically */}
                             <span className="font-bold text-sm text-gray-700">{watchedAttributes[i]?.name || `Attribute #${i + 1}`}</span>
                             <div className="flex items-center gap-2">
                                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronUp size={16}/></button>
                                <button type="button" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} className="text-gray-500 hover:text-gray-800 disabled:opacity-30"><ChevronDown size={16}/></button>
                                <span className="text-gray-300">|</span>
                                <button type="button" onClick={() => remove(i)} className="text-red-600 hover:text-red-800 text-xs font-medium">Remove</button>
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Name Input */}
                            <div>
                                <label className="block text-xs font-bold mb-1 text-[#3c434a]">Name</label>
                                <input 
                                    list="global-attrs"
                                    {...register(`attributes.${i}.name`)}
                                    className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white"
                                    placeholder="e.g. Color or Size"
                                />
                                {errors.attributes?.[i]?.name && <p className="text-red-500 text-xs mt-1">{errors.attributes[i]?.name?.message}</p>}
                            </div>

                            {/* Values (Tags) Input */}
                            <div>
                                <label className="block text-xs font-bold mb-1 text-[#3c434a]">Values</label>
                                <div className="bg-white border border-gray-400 p-1.5 rounded-sm flex flex-wrap gap-2 min-h-[36px] focus-within:border-[#2271b1] focus-within:ring-1 focus-within:ring-[#2271b1]">
                                    
                                    {/* Render Tags */}
                                    {watchedAttributes[i]?.values?.map((v, vIdx) => (
                                        <span key={vIdx} className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-sm flex items-center gap-1 text-gray-700">
                                            {v} 
                                            <X 
                                                size={12} 
                                                className="cursor-pointer text-gray-500 hover:text-red-600" 
                                                onClick={() => removeValue(i, vIdx)} 
                                            />
                                        </span>
                                    ))}

                                    <input 
                                        className="flex-1 outline-none text-sm min-w-[60px] bg-transparent placeholder:text-gray-300"
                                        placeholder={watchedAttributes[i]?.values?.length === 0 ? "Enter values..." : ""}
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                e.preventDefault();
                                                addValue(i, e.currentTarget.value.trim());
                                                e.currentTarget.value = "";
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Press Enter to add a value.</p>
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="mt-3 flex gap-6">
                            <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    {...register(`attributes.${i}.visible`)}
                                    className="rounded text-[#2271b1] focus:ring-[#2271b1]" 
                                /> 
                                Visible on the product page
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    {...register(`attributes.${i}.variation`)}
                                    className="rounded text-[#2271b1] focus:ring-[#2271b1]" 
                                /> 
                                Used for variations
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Button */}
            {fields.length > 0 && (
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