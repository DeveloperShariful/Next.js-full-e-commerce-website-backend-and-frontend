// app/admin/products/create/_components/Gallery_images.tsx

"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { ProductFormData } from "../types";
import { MediaSelectorModal } from "@/components/media/media-selector-modal"; // নিশ্চিত করুন পাথ ঠিক আছে
import Image from "next/image";

export default function GalleryImages() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const galleryImages = watch("galleryImages") || [];
    const [open, setOpen] = useState(false);

    // Handle Image Selection (Supports Single or Multi depending on your Modal Logic)
    const handleSelect = (media: any | any[]) => {
        const newUrls = Array.isArray(media) ? media.map((m: any) => m.url) : [media.url];
        
        // Filter duplicates
        const uniqueUrls = newUrls.filter((url: string) => !galleryImages.includes(url));
        
        setValue("galleryImages", [...galleryImages, ...uniqueUrls], { shouldDirty: true, shouldValidate: true });
        setOpen(false);
    };

    const handleRemove = (index: number) => {
        const newImages = galleryImages.filter((_, i) => i !== index);
        setValue("galleryImages", newImages, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-xs text-gray-700 uppercase tracking-wide">Product Gallery</span>
                <span className="text-xs text-gray-400 font-mono">{galleryImages.length} items</span>
            </div>
            
            <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                    {/* Render Selected Images */}
                    {galleryImages.map((url, index) => (
                        <div key={index} className="relative group aspect-square bg-gray-100 rounded-md border border-gray-200 overflow-hidden shadow-sm">
                            <Image 
                                src={url} 
                                alt={`Gallery ${index}`} 
                                fill
                                className="object-cover"
                            />
                            
                            {/* Always Visible Delete Button (Top Right) */}
                            <button 
                                type="button" 
                                onClick={() => handleRemove(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition z-10"
                                title="Remove image"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    {/* Add New Button (Last Item) */}
                    <button 
                        type="button"
                        onClick={() => setOpen(true)}
                        className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-[#2271b1] hover:bg-blue-50 transition text-gray-400 hover:text-[#2271b1]"
                        title="Add Images"
                    >
                        <Plus size={20} />
                        <span className="text-[10px] font-bold mt-1">Add</span>
                    </button>
                </div>

                {galleryImages.length === 0 && (
                    <p className="text-[11px] text-gray-400 mt-3 text-center italic">
                        No images added to gallery yet.
                    </p>
                )}
            </div>

            {open && (
                <MediaSelectorModal 
                    onClose={() => setOpen(false)}
                    onSelect={handleSelect}
                    allowMultiple={true} // যদি আপনার মডাল মাল্টিপল সাপোর্ট করে
                />
            )}
        </div>
    );
}