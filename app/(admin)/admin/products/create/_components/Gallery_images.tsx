// File: app/admin/products/create/_components/Gallery_images.tsx

"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Plus, X, Image as ImageIcon, Type } from "lucide-react";
import { ProductFormData } from "../types";
import { MediaSelectorModal } from "@/components/media/media-selector-modal"; 
import Image from "next/image";

export default function GalleryImages() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const galleryImages = watch("galleryImages") || [];
    const [open, setOpen] = useState(false);

    const handleSelect = (media: any | any[]) => {
        const selected = Array.isArray(media) ? media : [media];
        
        const newImages = selected.map((m: any) => ({
            url: m.url,
            mediaId: m.id,
            altText: m.altText || "",
            id: undefined 
        }));
        
        const existingUrls = galleryImages.map((img: any) => typeof img === 'string' ? img : img.url);
        const uniqueImages = newImages.filter((img: any) => !existingUrls.includes(img.url));
        
        setValue("galleryImages", [...galleryImages, ...uniqueImages], { shouldDirty: true, shouldValidate: true });
        setOpen(false);
    };

    const handleRemove = (index: number) => {
        const newImages = galleryImages.filter((_, i) => i !== index);
        setValue("galleryImages", newImages, { shouldDirty: true, shouldValidate: true });
    };

    const updateAltText = (index: number, text: string) => {
        const newImages = [...galleryImages];
        const currentImg = newImages[index];

        if (typeof currentImg === 'string') {
            newImages[index] = { url: currentImg, altText: text };
        } else {
            newImages[index] = { ...currentImg, altText: text };
        }
        setValue("galleryImages", newImages, { shouldDirty: true });
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-xs text-gray-700 uppercase tracking-wide">Product Gallery</span>
                <span className="text-xs text-gray-400 font-mono">{galleryImages.length} items</span>
            </div>
            
            <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                    {galleryImages.map((img: any, index: number) => {
                        const url = typeof img === 'string' ? img : img.url;
                        const alt = typeof img === 'object' ? img.altText : "";

                        return (
                            <div key={index} className="relative group aspect-square bg-gray-100 rounded-md border border-gray-200 overflow-hidden shadow-sm">
                                <Image 
                                    src={url} 
                                    alt={alt || `Gallery ${index}`} 
                                    fill
                                    className="object-cover"
                                />
                                
                                <div className="absolute bottom-0 left-0 w-full bg-black/70 p-1.5 translate-y-full group-hover:translate-y-0 transition duration-200 flex items-center gap-1">
                                    <Type size={10} className="text-gray-400 shrink-0"/>
                                    <input 
                                        type="text" 
                                        value={alt || ""} 
                                        onChange={(e) => updateAltText(index, e.target.value)}
                                        placeholder="SEO Alt Text"
                                        className="w-full text-[10px] bg-transparent text-white border-b border-white/30 outline-none px-1 placeholder:text-gray-400 focus:border-white"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>

                                <button 
                                    type="button" 
                                    onClick={() => handleRemove(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition z-10 opacity-0 group-hover:opacity-100"
                                    title="Remove image"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        );
                    })}

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
                    allowMultiple={true} 
                />
            )}
        </div>
    );
}