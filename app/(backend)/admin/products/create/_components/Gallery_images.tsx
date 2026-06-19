// File: app/admin/products/create/_components/Gallery_images.tsx

"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { ProductFormData } from "../types";
import MediaPickerModal, { PickedMedia } from "@/app/(backend)/admin/media/_components/MediaPickerModal";
import { MediaSource } from "@prisma/client";

export default function GalleryImages() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const galleryImages = watch("galleryImages") || [];
    const [open, setOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const handleSelect = (items: PickedMedia[]) => {
        const newImages = items.map(m => ({
            url: m.url,
            mediaId: m.id,
            altText: m.altText || "",
            id: undefined,
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

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = "move";
        setTimeout(() => {
            if (e.target instanceof HTMLElement) e.target.style.opacity = "0.5";
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setDraggedIdx(null);
        if (e.target instanceof HTMLElement) e.target.style.opacity = "1";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === dropIndex) return;

        const newImages = [...galleryImages];
        const draggedItem = newImages[draggedIdx];
        
        newImages.splice(draggedIdx, 1);
        newImages.splice(dropIndex, 0, draggedItem);

        setValue("galleryImages", newImages, { shouldDirty: true, shouldValidate: true });
        setDraggedIdx(null);
    };

    return (
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Product gallery</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {isExpanded && (
                <div className="p-3 bg-white">
                    {galleryImages.length > 0 && (
                        // 🚀 FIXED: grid-cols-4 for mobile ensures small square images just like desktop
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 xl:grid-cols-4 gap-2 mb-3">
                            {galleryImages.map((img: any, index: number) => {
                                const url = typeof img === 'string' ? img : img.url;
                                const alt = typeof img === 'object' ? img.altText : "";

                                return (
                                    <div 
                                        key={index} 
                                        draggable 
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative group bg-white border border-[#c3c4c7] flex flex-col cursor-move transition-all ${draggedIdx === index ? 'opacity-50' : 'opacity-100'}`}
                                    >
                                        <div className="relative aspect-square w-full bg-[#f0f0f1] overflow-hidden">
                                            <img 
                                                src={url} 
                                                alt={alt || `Gallery ${index}`} 
                                                className="w-full h-full object-cover pointer-events-none" 
                                            />
                                            
                                            {/* 🚀 FIXED: Delete button is always visible on Mobile, but visible on Hover for Desktop */}
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemove(index)}
                                                className=" absolute -top-0.5 -right-0.5 bg-[#d63638] text-white rounded-full p-0.5 hover:bg-red-700 transition shadow-sm z-10 opacity-100 lg:opacity-0 group-hover:opacity-100"
                                                title="Remove image"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>

                                        <input 
                                            type="text" 
                                            value={alt || ""} 
                                            onChange={(e) => updateAltText(index, e.target.value)}
                                            placeholder="Alt text"
                                            className="w-full text-[10px] px-1 py-1 border-t border-[#c3c4c7] text-[#3c434a] outline-none focus:bg-[#f0f6fc]"
                                            onClick={(e) => e.stopPropagation()} 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="text-[13px] text-[#2271b1] hover:underline text-left w-full"
                    >
                        Add product gallery images
                    </button>
                </div>
            )}

            <MediaPickerModal
                open={open}
                onClose={() => setOpen(false)}
                onSelect={handleSelect}
                multiple={true}
                title="Select Gallery Images"
                source={MediaSource.PRODUCT}
            />
        </div>
    );
}