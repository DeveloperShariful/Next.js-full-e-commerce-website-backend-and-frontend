// app/admin/products/create/_components/Product_image.tsx

"use client";

import { useState } from "react"; 
import { useFormContext } from "react-hook-form";
import { X, RefreshCw, ImagePlus } from "lucide-react"; 
import { MediaSelectorModal } from "@/components/media/media-selector-modal"; 
import { ProductFormData } from "../types";

export default function ProductImage() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const [open, setOpen] = useState(false); 
    
    const featuredImage = watch("featuredImage");

    const handleSelect = (media: any) => {
        setValue("featuredImage", media.url, { shouldDirty: true, shouldValidate: true });
        setValue("featuredMediaId", media.id, { shouldDirty: true });
        setOpen(false); 
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">
                Product Image
            </div>
            
            <div className="p-3">
                {featuredImage ? (
                    <div className="relative group">
                        <img 
                            src={featuredImage} 
                            alt="Featured" 
                            className="w-full h-auto rounded border border-gray-200" 
                        />
                        
                        {/* Actions Overlay */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                            <button 
                                type="button" 
                                onClick={() => setOpen(true)} 
                                className="bg-white text-indigo-600 p-1.5 rounded shadow-sm hover:bg-indigo-50 border border-gray-200"
                                title="Replace Image"
                            >
                                <RefreshCw size={14}/>
                            </button>

                            <button 
                                type="button" 
                                onClick={() => {
                                    setValue("featuredImage", null, { shouldDirty: true, shouldValidate: true });
                                    setValue("featuredMediaId", null, { shouldDirty: true });
                                }} 
                                className="bg-white text-red-500 p-1.5 rounded shadow-sm hover:bg-red-50 border border-gray-200"
                                title="Remove Image"
                            >
                                <X size={14}/>
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded hover:bg-gray-50 hover:border-indigo-400 transition gap-2 text-gray-500 hover:text-indigo-600"
                    >
                        <ImagePlus size={24} />
                        <span className="text-xs font-semibold">Select Featured Image</span>
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