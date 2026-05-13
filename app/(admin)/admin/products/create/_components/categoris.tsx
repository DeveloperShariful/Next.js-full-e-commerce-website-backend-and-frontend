// app/admin/products/create/_components/categoris.tsx

"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getCategories } from "@/app/actions/admin/product/category";
import { ProductFormData } from "../types";

export default function Categories() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const currentCategory = watch("category");
    
    const [dbCategories, setDbCategories] = useState<{id: string, name: string}[]>([]);
    const [input, setInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        getCategories().then(res => {
            if(res.success) setDbCategories(res.data as any);
        });
    }, []);

    const addCategory = () => {
        if(!input.trim()) return;
        
        const newCat = { id: `temp_${Date.now()}`, name: input.trim() };
        setDbCategories([...dbCategories, newCat]);
        setValue("category", newCat.name, { shouldDirty: true, shouldValidate: true });
        setInput("");
    };

    return (
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            {/* Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Product categories</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {/* Content */}
            {isExpanded && (
                <div className="p-3 bg-white">
                    {/* Category List */}
                    <div className="max-h-[200px] overflow-y-auto border border-[#c3c4c7] p-2 bg-white mb-3 rounded-[3px] custom-scrollbar">
                        {dbCategories.length === 0 ? (
                            <p className="text-[12px] text-[#8c8f94] italic">No categories found.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {dbCategories.map(cat => (
                                    <li key={cat.id}>
                                        <label className="flex items-start gap-2 select-none text-[13px] text-[#3c434a] cursor-pointer hover:text-[#2271b1]">
                                            <input 
                                                type="radio" 
                                                checked={currentCategory === cat.name} 
                                                onChange={() => setValue("category", cat.name, { shouldDirty: true, shouldValidate: true })}
                                                className="mt-0.5 w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]"
                                            />
                                            <span className="leading-tight">{cat.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Add New Category Input */}
                    <div className="mt-2">
                        <label className="text-[12px] text-[#2271b1] hover:underline cursor-pointer mb-1 block">+ Add new category</label>
                        <div className="flex gap-2">
                            <input 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="New category name" 
                                className="flex-1 border border-[#8c8f94] px-2 py-1 text-[13px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] rounded-[3px]"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                            />
                            <button 
                                type="button" 
                                onClick={addCategory} 
                                className="px-3 py-1 bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] text-[13px] font-medium hover:bg-[#f0f0f1] rounded-[3px] transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}