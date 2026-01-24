// app/admin/products/create/_components/Advanced.tsx

"use client";

import { useState, useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Settings, ListOrdered, MessageSquare, Link as LinkIcon, Code, LayoutList, AlertTriangle, ImagePlus, RefreshCw, X } from "lucide-react";
import { ProductFormData } from "../types";
import { MediaSelectorModal } from "@/components/media/media-selector-modal"; // 🔥 Import Media Modal
import Image from "next/image"; // 🔥 Import Next Image

export default function Advanced() {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<ProductFormData>();
    
    // 🔥 Watch SEO Image for Preview
    const ogImage = watch("seoSchema.ogImage");
    
    // 🔥 Modal State
    const [openSeoMedia, setOpenSeoMedia] = useState(false);

    // Metafields Array
    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "metafields"
    });

    const [rawMode, setRawMode] = useState(false);
    const [rawJson, setRawJson] = useState("");
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
        if (rawMode) {
            const currentFields = watch("metafields") || [];
            const simpleObj = currentFields.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
            setRawJson(JSON.stringify(simpleObj, null, 2));
        }
    }, [rawMode, watch]);

    const handleJsonSave = () => {
        try {
            const parsed = JSON.parse(rawJson);
            if (typeof parsed !== "object" || Array.isArray(parsed)) {
                throw new Error("Must be a JSON object");
            }
            const newArray = Object.entries(parsed).map(([key, value]) => ({
                key,
                value: String(value)
            }));
            replace(newArray);
            setJsonError(null);
            setRawMode(false);
        } catch (e: any) {
            setJsonError(e.message || "Invalid JSON syntax");
        }
    };

    // 🔥 Handle Image Selection from Modal
    const handleSeoImageSelect = (media: any) => {
        setValue("seoSchema.ogImage", media.url, { shouldDirty: true });
        setOpenSeoMedia(false);
    };

    return (
        <div className="space-y-6">
            
            {/* 1. SEO Configuration */}
            <div className="bg-white p-5 border border-gray-300 rounded-sm shadow-sm">
                <h3 className="font-bold text-sm text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                    <Settings size={16} className="text-gray-500"/> SEO & Social Sharing
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-bold block mb-1 text-gray-700">OpenGraph Title</label>
                        <input 
                            {...register("seoSchema.ogTitle")} 
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-[#2271b1]" 
                            placeholder="Title shown on Facebook/Twitter"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold block mb-1 text-gray-700">Robots Meta</label>
                        <input 
                            {...register("seoSchema.robots")} 
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-[#2271b1]" 
                            placeholder="e.g. index, follow"
                        />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold block mb-1 text-gray-700">OpenGraph Description</label>
                        <textarea 
                            {...register("seoSchema.ogDescription")} 
                            rows={2} 
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-[#2271b1]" 
                            placeholder="Description for social media previews"
                        />
                    </div>

                    {/* 🔥 UPDATED: OpenGraph Image Selector */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold block mb-2 text-gray-700">OpenGraph Image</label>
                        
                        <div className="flex items-start gap-4">
                            {ogImage ? (
                                <div className="relative group w-32 h-32 bg-gray-100 rounded border border-gray-300 overflow-hidden shrink-0">
                                    <Image 
                                        src={ogImage} 
                                        alt="SEO Preview" 
                                        fill 
                                        className="object-cover"
                                    />
                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setOpenSeoMedia(true)}
                                            className="px-2 py-1 bg-white text-xs font-bold rounded hover:bg-gray-100 flex items-center gap-1"
                                        >
                                            <RefreshCw size={12}/> Change
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setValue("seoSchema.ogImage", "", { shouldDirty: true })}
                                            className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 flex items-center gap-1"
                                        >
                                            <X size={12}/> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setOpenSeoMedia(true)}
                                    className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded bg-gray-50 hover:bg-white hover:border-[#2271b1] hover:text-[#2271b1] transition shrink-0 group"
                                >
                                    <div className="p-2 bg-gray-200 rounded-full group-hover:bg-blue-50 transition mb-1">
                                        <ImagePlus size={20} className="text-gray-500 group-hover:text-[#2271b1]"/>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-[#2271b1]">Select Image</span>
                                </button>
                            )}

                            <div className="flex-1 text-xs text-gray-500 mt-1 space-y-1">
                                <p>Used for social media previews (Facebook, Twitter, WhatsApp).</p>
                                <p>Recommended size: <strong>1200 x 630 pixels</strong>.</p>
                                {/* Fallback Input if they really want to paste URL */}
                                <div className="mt-2">
                                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Or paste URL manually:</label>
                                    <input 
                                        {...register("seoSchema.ogImage")}
                                        className="w-full border border-gray-300 px-2 py-1 text-xs rounded outline-none focus:border-[#2271b1] text-gray-600 bg-gray-50"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold block mb-1 text-gray-700 flex items-center gap-1">
                            <LinkIcon size={12}/> Canonical URL
                        </label>
                        <input 
                            {...register("seoCanonicalUrl")}
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-[#2271b1]" 
                            placeholder="https://example.com/original-product (Leave empty for default)"
                        />
                        {errors.seoCanonicalUrl && <p className="text-red-500 text-xs mt-1">{errors.seoCanonicalUrl.message}</p>}
                    </div>
                </div>
            </div>

            {/* 2. Custom Fields / Metafields */}
            <div className="bg-white p-5 border border-gray-300 rounded-sm shadow-sm">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="font-bold text-sm text-gray-800">Custom Fields (Metafields)</h3>
                    <button 
                        type="button" 
                        onClick={() => {
                            if (rawMode) handleJsonSave();
                            else setRawMode(true);
                        }}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition font-medium text-gray-700"
                    >
                        {rawMode ? <><LayoutList size={14}/> Visual Builder</> : <><Code size={14}/> Raw JSON</>}
                    </button>
                </div>

                {!rawMode ? (
                    <div className="space-y-2 animate-in fade-in">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                                <input 
                                    {...register(`metafields.${index}.key`)} 
                                    placeholder="Key (e.g. Material)" 
                                    className="w-1/3 border border-gray-300 p-2 text-xs rounded outline-none focus:border-[#2271b1] font-mono bg-gray-50"
                                />
                                <input 
                                    {...register(`metafields.${index}.value`)} 
                                    placeholder="Value (e.g. 100% Cotton)" 
                                    className="flex-1 border border-gray-300 p-2 text-xs rounded outline-none focus:border-[#2271b1]"
                                />
                                <button type="button" onClick={() => remove(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => append({ key: "", value: "" })} className="text-xs flex items-center gap-1 text-[#2271b1] font-bold hover:underline mt-2">
                            <Plus size={12}/> Add New Field
                        </button>
                        {fields.length === 0 && <p className="text-xs text-gray-400 italic">No custom fields added.</p>}
                    </div>
                ) : (
                    <div className="animate-in fade-in">
                        <div className="bg-yellow-50 border border-yellow-200 p-2 mb-2 rounded text-xs flex gap-2 text-yellow-800">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                            <p>Edit as pure JSON object.</p>
                        </div>
                        <textarea 
                            value={rawJson}
                            onChange={(e) => setRawJson(e.target.value)}
                            rows={8}
                            className="w-full bg-[#1e1e1e] text-green-400 font-mono text-xs p-3 rounded border border-gray-700 outline-none focus:border-[#2271b1]"
                            spellCheck={false}
                        />
                        {jsonError && <p className="text-red-500 text-xs mt-1 font-bold">{jsonError}</p>}
                        <div className="flex justify-end mt-2">
                            <button type="button" onClick={handleJsonSave} className="px-3 py-1.5 bg-[#2271b1] text-white text-xs font-bold rounded hover:bg-[#1a5c91]">
                                Apply Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Other Settings */}
            <div className="bg-white p-5 border border-gray-300 rounded-sm shadow-sm space-y-5">
                 <h3 className="font-bold text-sm text-gray-800 border-b pb-3">Additional Settings</h3>
                 
                 <div>
                    <label className="text-xs font-bold block mb-1 text-gray-700">Purchase Note</label>
                    <textarea 
                        {...register("purchaseNote")} 
                        rows={2} 
                        className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-[#2271b1]" 
                        placeholder="Note sent to customer after purchase..."
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold block mb-1 text-gray-700 flex items-center gap-1">
                            <ListOrdered size={14}/> Menu Order
                        </label>
                        <input 
                            type="number" 
                            {...register("menuOrder")}
                            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:border-[#2271b1]" 
                            placeholder="0"
                        />
                    </div>

                    <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                {...register("enableReviews")}
                                className="w-4 h-4 rounded text-[#2271b1] focus:ring-[#2271b1] border-gray-300"
                            />
                            <span className="flex items-center gap-1"><MessageSquare size={14}/> Enable Reviews</span>
                        </label>
                    </div>
                 </div>
            </div>

            {/* 🔥 Media Selector Modal */}
            {openSeoMedia && (
                <MediaSelectorModal 
                    onClose={() => setOpenSeoMedia(false)}
                    onSelect={handleSeoImageSelect}
                    allowMultiple={false}
                />
            )}
        </div>
    );
}