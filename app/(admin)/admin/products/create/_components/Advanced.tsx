// File: app/admin/products/create/_components/Advanced.tsx

import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "../schema"; // স্কিমা ফাইল ইম্পোর্ট

export default function Advanced() {
    // React Hook Form কনটেক্সট ব্যবহার করা হচ্ছে
    const { register, formState: { errors } } = useFormContext<ProductFormValues>();

    return (
        <div className="space-y-5 max-w-lg">
            {/* Purchase Note */}
            <div>
                <label className="block text-xs font-medium mb-1">Purchase Note</label>
                <textarea 
                    {...register("purchaseNote")}
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                    rows={2} 
                    placeholder="Note to send to customer after purchase"
                />
                {errors.purchaseNote && <p className="text-red-500 text-xs mt-1">{errors.purchaseNote.message}</p>}
            </div>

            {/* Menu Order */}
            <div>
                <label className="block text-xs font-medium mb-1">Menu Order</label>
                <input 
                    type="number" 
                    {...register("menuOrder")}
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                />
                 {errors.menuOrder && <p className="text-red-500 text-xs mt-1">{errors.menuOrder.message}</p>}
            </div>

            {/* Enable Reviews */}
            <div>
                <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
                    <input 
                        type="checkbox" 
                        {...register("enableReviews")}
                    />
                    Enable Reviews
                </label>
            </div>
            
            <hr className="border-gray-200 my-4"/>
            
            {/* Canonical URL */}
            <div>
                <label className="block text-xs font-medium mb-1">Canonical URL (SEO)</label>
                <input 
                    type="text" 
                    {...register("seoCanonicalUrl")}
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                    placeholder="https://example.com/original-product"
                />
                <p className="text-[10px] text-gray-500 mt-1">Leave empty to use default permalink.</p>
                {errors.seoCanonicalUrl && <p className="text-red-500 text-xs mt-1">{errors.seoCanonicalUrl.message}</p>}
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* 🔥 NEW: Custom Fields (Metafields) */}
            <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Custom Fields (Metafields JSON)</label>
                <textarea 
                    {...register("metafields")}
                    className="w-full border border-gray-400 p-2 rounded-sm text-xs font-mono outline-none focus:border-[#2271b1] bg-gray-50" 
                    rows={4} 
                    placeholder='{"material": "cotton", "care": "hand wash"}'
                />
                <p className="text-[10px] text-gray-500 mt-1">Enter valid JSON format only.</p>
                {/* JSON ভুল হলে Zod এরর দেখাবে */}
                {errors.metafields && <p className="text-red-500 text-xs mt-1">{errors.metafields.message}</p>}
            </div>

            {/* 🔥 NEW: SEO Schema */}
            <div className="mt-4">
                <label className="block text-xs font-bold mb-1 text-gray-700">SEO Schema (JSON-LD)</label>
                <textarea 
                    {...register("seoSchema")}
                    className="w-full border border-gray-400 p-2 rounded-sm text-xs font-mono outline-none focus:border-[#2271b1] bg-gray-50" 
                    rows={4} 
                    placeholder='{"@context": "https://schema.org", "@type": "Product", ...}'
                />
                <p className="text-[10px] text-gray-500 mt-1">Override default structured data. Enter valid JSON.</p>
                {errors.seoSchema && <p className="text-red-500 text-xs mt-1">{errors.seoSchema.message}</p>}
            </div>
        </div>
    );
}