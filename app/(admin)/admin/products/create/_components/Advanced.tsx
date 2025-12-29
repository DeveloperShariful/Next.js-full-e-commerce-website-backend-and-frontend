// app/admin/products/create/_components/Advanced.tsx

import { ComponentProps } from "../types";

export default function Advanced({ data, updateData }: ComponentProps) {
    return (
        <div className="space-y-5 max-w-lg">
            {/* Purchase Note */}
            <div>
                <label className="block text-xs font-medium mb-1">Purchase Note</label>
                <textarea 
                    value={data.purchaseNote} 
                    onChange={e => updateData('purchaseNote', e.target.value)} 
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                    rows={2} 
                    placeholder="Note to send to customer after purchase"
                />
            </div>

            {/* Menu Order */}
            <div>
                <label className="block text-xs font-medium mb-1">Menu Order</label>
                <input 
                    type="number" 
                    value={data.menuOrder} 
                    onChange={e => updateData('menuOrder', parseInt(e.target.value))} 
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                />
            </div>

            {/* Enable Reviews */}
            <div>
                <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
                    <input type="checkbox" checked={data.enableReviews} onChange={e => updateData('enableReviews', e.target.checked)} />
                    Enable Reviews
                </label>
            </div>
            
            <hr className="border-gray-200 my-4"/>
            
            {/* Canonical URL */}
            <div>
                <label className="block text-xs font-medium mb-1">Canonical URL (SEO)</label>
                <input 
                    type="text" 
                    value={data.seoCanonicalUrl} 
                    onChange={e => updateData('seoCanonicalUrl', e.target.value)} 
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                    placeholder="https://example.com/original-product"
                />
                <p className="text-[10px] text-gray-500 mt-1">Leave empty to use default permalink.</p>
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* 🔥 NEW: Custom Fields (Metafields) */}
            <div>
                <label className="block text-xs font-bold mb-1 text-gray-700">Custom Fields (Metafields JSON)</label>
                <textarea 
                    value={data.metafields} 
                    onChange={e => updateData('metafields', e.target.value)} 
                    className="w-full border border-gray-400 p-2 rounded-sm text-xs font-mono outline-none focus:border-[#2271b1] bg-gray-50" 
                    rows={4} 
                    placeholder='{"material": "cotton", "care": "hand wash"}'
                />
                <p className="text-[10px] text-gray-500 mt-1">Enter valid JSON format only.</p>
            </div>

            {/* 🔥 NEW: SEO Schema */}
            <div className="mt-4">
                <label className="block text-xs font-bold mb-1 text-gray-700">SEO Schema (JSON-LD)</label>
                <textarea 
                    value={data.seoSchema} 
                    onChange={e => updateData('seoSchema', e.target.value)} 
                    className="w-full border border-gray-400 p-2 rounded-sm text-xs font-mono outline-none focus:border-[#2271b1] bg-gray-50" 
                    rows={4} 
                    placeholder='{"@context": "https://schema.org", "@type": "Product", ...}'
                />
                <p className="text-[10px] text-gray-500 mt-1">Override default structured data. Enter valid JSON.</p>
            </div>
        </div>
    );
}