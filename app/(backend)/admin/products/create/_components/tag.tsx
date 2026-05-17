// app/admin/products/create/_components/tag.tsx

"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { ProductFormData } from "../types";

export default function Tag() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const tags = watch("tags") || [];
    const [input, setInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    const addTag = () => {
        if(input.trim()) {
            const newTag = input.trim();
            if (!tags.includes(newTag)) {
                setValue("tags", [...tags, newTag], { shouldDirty: true, shouldValidate: true });
            }
            setInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setValue("tags", tags.filter(t => t !== tagToRemove), { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            {/* Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Product tags</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {/* Content */}
            {isExpanded && (
                <div className="p-3 bg-white">
                    <div className="flex gap-2 mb-3">
                        <input 
                            value={input} 
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); 
                                    addTag();
                                }
                            }}
                            className="flex-1 border border-[#8c8f94] px-2 py-1 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] rounded-[3px]" 
                            placeholder="e.g. Bestseller, Summer"
                        />
                        <button 
                            type="button" 
                            onClick={addTag} 
                            className="px-3 py-1 bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] text-[13px] font-medium hover:bg-[#f0f0f1] rounded-[3px] transition-colors"
                        >
                            Add
                        </button>
                    </div>
                    
                    <p className="text-[12px] text-[#646970] italic mb-3">Separate tags with commas</p>

                    <div className="flex flex-wrap gap-1.5">
                        {tags.map(t => (
                            <span key={t} className="bg-white text-[12px] text-[#3c434a] px-2 py-1 flex items-center gap-1.5 rounded-full border border-[#8c8f94] shadow-sm">
                                <button 
                                    type="button"
                                    className="w-4 h-4 bg-[#f0f0f1] hover:bg-[#d63638] hover:text-white rounded-full flex items-center justify-center transition-colors text-[#8c8f94]" 
                                    onClick={() => removeTag(t)} 
                                    title="Remove tag"
                                >
                                    <X size={10} />
                                </button>
                                {t} 
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}