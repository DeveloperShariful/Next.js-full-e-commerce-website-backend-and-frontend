// app/admin/products/create/_components/Product_image.tsx

"use client";

import { useState } from "react"; 
import { useFormContext } from "react-hook-form";
import { X, RefreshCw, ImagePlus } from "lucide-react"; 
import { MediaSelectorModal } from "@/components/media/media-selector-modal"; 
import { ProductFormData } from "../types";
import Image from "next/image";

export default function ProductImage() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const [open, setOpen] = useState(false); 
    
    const featuredImage = watch("featuredImage");

    const handleSelect = (media: any) => {
        // Saving both URL and ID for relation
        setValue("featuredImage", media.url, { shouldDirty: true, shouldValidate: true });
        setValue("featuredMediaId", media.id, { shouldDirty: true });
        setOpen(false); 
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-xs text-gray-700 uppercase tracking-wide">Featured Image</span>
                {featuredImage && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Set</span>
                )}
            </div>
            
            <div className="p-4">
                {featuredImage ? (
                    <div className="flex flex-col gap-3">
                        <div className="relative w-full aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shadow-inner group">
                            <Image 
                                src={featuredImage} 
                                alt="Featured Product Image" 
                                fill
                                className="object-cover transition-transform group-hover:scale-105 duration-500"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                type="button" 
                                onClick={() => setOpen(true)} 
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-[#2271b1] border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 transition"
                            >
                                <RefreshCw size={14} /> Change
                            </button>

                            <button 
                                type="button" 
                                onClick={() => {
                                    setValue("featuredImage", null, { shouldDirty: true, shouldValidate: true });
                                    setValue("featuredMediaId", null, { shouldDirty: true });
                                }} 
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 transition"
                            >
                                <X size={14} /> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-[#2271b1] transition-all duration-200"
                    >
                        <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white group-hover:text-[#2271b1] transition mb-2">
                            <ImagePlus size={24} className="text-gray-400 group-hover:text-[#2271b1]" />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 group-hover:text-[#2271b1]">Set Product Image</span>
                    </button>
                )}
            </div>

            {open && (
                <MediaSelectorModal 
                    onClose={() => setOpen(false)}
                    onSelect={handleSelect}
                />
            )}
        </div>
    );
}