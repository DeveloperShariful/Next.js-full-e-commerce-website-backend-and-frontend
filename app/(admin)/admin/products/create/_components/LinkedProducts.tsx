// app/admin/products/create/_components/LinkedProducts.tsx

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { X, Search, Loader2 } from "lucide-react";
import { searchProducts } from "@/app/actions/admin/product/product-read";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { ProductFormData } from "../types";

export default function LinkedProducts() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const upsells = watch("upsells") || [];
    const crossSells = watch("crossSells") || [];
    
    const { formatPrice } = useGlobalStore();

    const [upsellInput, setUpsellInput] = useState("");
    const [crossSellInput, setCrossSellInput] = useState("");
    const [upsellResults, setUpsellResults] = useState<any[]>([]);
    const [crossSellResults, setCrossSellResults] = useState<any[]>([]);
    const [loadingUpsell, setLoadingUpsell] = useState(false);
    const [loadingCrossSell, setLoadingCrossSell] = useState(false);

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
        <div className="space-y-6 max-w-lg">
            <div className="space-y-2 relative">
                <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs font-bold text-gray-700">Upsells</label>
                    <span className="text-[10px] text-gray-400 cursor-help" title="Products you recommend instead of the current one">(?)</span>
                </div>
                
                <div className="relative">
                    <input 
                        value={upsellInput}
                        onChange={(e) => setUpsellInput(e.target.value)}
                        className="w-full border border-gray-400 pl-8 pr-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        placeholder="Search for a product..."
                    />
                    {loadingUpsell ? (
                        <Loader2 size={14} className="absolute left-2.5 top-2.5 text-gray-400 animate-spin"/>
                    ) : (
                        <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                    )}
                </div>

                {upsellResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-sm shadow-lg max-h-48 overflow-y-auto mt-1">
                        {upsellResults.map((prod) => (
                            <li 
                                key={prod.id} 
                                onClick={() => addProduct('upsells', prod.id)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs flex items-center gap-2 border-b border-gray-100 last:border-0"
                            >
                                <img src={prod.featuredImage || prod.image || "/placeholder.jpg"} className="w-6 h-6 object-cover rounded" alt="" />
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">{prod.name}</span>
                                    <span className="text-[10px] text-gray-400">SKU: {prod.sku || 'N/A'}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex flex-wrap gap-2">
                    {upsells.map((id, i) => (
                        <span key={i} className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                            <span className="max-w-[150px] truncate">{id}</span> 
                            <X size={12} className="cursor-pointer hover:text-red-600" onClick={() => removeProduct('upsells', id)}/>
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-2 relative">
                <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs font-bold text-gray-700">Cross-sells</label>
                    <span className="text-[10px] text-gray-400 cursor-help" title="Products you promote in the cart">(?)</span>
                </div>
                
                <div className="relative">
                    <input 
                        value={crossSellInput}
                        onChange={(e) => setCrossSellInput(e.target.value)}
                        className="w-full border border-gray-400 pl-8 pr-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                        placeholder="Search for a product..."
                    />
                    {loadingCrossSell ? (
                        <Loader2 size={14} className="absolute left-2.5 top-2.5 text-gray-400 animate-spin"/>
                    ) : (
                        <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                    )}
                </div>

                {crossSellResults.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-sm shadow-lg max-h-48 overflow-y-auto mt-1">
                        {crossSellResults.map((prod) => (
                            <li 
                                key={prod.id} 
                                onClick={() => addProduct('crossSells', prod.id)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs flex items-center gap-2 border-b border-gray-100 last:border-0"
                            >
                                <img src={prod.featuredImage || prod.image || "/placeholder.jpg"} className="w-6 h-6 object-cover rounded" alt="" />
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">{prod.name}</span>
                                    <span className="text-[10px] text-gray-400">SKU: {prod.sku || 'N/A'}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex flex-wrap gap-2">
                    {crossSells.map((id, i) => (
                        <span key={i} className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                            <span className="max-w-[150px] truncate">{id}</span>
                            <X size={12} className="cursor-pointer hover:text-red-600" onClick={() => removeProduct('crossSells', id)}/>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}