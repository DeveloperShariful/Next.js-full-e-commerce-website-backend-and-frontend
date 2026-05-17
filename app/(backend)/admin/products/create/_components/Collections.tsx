// app/admin/products/create/_components/Collections.tsx

"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { getCollections } from "@/app/actions/backend/product/product-read";
import { ProductFormData } from "../types";

export default function Collections() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const selectedIds = watch("collectionIds") || [];

    const [dbCollections, setDbCollections] = useState<{id: string, name: string}[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        getCollections().then(res => { 
            if(res.success) setDbCollections(res.data as any);
        });
    }, []);

    const toggleCollection = (id: string) => {
        const newIds = selectedIds.includes(id)
            ? selectedIds.filter(c => c !== id)
            : [...selectedIds, id];
        setValue("collectionIds", newIds, { shouldDirty: true, shouldValidate: true });
    };

    const filteredCollections = dbCollections.filter(col => 
        col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            {/* Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Product Collections</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {/* Content */}
            {isExpanded && (
                <div className="p-3 bg-white">
                    {/* Search */}
                    <div className="relative mb-3">
                        <input 
                            type="text" 
                            placeholder="Search collections..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-[#8c8f94] pl-7 pr-2 py-1 text-[13px] rounded-[3px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                        />
                        <Search size={14} className="absolute left-2 top-1.5 text-[#8c8f94]"/>
                    </div>

                    {/* Collection List */}
                    <div className="max-h-[150px] overflow-y-auto border border-[#c3c4c7] p-2 bg-white rounded-[3px] custom-scrollbar">
                        {filteredCollections.length > 0 ? (
                            <ul className="space-y-1.5">
                                {filteredCollections.map(col => (
                                    <li key={col.id}>
                                        <label className="flex items-start gap-2 select-none text-[13px] text-[#3c434a] cursor-pointer hover:text-[#2271b1]">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(col.id)} 
                                                onChange={() => toggleCollection(col.id)}
                                                className="mt-0.5 w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]"
                                            />
                                            <span className="leading-tight">{col.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[12px] text-[#8c8f94] italic text-center py-2">
                                {searchTerm ? "No match found." : "No collections available."}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}