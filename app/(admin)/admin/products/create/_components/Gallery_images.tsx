// app/admin/products/create/_components/Gallery_images.tsx

"use client";

import { useFormContext } from "react-hook-form";
// ✅ Import New Multi Picker
import { MediaPickerMulti } from "@/components/media/media-picker-multi";
import { ProductFormData } from "../types";

export default function GalleryImages() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const galleryImages = watch("galleryImages") || [];

    const handleUpdate = (urls: string[]) => {
        setValue("galleryImages", urls, { shouldDirty: true, shouldValidate: true });
    };

    const handleRemove = (index: number) => {
        const newImages = galleryImages.filter((_, i) => i !== index);
        setValue("galleryImages", newImages, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">
                Product Gallery
            </div>
            <div className="p-3">
                {/* ✅ Using New Multi Media Picker */}
                <MediaPickerMulti 
                    label=""
                    value={galleryImages}
                    onChange={handleUpdate}
                    onRemove={handleRemove}
                />
                
                {galleryImages.length === 0 && (
                    <p className="text-[11px] text-slate-400 mt-2 text-center">
                        Add multiple images for product showcase
                    </p>
                )}
            </div>
        </div>
    );
}