// app/admin/products/create/_components/Advanced.tsx

"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "../schema";
import { Braces, Check, AlertCircle, Sparkles } from "lucide-react";

// --- REUSABLE JSON EDITOR COMPONENT ---
const JsonEditor = ({ label, fieldName, placeholder }: { label: string, fieldName: "metafields" | "seoSchema", placeholder: string }) => {
    const { register, watch, setValue, formState: { errors } } = useFormContext<ProductFormValues>();
    const value = watch(fieldName);
    const error = errors[fieldName]?.message;
    
    const [isValid, setIsValid] = useState(true);

    // Validate on change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setValue(fieldName, val, { shouldDirty: true });
        
        if (!val.trim()) {
            setIsValid(true);
            return;
        }
        try {
            JSON.parse(val);
            setIsValid(true);
        } catch (e) {
            setIsValid(false);
        }
    };

    // Prettify Function
    const handlePrettify = () => {
        if (!value) return;
        try {
            const parsed = JSON.parse(value);
            const prettified = JSON.stringify(parsed, null, 2);
            setValue(fieldName, prettified, { shouldDirty: true });
            setIsValid(true);
        } catch (e) {
            setIsValid(false); // Can't prettify invalid JSON
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-end mb-1">
                <label className="block text-xs font-bold text-gray-700 flex items-center gap-2">
                    <Braces size={14} className="text-gray-400"/> {label}
                </label>
                
                <div className="flex items-center gap-2">
                    {value && (
                        <span className={`text-[10px] flex items-center gap-1 font-bold ${isValid ? "text-green-600" : "text-red-600"}`}>
                            {isValid ? <><Check size={10}/> Valid JSON</> : <><AlertCircle size={10}/> Invalid Syntax</>}
                        </span>
                    )}
                    <button 
                        type="button"
                        onClick={handlePrettify}
                        className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded border border-gray-300 flex items-center gap-1 transition"
                        title="Format JSON"
                    >
                        <Sparkles size={10}/> Prettify
                    </button>
                </div>
            </div>

            <textarea 
                {...register(fieldName)}
                onChange={handleChange}
                className={`w-full border p-3 rounded-sm text-xs font-mono outline-none bg-[#1e1e1e] text-green-400 leading-relaxed shadow-inner transition-colors ${!isValid ? 'border-red-500' : 'border-gray-700 focus:border-[#2271b1]'}`} 
                rows={6} 
                placeholder={placeholder}
                spellCheck={false}
            />
            
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            {!error && !isValid && <p className="text-red-500 text-xs mt-1">Syntax Error: Check your commas and quotes.</p>}
        </div>
    );
};

export default function Advanced() {
    const { register, formState: { errors } } = useFormContext<ProductFormValues>();

    return (
        <div className="space-y-6 max-w-lg">
            {/* Purchase Note */}
            <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">Purchase Note</label>
                <textarea 
                    {...register("purchaseNote")}
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                    rows={2} 
                    placeholder="Sent to customer after purchase..."
                />
                {errors.purchaseNote && <p className="text-red-500 text-xs mt-1">{errors.purchaseNote.message}</p>}
            </div>

            {/* Menu Order */}
            <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">Menu Order</label>
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
                        className="rounded text-[#2271b1] focus:ring-[#2271b1]"
                    />
                    Enable Reviews
                </label>
            </div>
            
            <hr className="border-gray-200 my-4"/>
            
            {/* Canonical URL */}
            <div>
                <label className="block text-xs font-medium mb-1 text-gray-600">Canonical URL (SEO)</label>
                <input 
                    type="text" 
                    {...register("seoCanonicalUrl")}
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                    placeholder="https://example.com/original-product"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave empty to use default.</p>
                {errors.seoCanonicalUrl && <p className="text-red-500 text-xs mt-1">{errors.seoCanonicalUrl.message}</p>}
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* 🔥 NEW: JSON Editors */}
            <JsonEditor 
                label="Custom Fields (Metafields)" 
                fieldName="metafields" 
                placeholder='{"material": "cotton", "wash": "cold"}'
            />

            <JsonEditor 
                label="SEO Schema (JSON-LD)" 
                fieldName="seoSchema" 
                placeholder='{"@context": "https://schema.org", "@type": "Product"}'
            />
        </div>
    );
}