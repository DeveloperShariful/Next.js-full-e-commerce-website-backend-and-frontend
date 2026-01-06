// app/admin/products/create/_components/General.tsx

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getTaxClasses } from "@/app/actions/admin/product/product-read";
import { X } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { ProductFormData } from "../types";

export default function General() {
    const { register, watch, setValue, formState: { errors } } = useFormContext<ProductFormData>();
    const data = watch();
    
    const [taxClasses, setTaxClasses] = useState<{id: string, name: string}[]>([]);
    const [showSchedule, setShowSchedule] = useState(!!data.saleStart);
    
    const { symbol } = useGlobalStore(); 

    useEffect(() => {
        getTaxClasses().then(res => { if(res.success) setTaxClasses(res.data as any) });
    }, []);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split('T')[0];
    };

    const addFile = () => {
        const currentFiles = data.digitalFiles || [];
        setValue("digitalFiles", [...currentFiles, { name: "", url: "" }], { shouldDirty: true });
    };

    const removeFile = (index: number) => {
        const currentFiles = data.digitalFiles || [];
        setValue("digitalFiles", currentFiles.filter((_, i) => i !== index), { shouldDirty: true });
    };

    return (
        <div className="space-y-5 max-w-lg">
            
            {/* --- PRICING SECTION --- */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Regular price ({symbol})</label>
                <div className="col-span-2">
                    <input 
                        type="number" 
                        step="0.01"
                        {...register("price")}
                        className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        placeholder="0.00"
                    />
                    {errors.price && <p className="text-red-500 text-[10px] mt-1">{errors.price.message}</p>}
                </div>
            </div>

            <div>
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-right font-medium text-xs">Sale price ({symbol})</label>
                    <div className="col-span-2 flex items-center gap-2">
                        <input 
                            type="number" 
                            step="0.01"
                            {...register("salePrice")}
                            className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                            placeholder="0.00"
                        />
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowSchedule(!showSchedule);
                                if (showSchedule) {
                                    setValue("saleStart", null, { shouldDirty: true });
                                    setValue("saleEnd", null, { shouldDirty: true });
                                }
                            }}
                            className="text-xs text-[#2271b1] hover:underline whitespace-nowrap"
                        >
                            {showSchedule ? "Cancel" : "Schedule"}
                        </button>
                    </div>
                </div>

                {showSchedule && (
                    <div className="mt-2 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
                        <div className="col-start-2 col-span-2 flex gap-2">
                            <div className="w-1/2">
                                <input 
                                    type="date" 
                                    {...register("saleStart")}
                                    className="w-full border border-gray-400 px-2 py-1 rounded-sm text-xs outline-none focus:border-[#2271b1]"
                                />
                            </div>
                            <div className="w-1/2">
                                <input 
                                    type="date" 
                                    {...register("saleEnd")}
                                    className="w-full border border-gray-400 px-2 py-1 rounded-sm text-xs outline-none focus:border-[#2271b1]"
                                />
                                {errors.saleEnd && <p className="text-red-500 text-[10px] mt-1">{errors.saleEnd.message}</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs text-gray-500">Cost per item</label>
                <div className="col-span-2">
                    <input 
                        type="number" 
                        step="0.01"
                        {...register("costPerItem")}
                        className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        placeholder="0.00"
                    />
                     <p className="text-[10px] text-gray-500 mt-1">Customers won&apos;t see this</p>
                </div>
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* --- MEDIA (VIDEO) --- */}
            <h3 className="text-xs font-bold text-gray-700">Product Video</h3>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Video URL</label>
                <input 
                    type="text" 
                    {...register("videoUrl")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                    placeholder="e.g. YouTube or Vimeo link"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Thumbnail URL</label>
                <input 
                    type="text" 
                    {...register("videoThumbnail")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                    placeholder="Image URL for video cover"
                />
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* --- DEMOGRAPHICS --- */}
            <h3 className="text-xs font-bold text-gray-700">Demographics</h3>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Gender</label>
                <select 
                    {...register("gender")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="">Any / Unisex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Kids">Kids</option>
                </select>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Age Group</label>
                <select 
                    {...register("ageGroup")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="">All Ages</option>
                    <option value="Adult">Adult</option>
                    <option value="Teen">Teen</option>
                    <option value="Kids">Kids</option>
                    <option value="Toddler">Toddler</option>
                    <option value="Infant">Infant</option>
                </select>
            </div>

            <hr className="border-gray-200 my-4"/>

            {/* --- TAX SECTION --- */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Tax status</label>
                <select 
                    {...register("taxStatus")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="TAXABLE">Taxable</option>
                    <option value="SHIPPING_ONLY">Shipping only</option>
                    <option value="NONE">None</option>
                </select>
            </div>

            {data.taxStatus === 'TAXABLE' && (
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-right font-medium text-xs">Tax class</label>
                    <select 
                        {...register("taxRateId")}
                        className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                    >
                        <option value="">Standard</option>
                        {taxClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* --- DOWNLOAD SETTINGS --- */}
            {data.isDownloadable && (
                <div className="mt-6 border-t border-gray-200 pt-4 animate-in fade-in">
                    <h3 className="text-xs font-bold text-gray-700 mb-3 ml-1">Download Settings</h3>
                    
                    <div className="mb-4 bg-gray-50 border border-gray-300 p-3 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-600">Files</label>
                            <button type="button" onClick={addFile} className="text-[10px] bg-[#2271b1] text-white px-2 py-0.5 rounded hover:bg-[#1a5c91]">Add File</button>
                        </div>
                        
                        {data.digitalFiles?.map((file, i) => (
                            <div key={i} className="mb-2 bg-white border border-gray-200 p-2 rounded flex gap-2 items-start shadow-sm">
                                <div className="flex-1 space-y-2">
                                    <input 
                                        placeholder="File Name" 
                                        {...register(`digitalFiles.${i}.name`)}
                                        className="w-full border border-gray-300 px-2 py-1 text-xs rounded focus:border-[#2271b1] outline-none" 
                                    />
                                    <input 
                                        placeholder="File URL" 
                                        {...register(`digitalFiles.${i}.url`)}
                                        className="w-full border border-gray-300 px-2 py-1 text-xs rounded focus:border-[#2271b1] outline-none" 
                                    />
                                    {errors.digitalFiles?.[i]?.url && (
                                        <p className="text-red-500 text-[10px]">{errors.digitalFiles[i]?.url?.message}</p>
                                    )}
                                </div>
                                <button type="button" onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-center mb-3">
                        <label className="text-right font-medium text-xs">Download limit</label>
                        <div className="col-span-2">
                            <input 
                                type="number" 
                                {...register("downloadLimit")}
                                className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                                placeholder="Unlimited" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Download expiry</label>
                        <div className="col-span-2">
                            <input 
                                type="number" 
                                {...register("downloadExpiry")}
                                className="w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                                placeholder="Never" 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}