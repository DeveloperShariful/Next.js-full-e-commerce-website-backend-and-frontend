// app/admin/products/create/_components/Product_image.tsx

"use client";

import { useState } from "react"; 
import { useFormContext } from "react-hook-form";
import { ChevronUp, ChevronDown } from "lucide-react"; 
import MediaPickerModal from "@/app/(backend)/admin/media/_components/MediaPickerModal";
import { MediaSource } from "@prisma/client";
import { ProductFormData } from "../types";

export default function ProductImage() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const [open, setOpen] = useState(false); 
    const [isExpanded, setIsExpanded] = useState(true);
    
    const featuredImage = watch("featuredImage");

    const handleSelect = (items: { id: string; url: string }[]) => {
        if (!items.length) return;
        setValue("featuredImage", items[0].url, { shouldDirty: true, shouldValidate: true });
        setValue("featuredMediaId", items[0].id, { shouldDirty: true });
    };

    return (
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            {/* Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Product image</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {/* Content */}
            {isExpanded && (
                <div className="p-3 bg-white">
                    {featuredImage ? (
                        <div className="flex flex-col gap-3">
                            <div 
                                onClick={() => setOpen(true)}
                                className="relative w-full cursor-pointer hover:opacity-80 transition-opacity"
                                title="Click to change image"
                            >
                                <img 
                                    src={featuredImage} 
                                    alt="Featured Product Image" 
                                    className="w-full h-auto object-cover border border-[#c3c4c7]"
                                />
                            </div>
                            
                            <button 
                                type="button" 
                                onClick={() => {
                                    setValue("featuredImage", null, { shouldDirty: true, shouldValidate: true });
                                    setValue("featuredMediaId", null, { shouldDirty: true });
                                }} 
                                className="text-[13px] text-[#d63638] hover:underline text-left"
                            >
                                Remove product image
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="text-[13px] text-[#2271b1] hover:underline text-left w-full"
                        >
                            Set product image
                        </button>
                    )}
                </div>
            )}

            <MediaPickerModal
                open={open}
                onClose={() => setOpen(false)}
                onSelect={handleSelect}
                title="Select Product Image"
                source={MediaSource.PRODUCT}
            />
        </div>
    );
}