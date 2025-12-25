// app/admin/products/create/_components/Product_image.tsx

import { ComponentProps } from "../types";
import ImageUpload from "@/components/ui/image-upload";
import { X } from "lucide-react";

export default function ProductImage({ data, updateData }: ComponentProps) {
    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">Product Image</div>
            <div className="p-3">
                {data.featuredImage ? (
                    <div className="relative group">
                        <img src={data.featuredImage} alt="Featured" className="w-full h-auto rounded border border-gray-200" />
                        <button type="button" onClick={() => updateData('featuredImage', null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition">
                            <X size={12}/>
                        </button>
                    </div>
                ) : (
                    <ImageUpload  
                        value={[]} 
                        onChange={(url) => updateData('featuredImage', url)}
                        onRemove={() => updateData('featuredImage', null)}
                    />
                )}
            </div>
        </div>
    );
}