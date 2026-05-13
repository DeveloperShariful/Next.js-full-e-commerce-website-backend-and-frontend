// app/admin/products/create/_components/LinkedProducts.tsx

"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { X, Search, Loader2 } from "lucide-react";
import { searchProducts } from "@/app/actions/admin/product/product-read";
import { ProductFormData } from "../types";

export default function LinkedProducts() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const upsells = watch("upsells") || [];
    const crossSells = watch("crossSells") || [];

    const [upsellInput, setUpsellInput] = useState("");
    const [crossSellInput, setCrossSellInput] = useState("");
    const [upsellResults, setUpsellResults] = useState<any[]>([]);
    const [crossSellResults, setCrossSellResults] = useState<any[]>([]);
    const [loadingUpsell, setLoadingUpsell] = useState(false);
    const [loadingCrossSell, setLoadingCrossSell] = useState(false);

    // Search logic unchanged
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (upsellInput.length > 1) {
                setLoadingUpsell(true);
                const res = await searchProducts(upsellInput);
                if (res.success) setUpsellResults(res.data as any);
                setLoadingUpsell(false);
            } else {
                setUpsellResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [upsellInput]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (crossSellInput.length > 1) {
                setLoadingCrossSell(true);
                const res = await searchProducts(crossSellInput);
                if (res.success) setCrossSellResults(res.data as any);
                setLoadingCrossSell(false);
            } else {
                setCrossSellResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [crossSellInput]);

    const addProduct = (type: 'upsells' | 'crossSells', id: string) => {
        const currentList = type === 'upsells' ? upsells : crossSells;
        if (!currentList.includes(id)) {
            setValue(type, [...currentList, id], { shouldDirty: true, shouldValidate: true });
        }
        
        if (type === 'upsells') {
            setUpsellInput("");
            setUpsellResults([]);
        } else {
            setCrossSellInput("");
            setCrossSellResults([]);
        }
    };

    const removeProduct = (type: 'upsells' | 'crossSells', id: string) => {
        const currentList = type === 'upsells' ? upsells : crossSells;
        setValue(type, currentList.filter(item => item !== id), { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="space-y-6 max-w-2xl">
            
            {/* Upsells */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-[#f0f0f1] pb-6">
                <div className="md:text-left mt-1.5">
                    <label className="text-[13px] text-[#3c434a] font-medium block">Upsells</label>
                    <span className="text-[11px] text-[#8c8f94] italic block leading-tight mt-0.5">Products you recommend instead of the current one.</span>
                </div>
                
                <div className="md:col-span-3 relative">
                    {/* Selected Items Chips */}
                    {upsells.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {upsells.map((id, i) => (
                                <span key={i} className="bg-[#f0f0f1] border border-[#c3c4c7] text-[#3c434a] rounded-[2px] px-2 py-0.5 text-[12px] flex items-center gap-1.5 shadow-sm">
                                    <span className="max-w-[150px] truncate">{id}</span> 
                                    <X size={12} className="cursor-pointer text-[#8c8f94] hover:text-[#d63638]" onClick={() => removeProduct('upsells', id)}/>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <input 
                            value={upsellInput}
                            onChange={(e) => setUpsellInput(e.target.value)}
                            className="w-full border border-[#8c8f94] pl-7 pr-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                            placeholder="Search for a product..."
                        />
                        {loadingUpsell ? (
                            <Loader2 size={14} className="absolute left-2 top-1.5 text-[#2271b1] animate-spin"/>
                        ) : (
                            <Search size={14} className="absolute left-2 top-1.5 text-[#8c8f94]"/>
                        )}
                    </div>

                    {upsellResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-[#c3c4c7] rounded-[3px] shadow-lg max-h-48 overflow-y-auto mt-1 custom-scrollbar">
                            {upsellResults.map((prod) => (
                                <li 
                                    key={prod.id} 
                                    onClick={() => addProduct('upsells', prod.id)}
                                    className="px-3 py-2 hover:bg-[#f0f6fc] cursor-pointer text-[12px] flex items-center gap-2 border-b border-[#f0f0f1] last:border-0"
                                >
                                    <div className="w-6 h-6 bg-[#f0f0f1] border border-[#c3c4c7] rounded-[2px] overflow-hidden shrink-0">
                                        <img src={prod.featuredImage || prod.image || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-[#2271b1]">{prod.name}</span>
                                        <span className="text-[10px] text-[#8c8f94]">SKU: {prod.sku || 'N/A'}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Cross-sells */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div className="md:text-left mt-1.5">
                    <label className="text-[13px] text-[#3c434a] font-medium block">Cross-sells</label>
                    <span className="text-[11px] text-[#8c8f94] italic block leading-tight mt-0.5">Products you promote in the cart.</span>
                </div>
                
                <div className="md:col-span-3 relative">
                    {/* Selected Items Chips */}
                    {crossSells.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {crossSells.map((id, i) => (
                                <span key={i} className="bg-[#f0f0f1] border border-[#c3c4c7] text-[#3c434a] rounded-[2px] px-2 py-0.5 text-[12px] flex items-center gap-1.5 shadow-sm">
                                    <span className="max-w-[150px] truncate">{id}</span>
                                    <X size={12} className="cursor-pointer text-[#8c8f94] hover:text-[#d63638]" onClick={() => removeProduct('crossSells', id)}/>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <input 
                            value={crossSellInput}
                            onChange={(e) => setCrossSellInput(e.target.value)}
                            className="w-full border border-[#8c8f94] pl-7 pr-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                            placeholder="Search for a product..."
                        />
                        {loadingCrossSell ? (
                            <Loader2 size={14} className="absolute left-2 top-1.5 text-[#2271b1] animate-spin"/>
                        ) : (
                            <Search size={14} className="absolute left-2 top-1.5 text-[#8c8f94]"/>
                        )}
                    </div>

                    {crossSellResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-[#c3c4c7] rounded-[3px] shadow-lg max-h-48 overflow-y-auto mt-1 custom-scrollbar">
                            {crossSellResults.map((prod) => (
                                <li 
                                    key={prod.id} 
                                    onClick={() => addProduct('crossSells', prod.id)}
                                    className="px-3 py-2 hover:bg-[#f0f6fc] cursor-pointer text-[12px] flex items-center gap-2 border-b border-[#f0f0f1] last:border-0"
                                >
                                    <div className="w-6 h-6 bg-[#f0f0f1] border border-[#c3c4c7] rounded-[2px] overflow-hidden shrink-0">
                                        <img src={prod.featuredImage || prod.image || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-[#2271b1]">{prod.name}</span>
                                        <span className="text-[10px] text-[#8c8f94]">SKU: {prod.sku || 'N/A'}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

        </div>
    );
}