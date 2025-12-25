// app/admin/products/create/_components/Gallery_images.tsx

import { ComponentProps } from "../types";
import ImageUpload from "@/components/ui/image-upload"; 
import { X } from "lucide-react";

export default function GalleryImages({ data, updateData }: ComponentProps) {
    
    // Functional update to prevent stale state issue
    const handleUpload = (url: string) => {
        if (url) {
            updateData('galleryImages', (prev: string[]) => [...prev, url]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        updateData('galleryImages', data.galleryImages.filter((_, i) => i !== indexToRemove));
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">Product Gallery</div>
            <div className="p-3">
                {/* YOUR CUSTOM GRID (This stays) */}
                {data.galleryImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {data.galleryImages.map((img, i) => (
                            <div key={i} className="relative group aspect-square border border-gray-200 rounded overflow-hidden">
                                <img src={img} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                                <button 
                                    type="button" 
                                    onClick={() => removeImage(i)} 
                                    className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <X size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex flex-col gap-2">
                    {/* 🔥 UPDATE: Hide built-in preview */}
                    <ImageUpload 
                        value={data.galleryImages} 
                        onChange={handleUpload}
                        onRemove={() => {}}
                        showPreview={false} // This fixes the double UI issue
                    />
                    <p className="text-xs text-[#2271b1] mt-1 cursor-pointer hover:underline">Add product gallery images</p>
                </div>
            </div>
        </div>
    );
}