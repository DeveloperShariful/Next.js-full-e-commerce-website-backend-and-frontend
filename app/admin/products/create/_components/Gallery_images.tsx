// app/admin/products/create/_components/Gallery_images.tsx

import { ComponentProps } from "../types";
import ImageUpload from "@/components/ui/image-upload"; 
import { X, Plus } from "lucide-react";

export default function GalleryImages({ data, updateData }: ComponentProps) {
    
    // Logic: Append new image to existing array
    const handleUpload = (url: string) => {
        if (url) {
            updateData('galleryImages', [...data.galleryImages, url]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        updateData('galleryImages', data.galleryImages.filter((_, i) => i !== indexToRemove));
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">Product Gallery</div>
            <div className="p-3">
                {/* Image Grid */}
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
                
                {/* Upload Button */}
                <div className="flex flex-col gap-2">
                    <ImageUpload 
                        value={[]} // Keep empty to allow adding more
                        onChange={handleUpload}
                        onRemove={() => {}}
                    />
                    <p className="text-xs text-[#2271b1] mt-1 cursor-pointer hover:underline">Add product gallery images</p>
                </div>
            </div>
        </div>
    );
}