// app/admin/products/create/_components/Advanced.tsx

"use client";

import { useState, useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Settings, ListOrdered, MessageSquare, Link as LinkIcon, Code, LayoutList, AlertTriangle, RefreshCw, X , ImagePlus} from "lucide-react";
import { ProductFormData } from "../types";
import { MediaSelectorModal } from "@/components/media/media-selector-modal"; 
import Image from "next/image"; 

export default function Advanced() {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext<ProductFormData>();
    
    // Watch SEO Image for Preview
    const ogImage = watch("seoSchema.ogImage");
    
    // Modal State
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

    const handleSeoImageSelect = (media: any) => {
        setValue("seoSchema.ogImage", media.url, { shouldDirty: true });
        setOpenSeoMedia(false);
    };

    return (
        <div className="space-y-8 max-w-3xl">
            
            {/* =========================================================
                1. ADVANCED SETTINGS (Purchase Note, Menu Order, Reviews)
            ========================================================= */}
            <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-[#f0f0f1] pb-4 mb-4">
                    <label className="md:text-left text-[13px] text-[#3c434a] mt-1.5 font-medium">Purchase note</label>
                    <div className="md:col-span-3">
                        <textarea 
                            {...register("purchaseNote")} 
                            rows={2} 
                            className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none resize-y" 
                            placeholder="Optional note to send the customer after purchase."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#f0f0f1] pb-4 mb-4">
                    <label className="md:text-left text-[13px] text-[#3c434a] font-medium flex items-center gap-1.5">
                        <ListOrdered size={14} className="text-[#8c8f94]"/> Menu order
                    </label>
                    <div className="md:col-span-3">
                        <input 
                            type="number" 
                            {...register("menuOrder")}
                            className="w-24 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#c3c4c7] pb-6">
                    <div className="md:col-start-2 md:col-span-3">
                        <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                {...register("enableReviews")}
                                className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                            />
                            <span className="flex items-center gap-1.5"><MessageSquare size={14} className="text-[#8c8f94]"/> Enable reviews</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* =========================================================
                2. SEO & SOCIAL SHARING
            ========================================================= */}
            <div>
                <h3 className="font-semibold text-[14px] text-[#1d2327] mb-4 flex items-center gap-2">
                    <Settings size={16} className="text-[#8c8f94]"/> SEO & Social Sharing
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-[#f0f0f1] pb-4 mb-4">
                    <label className="md:text-left text-[13px] text-[#3c434a] mt-1.5 font-medium">OpenGraph Title</label>
                    <div className="md:col-span-3">
                        <input 
                            {...register("seoSchema.ogTitle")} 
                            className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                            placeholder="Title shown on Facebook/Twitter"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-[#f0f0f1] pb-4 mb-4">
                    <label className="md:text-left text-[13px] text-[#3c434a] mt-1.5 font-medium">OpenGraph Desc.</label>
                    <div className="md:col-span-3">
                        <textarea 
                            {...register("seoSchema.ogDescription")} 
                            rows={2} 
                            className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none resize-y" 
                            placeholder="Description for social media previews"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-[#f0f0f1] pb-4 mb-4">
                    <label className="md:text-left text-[13px] text-[#3c434a] mt-1.5 font-medium">OpenGraph Image</label>
                    <div className="md:col-span-3">
                        {ogImage ? (
                            <div className="flex flex-col gap-2">
                                <div className="relative w-[150px] h-[150px] bg-[#f0f0f1] border border-[#c3c4c7] rounded-[2px] overflow-hidden shrink-0">
                                    <Image src={ogImage} alt="SEO Preview" fill className="object-cover" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setOpenSeoMedia(true)} className="text-[12px] text-[#2271b1] hover:underline flex items-center gap-1">
                                        <RefreshCw size={12}/> Change image
                                    </button>
                                    <span className="text-[#c3c4c7]">|</span>
                                    <button type="button" onClick={() => setValue("seoSchema.ogImage", "", { shouldDirty: true })} className="text-[12px] text-[#d63638] hover:underline flex items-center gap-1">
                                        <X size={12}/> Remove image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setOpenSeoMedia(true)} className="text-[13px] text-[#2271b1] hover:underline flex items-center gap-1.5">
                                <ImagePlus size={16}/> Set OpenGraph Image
                            </button>
                        )}
                        <p className="text-[11px] text-[#646970] mt-2">Recommended size: 1200 x 630 pixels. Used for Facebook, Twitter, WhatsApp.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#f0f0f1] pb-4 mb-4">
                    <label className="md:text-left text-[13px] text-[#3c434a] font-medium flex items-center gap-1.5">
                        <LinkIcon size={14} className="text-[#8c8f94]"/> Canonical URL
                    </label>
                    <div className="md:col-span-3">
                        <input 
                            {...register("seoCanonicalUrl")}
                            className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                            placeholder="https://... (Leave empty for default)"
                        />
                        {errors.seoCanonicalUrl && <p className="text-[#d63638] text-[11px] mt-1">{errors.seoCanonicalUrl.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#c3c4c7] pb-6">
                    <label className="md:text-left text-[13px] text-[#3c434a] font-medium">Robots Meta</label>
                    <div className="md:col-span-3">
                        <input 
                            {...register("seoSchema.robots")} 
                            className="w-full md:w-1/2 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                            placeholder="e.g. index, follow"
                        />
                    </div>
                </div>
            </div>

            {/* =========================================================
                3. CUSTOM FIELDS (Metafields)
            ========================================================= */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-[14px] text-[#1d2327]">Custom Fields</h3>
                    <button 
                        type="button" 
                        onClick={() => {
                            if (rawMode) handleJsonSave();
                            else setRawMode(true);
                        }}
                        className="text-[12px] flex items-center gap-1.5 px-3 py-1 bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] hover:bg-[#f0f0f1] rounded-[3px] transition-colors shadow-sm"
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
                                    placeholder="Name (e.g. Material)" 
                                    className="w-1/3 border border-[#8c8f94] px-2 py-1.5 text-[13px] rounded-[3px] outline-none focus:border-[#2271b1] font-mono bg-[#f6f7f7] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
                                />
                                <textarea 
                                    {...register(`metafields.${index}.value`)} 
                                    placeholder="Value (e.g. 100% Cotton)" 
                                    rows={1}
                                    className="flex-1 border border-[#8c8f94] px-2 py-1.5 text-[13px] rounded-[3px] outline-none focus:border-[#2271b1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] resize-y min-h-[34px]"
                                />
                                <button type="button" onClick={() => remove(index)} className="p-1.5 mt-0.5 text-[#d63638] hover:bg-[#fef2f2] rounded transition-colors" title="Delete">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => append({ key: "", value: "" })} className="text-[13px] text-[#2271b1] hover:underline mt-2 flex items-center gap-1">
                            <Plus size={14}/> Add New Custom Field
                        </button>
                        {fields.length === 0 && <p className="text-[12px] text-[#646970] italic mt-2">No custom fields added yet.</p>}
                    </div>
                ) : (
                    <div className="animate-in fade-in">
                        <div className="bg-[#fff8e5] border-l-4 border-[#f56e28] p-3 mb-3 text-[13px] flex gap-2 text-[#3c434a] shadow-sm">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[#f56e28]"/>
                            <p>Edit as pure JSON object. Make sure the syntax is correct.</p>
                        </div>
                        <textarea 
                            value={rawJson}
                            onChange={(e) => setRawJson(e.target.value)}
                            rows={10}
                            className="w-full bg-[#1e1e1e] text-[#10b981] font-mono text-[13px] p-3 rounded-[3px] border border-[#3c434a] outline-none focus:border-[#2271b1] shadow-inner"
                            spellCheck={false}
                        />
                        {jsonError && <p className="text-[#d63638] text-[12px] mt-1 font-semibold">{jsonError}</p>}
                        <div className="flex justify-end mt-3">
                            <button type="button" onClick={handleJsonSave} className="px-4 py-1.5 bg-[#2271b1] text-white text-[13px] font-medium rounded-[3px] hover:bg-[#135e96] shadow-sm border border-[#2271b1]">
                                Apply JSON Changes
                            </button>
                        </div>
                    </div>
                )}
            </div>

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