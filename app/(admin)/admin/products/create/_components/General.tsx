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
                className={`w-full border px-2 py-1 rounded-[3px] text-[13px] flex justify-between items-center cursor-pointer bg-white transition-colors ${isOpen ? 'border-[#2271b1] ring-1 ring-[#2271b1]' : 'border-[#8c8f94] hover:border-[#50575e]'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? "text-[#3c434a]" : "text-[#8c8f94]"}>
                    {value || placeholder}
                </span>
                <ChevronDown size={14} className={`text-[#8c8f94] transition-transform ${isOpen ? "rotate-180" : ""}`}/>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#c3c4c7] rounded-[3px] shadow-sm max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-[#f0f0f1]">
                        <input 
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type to search or create..."
                            className="w-full text-[12px] px-2 py-1 bg-white border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"
                        />
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filteredOptions.map((opt) => (
                            <div 
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`px-3 py-1.5 text-[12px] cursor-pointer hover:bg-[#f0f6fc] hover:text-[#2271b1] flex justify-between items-center ${value === opt ? 'bg-[#f0f6fc] text-[#2271b1] font-medium' : 'text-[#3c434a]'}`}
                            >
                                {opt}
                                {value === opt && <Check size={12}/>}
                            </div>
                        ))}

                        {search && !filteredOptions.some(o => o.toLowerCase() === search.toLowerCase()) && (
                            <div 
                                onClick={() => handleSelect(search)}
                                className="px-3 py-2 text-[12px] cursor-pointer hover:bg-[#f0fdf4] text-[#166534] border-t border-[#f0f0f1] flex items-center gap-2 font-medium"
                            >
                                <Plus size={12}/> Create &quot;{search}&quot;
                            </div>
                        )}

                        {filteredOptions.length === 0 && !search && (
                            <div className="px-3 py-4 text-center text-[12px] text-[#8c8f94] italic">
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
        <div className="space-y-4 max-w-2xl">
            
            {/* Tax Settings Notice */}
            <div className="bg-[#fff8e5] border-l-4 border-[#f56e28] px-3 py-2 text-[12px] text-[#3c434a] flex gap-2 items-start mb-4">
                <Info size={14} className="shrink-0 mt-0.5 text-[#f56e28]" />
                <div>
                    <strong>Tax Settings:</strong> Prices entered here are considered 
                    <span className="font-bold uppercase mx-1">
                        {tax?.pricesIncludeTax ? "Tax Inclusive" : "Tax Exclusive"}
                    </span> 
                    based on your store configuration.
                </div>
            </div>

            {/* Regular Price */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#f0f0f1] pb-4">
                <label className="md:text-left text-[13px] text-[#3c434a]">Regular price ({currency})</label>
                <div className="md:col-span-2">
                    <input 
                        type="number" 
                        step="0.01"
                        {...register("price")}
                        className="w-full md:w-1/2 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow"
                        placeholder="0.00"
                    />
                    {errors.price && <p className="text-[#d63638] text-[11px] mt-1">{errors.price.message}</p>}
                </div>
            </div>

            {/* Sale Price */}
            {productType !== 'GIFT_CARD' && (
                <div className="border-b border-[#f0f0f1] pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <label className="md:text-left text-[13px] text-[#3c434a]">Sale price ({currency})</label>
                        <div className="md:col-span-3 flex items-center gap-3">
                            <input 
                                type="number" 
                                step="0.01"
                                {...register("salePrice")}
                                className="w-full md:w-1/3 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow"
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
                                className="text-[12px] text-[#2271b1] hover:text-[#0a4b78] hover:underline"
                            >
                                {showSchedule ? "Cancel schedule" : "Schedule"}
                            </button>
                        </div>
                    </div>

                    {showSchedule && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1">
                            <div className="md:col-start-2 md:col-span-3 flex flex-col sm:flex-row gap-3">
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-[11px] text-[#8c8f94] mb-1">From</label>
                                    <input 
                                        type="date" 
                                        {...register("saleStart")}
                                        className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[12px] text-[#2c3338] focus:border-[#2271b1] outline-none"
                                    />
                                </div>
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-[11px] text-[#8c8f94] mb-1">To</label>
                                    <input 
                                        type="date" 
                                        {...register("saleEnd")}
                                        className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[12px] text-[#2c3338] focus:border-[#2271b1] outline-none"
                                    />
                                    {errors.saleEnd && <p className="text-[#d63638] text-[10px] mt-1">{errors.saleEnd.message}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Gift Card Config */}
            {productType === 'GIFT_CARD' && (
                 <div className="bg-[#f0f6fc] border border-[#c5d9ed] rounded-[3px] p-4 mb-4">
                     <h3 className="text-[13px] font-semibold text-[#1d2327] mb-2">Gift Card Configuration</h3>
                     
                     <label className="text-[12px] text-[#3c434a]">Pre-defined Amounts</label>
                     <div className="flex gap-2 mb-3 mt-1">
                         <input 
                            type="number" 
                            value={amountInput} 
                            onChange={e => setAmountInput(e.target.value)}
                            className="border border-[#8c8f94] rounded-[3px] px-2 py-1 text-[13px] outline-none focus:border-[#2271b1] w-24"
                            placeholder="Amount"
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGiftAmount())}
                         />
                         <button type="button" onClick={addGiftAmount} className="bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] px-3 text-[13px] rounded-[3px] hover:bg-[#f0f0f1]">Add</button>
                     </div>

                     <div className="flex flex-wrap gap-2">
                         {giftCardAmounts.map(amt => (
                             <span key={amt} className="bg-white border border-[#c3c4c7] text-[#3c434a] px-2 py-1 rounded-[3px] text-[12px] flex items-center gap-1 font-mono shadow-sm">
                                 {currency}{amt}
                                 <X size={12} className="cursor-pointer text-[#8c8f94] hover:text-[#d63638]" onClick={() => removeGiftAmount(amt)}/>
                             </span>
                         ))}
                     </div>
                 </div>
            )}

            {/* Cost Per Item */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#f0f0f1] pb-4">
                <label className="md:text-left text-[13px] text-[#3c434a]">Cost per item ({currency})</label>
                <div className="md:col-span-2">
                    <input 
                        type="number" 
                        step="0.01"
                        {...register("costPerItem")}
                        className="w-full md:w-1/2 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow"
                        placeholder="0.00"
                    />
                     <p className="text-[11px] text-[#646970] mt-1 italic">Customers won&apos;t see this</p>
                </div>
            </div>

            {/* Tax Settings */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pt-2">
                <label className="md:text-left text-[13px] text-[#3c434a]">Tax status</label>
                <div className="md:col-span-2">
                    <select 
                        {...register("taxStatus")}
                        className="w-full md:w-1/2 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                    >
                        <option value="TAXABLE">Taxable</option>
                        <option value="SHIPPING_ONLY">Shipping only</option>
                        <option value="NONE">None</option>
                    </select>
                </div>
            </div>

            {data.taxStatus === 'TAXABLE' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pb-4 border-b border-[#f0f0f1]">
                    <label className="md:text-left text-[13px] text-[#3c434a]">Tax class</label>
                    <div className="md:col-span-2">
                        <select 
                            {...register("taxRateId")}
                            className="w-full md:w-1/2 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                        >
                            <option value="">Standard</option>
                            {taxClasses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Video Settings */}
            <h3 className="text-[14px] font-semibold text-[#1d2327] mt-6 mb-3">Product Video</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="md:text-left text-[13px] text-[#3c434a]">Video URL</label>
                <div className="md:col-span-3">
                    <input 
                        type="text" 
                        {...register("videoUrl")}
                        className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                        placeholder="e.g. YouTube or Vimeo link"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#f0f0f1] pb-4">
                <label className="md:text-left text-[13px] text-[#3c434a]">Thumbnail URL</label>
                <div className="md:col-span-3">
                    <input 
                        type="text" 
                        {...register("videoThumbnail")}
                        className="w-full border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                        placeholder="Image URL for video cover"
                    />
                </div>
            </div>

            {/* Demographics */}
            <h3 className="text-[14px] font-semibold text-[#1d2327] mt-6 mb-3">Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="md:text-left text-[13px] text-[#3c434a]">Gender</label>
                <div className="md:col-span-2">
                    <CreatableSelect 
                        options={genderOptions}
                        value={data.gender || ""}
                        onChange={(val) => setValue("gender", val, { shouldDirty: true })}
                        placeholder="Select gender"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center pb-4 border-b border-[#f0f0f1]">
                <label className="md:text-left text-[13px] text-[#3c434a]">Age Group</label>
                <div className="md:col-span-2">
                    <CreatableSelect 
                        options={ageGroupOptions}
                        value={data.ageGroup || ""}
                        onChange={(val) => setValue("ageGroup", val, { shouldDirty: true })}
                        placeholder="Select age group"
                    />
                </div>
            </div>

            {/* Downloadable Settings */}
            {data.isDownloadable && (
                <div className="mt-6 border-t border-[#f0f0f1] pt-4 animate-in fade-in">
                    <h3 className="text-[14px] font-semibold text-[#1d2327] mb-3">Downloadable files</h3>
                    
                    <div className="mb-4">
                        <table className="w-full text-left border-collapse border border-[#c3c4c7] mb-2">
                            <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7] text-[12px] text-[#3c434a]">
                                <tr>
                                    <th className="p-2 border-r border-[#e2e4e7] w-1/3">Name</th>
                                    <th className="p-2 border-r border-[#e2e4e7]">File URL</th>
                                    <th className="p-2 w-10 text-center"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.digitalFiles?.length === 0 ? (
                                    <tr><td colSpan={3} className="p-4 text-center text-[#8c8f94] italic text-[12px]">No files added yet.</td></tr>
                                ) : (
                                    data.digitalFiles?.map((file, i) => (
                                        <tr key={i} className="border-b border-[#f0f0f1] bg-white group">
                                            <td className="p-2 border-r border-[#f0f0f1]">
                                                <input 
                                                    placeholder="File Name" 
                                                    {...register(`digitalFiles.${i}.name`)}
                                                    className="w-full border border-[#8c8f94] px-2 py-1 text-[12px] rounded-[3px] focus:border-[#2271b1] outline-none" 
                                                />
                                            </td>
                                            <td className="p-2 border-r border-[#f0f0f1]">
                                                <input 
                                                    placeholder="File URL" 
                                                    {...register(`digitalFiles.${i}.url`)}
                                                    className="w-full border border-[#8c8f94] px-2 py-1 text-[12px] rounded-[3px] focus:border-[#2271b1] outline-none" 
                                                />
                                                {errors.digitalFiles?.[i]?.url && (
                                                    <p className="text-[#d63638] text-[10px] mt-0.5">{errors.digitalFiles[i]?.url?.message}</p>
                                                )}
                                                <label className="text-[10px] flex items-center gap-1 mt-1 cursor-pointer select-none text-[#50575e]">
                                                    <input type="checkbox" {...register(`digitalFiles.${i}.isSecure`)} className="rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" />
                                                    Secure File (Require Login)
                                                </label>
                                            </td>
                                            <td className="p-2 text-center">
                                                <button type="button" onClick={() => removeFile(i)} className="text-[#d63638] hover:text-[#b32d2e]"><X size={14}/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        <button type="button" onClick={addFile} className="px-3 py-1 bg-[#f6f7f7] border border-[#c3c4c7] text-[#2271b1] text-[12px] rounded-[3px] hover:bg-[#f0f0f1] transition-colors">Add File</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-4">
                        <label className="md:text-left text-[13px] text-[#3c434a]">Download limit</label>
                        <div className="md:col-span-2">
                            <input 
                                type="number" 
                                {...register("downloadLimit")}
                                className="w-full md:w-1/3 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" 
                                placeholder="Unlimited" 
                            />
                            <span className="text-[#8c8f94] text-[11px] ml-2 italic">Leave blank for unlimited re-downloads.</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <label className="md:text-left text-[13px] text-[#3c434a]">Download expiry</label>
                        <div className="md:col-span-2">
                            <input 
                                type="number" 
                                {...register("downloadExpiry")}
                                className="w-full md:w-1/3 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" 
                                placeholder="Never" 
                            />
                            <span className="text-[#8c8f94] text-[11px] ml-2 italic">Enter number of days before a download link expires.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}