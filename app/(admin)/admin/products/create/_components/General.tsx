// File: app/admin/products/create/_components/General.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { getTaxClasses, getConfigOptions } from "@/app/actions/admin/product/product-read";
import { X, ChevronDown, Check, Plus, Info } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { ProductFormData } from "../types";

// Helper Component for Searchable Select
const CreatableSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder 
}: { 
    options: string[], 
    value: string, 
    onChange: (val: string) => void, 
    placeholder: string 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div 
                className={`w-full border px-3 py-2 rounded-sm text-sm flex justify-between items-center cursor-pointer bg-white transition-colors ${isOpen ? 'border-[#2271b1] ring-1 ring-[#2271b1]' : 'border-gray-400 hover:border-gray-500'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? "text-[#3c434a]" : "text-gray-400"}>
                    {value || placeholder}
                </span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}/>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-sm shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-100">
                        <input 
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type to search or create..."
                            className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded outline-none focus:border-[#2271b1]"
                        />
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.map((opt) => (
                            <div 
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 flex justify-between items-center ${value === opt ? 'bg-blue-50 text-[#2271b1] font-medium' : 'text-gray-700'}`}
                            >
                                {opt}
                                {value === opt && <Check size={12}/>}
                            </div>
                        ))}

                        {search && !filteredOptions.some(o => o.toLowerCase() === search.toLowerCase()) && (
                            <div 
                                onClick={() => handleSelect(search)}
                                className="px-3 py-2 text-xs cursor-pointer hover:bg-green-50 text-green-700 border-t border-gray-100 flex items-center gap-2 font-medium"
                            >
                                <Plus size={12}/> Create &quot;{search}&quot;
                            </div>
                        )}

                        {filteredOptions.length === 0 && !search && (
                            <div className="px-3 py-4 text-center text-xs text-gray-400">
                                No options found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function General() {
    const { register, watch, setValue, formState: { errors } } = useFormContext<ProductFormData>();
    const data = watch();
    const productType = watch("productType");
    const giftCardAmounts = watch("giftCardAmounts") || [];
    
    const [taxClasses, setTaxClasses] = useState<{id: string, name: string}[]>([]);
    const [genderOptions, setGenderOptions] = useState<string[]>([]);
    const [ageGroupOptions, setAgeGroupOptions] = useState<string[]>([]);
    const [showSchedule, setShowSchedule] = useState(!!data.saleStart);
    const [amountInput, setAmountInput] = useState("");
    
    const { symbol, tax } = useGlobalStore(); 
    const currency = symbol || "$";

    useEffect(() => {
        getTaxClasses().then(res => { if(res.success) setTaxClasses(res.data as any) });
        getConfigOptions().then(res => {
            if(res.success) {
                setGenderOptions(res.data.genders);
                setAgeGroupOptions(res.data.ageGroups);
            }
        });
    }, []);

    const addFile = () => {
        const currentFiles = data.digitalFiles || [];
        setValue("digitalFiles", [...currentFiles, { name: "", url: "", isSecure: false }], { shouldDirty: true });
    };

    const removeFile = (index: number) => {
        const currentFiles = data.digitalFiles || [];
        setValue("digitalFiles", currentFiles.filter((_, i) => i !== index), { shouldDirty: true });
    };

    const addGiftAmount = () => {
        const val = parseFloat(amountInput);
        if (val > 0 && !giftCardAmounts.includes(val)) {
            setValue("giftCardAmounts", [...giftCardAmounts, val].sort((a,b)=>a-b), { shouldDirty: true });
            setAmountInput("");
        }
    };

    const removeGiftAmount = (val: number) => {
        setValue("giftCardAmounts", giftCardAmounts.filter(a => a !== val), { shouldDirty: true });
    };

    return (
        <div className="space-y-5 max-w-lg">
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800 flex gap-2 items-start mb-4">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                    <strong>Tax Settings:</strong> Prices entered here are considered 
                    <span className="font-bold uppercase mx-1">
                        {tax?.pricesIncludeTax ? "Tax Inclusive" : "Tax Exclusive"}
                    </span> 
                    based on your store configuration.
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Regular price ({currency})</label>
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

            {/* Sale Price (Hidden for Gift Cards) */}
            {productType !== 'GIFT_CARD' && (
                <div>
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Sale price ({currency})</label>
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
            )}

            {productType === 'GIFT_CARD' && (
                 <div className="bg-purple-50 border border-purple-200 rounded p-4 animate-in fade-in">
                     <h3 className="text-xs font-bold text-purple-900 mb-2">Gift Card Configuration</h3>
                     
                     <label className="text-xs font-medium text-purple-800">Pre-defined Amounts</label>
                     <div className="flex gap-2 mb-2">
                         <input 
                            type="number" 
                            value={amountInput} 
                            onChange={e => setAmountInput(e.target.value)}
                            className="border border-purple-300 rounded px-2 py-1 text-sm outline-none focus:border-purple-500 w-24"
                            placeholder="Amount"
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGiftAmount())}
                         />
                         <button type="button" onClick={addGiftAmount} className="bg-purple-600 text-white px-3 text-xs rounded font-bold hover:bg-purple-700">Add</button>
                     </div>

                     <div className="flex flex-wrap gap-2">
                         {giftCardAmounts.map(amt => (
                             <span key={amt} className="bg-white border border-purple-300 text-purple-700 px-2 py-1 rounded text-xs flex items-center gap-1 font-mono">
                                 {amt}
                                 <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => removeGiftAmount(amt)}/>
                             </span>
                         ))}
                     </div>
                 </div>
            )}

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs text-gray-500">Cost per item ({currency})</label>
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

            <h3 className="text-xs font-bold text-gray-700">Demographics</h3>
            
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Gender</label>
                <div className="col-span-2">
                    <CreatableSelect 
                        options={genderOptions}
                        value={data.gender || ""}
                        onChange={(val) => setValue("gender", val, { shouldDirty: true })}
                        placeholder="Select gender"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Age Group</label>
                <div className="col-span-2">
                    <CreatableSelect 
                        options={ageGroupOptions}
                        value={data.ageGroup || ""}
                        onChange={(val) => setValue("ageGroup", val, { shouldDirty: true })}
                        placeholder="Select age group"
                    />
                </div>
            </div>

            <hr className="border-gray-200 my-4"/>

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

            {data.isDownloadable && (
                <div className="mt-6 border-t border-gray-200 pt-4 animate-in fade-in">
                    <h3 className="text-xs font-bold text-gray-700 mb-3 ml-1">Download Settings</h3>
                    
                    <div className="mb-4 bg-gray-50 border border-gray-300 p-3 rounded-sm">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-gray-600">Files</label>
                            <button type="button" onClick={addFile} className="text-[10px] bg-[#2271b1] text-white px-2 py-0.5 rounded hover:bg-[#1a5c91]">Add File</button>
                        </div>
                        
                        {data.digitalFiles?.map((file, i) => (
                            <div key={i} className="mb-2 bg-white border border-gray-200 p-2 rounded flex flex-col gap-2 shadow-sm">
                                <div className="flex gap-2 items-start">
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
                                <div className="flex items-center gap-2 mt-1">
                                    <label className="text-[10px] flex items-center gap-1 cursor-pointer select-none text-gray-600">
                                        <input type="checkbox" {...register(`digitalFiles.${i}.isSecure`)} />
                                        Secure File (Require Login/Presigned URL)
                                    </label>
                                </div>
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