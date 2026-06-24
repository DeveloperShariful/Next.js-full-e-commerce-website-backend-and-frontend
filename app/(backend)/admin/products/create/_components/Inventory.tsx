// File: app/admin/products/create/_components/Inventory.tsx

"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getLocations } from "@/app/actions/backend/product/product-read";
import { MapPin, AlertCircle, Clock } from "lucide-react";
import { ProductFormData } from "../types";

export default function Inventory() {
    const { register, watch, setValue } = useFormContext<ProductFormData>();
    const data = watch();
    
    const [locations, setLocations] = useState<{id: string, name: string, isDefault: boolean}[]>([]);
    const [loadingLocs, setLoadingLocs] = useState(true);

    const inventoryData = watch("inventoryData") || [];
    const isPreOrder = watch("isPreOrder");

    useEffect(() => {
        getLocations().then(res => {
            if(res.success && res.data) {
                setLocations(res.data);
                if (data.productType === 'SIMPLE' && data.trackQuantity) {
                    const currentStock = data.stock || 0;
                    const existingData = data.inventoryData || [];
                    if (existingData.length === 0 && res.data.length > 0) {
                        const defaultLoc = res.data.find(l => l.isDefault) || res.data[0];
                        setValue("inventoryData", [{
                            locationId: defaultLoc.id,
                            quantity: currentStock
                        }]);
                    }
                }
            }
            setLoadingLocs(false);
        });
    }, []);

    const handleStockChange = (locId: string, qtyStr: string) => {
        const newQty = parseInt(qtyStr) || 0;
        const existingItem = inventoryData.find(i => i.locationId === locId);
        let newInventoryData;

        if (existingItem) {
            newInventoryData = inventoryData.map(i => 
                i.locationId === locId ? { ...i, quantity: newQty } : i
            );
        } else {
            newInventoryData = [...inventoryData, { locationId: locId, quantity: newQty }];
        }

        setValue("inventoryData", newInventoryData, { shouldDirty: true });
        const total = newInventoryData.reduce((acc, curr) => acc + curr.quantity, 0);
        setValue("stock", total, { shouldDirty: true });
    };

    const getQtyForLoc = (locId: string) => {
        return inventoryData.find(i => i.locationId === locId)?.quantity || 0;
    };

    return (
        <div className="space-y-4 max-w-2xl">
            
            {/* Identity Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="md:text-left text-[13px] text-[#3c434a]">SKU</label>
                <input 
                    {...register("sku")} 
                    className="md:col-span-2 w-full md:w-2/3 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow" 
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <label className="md:text-left text-[13px] text-[#3c434a]">Barcode</label>
                <input 
                    {...register("barcode")} 
                    className="md:col-span-2 w-full md:w-2/3 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-[#f0f0f1] pb-4">
                <label className="md:text-left text-[13px] text-[#3c434a]">MPN</label>
                <input 
                    {...register("mpn")} 
                    className="md:col-span-2 w-full md:w-2/3 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none" 
                />
            </div>

            {/* Track Quantity Checkbox */}
            <div className="pt-2">
                <label className="flex items-center gap-2 text-[13px] text-[#3c434a] cursor-pointer select-none">
                    <input 
                        type="checkbox" 
                        {...register("trackQuantity")}
                        className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"
                    /> 
                    Track stock quantity for this product
                </label>
            </div>

            {/* Stock Table for Simple Product */}
            {data.trackQuantity && data.productType === 'SIMPLE' && (
                <div className="mt-4 bg-white border border-[#c3c4c7] rounded-[3px] animate-in fade-in">
                    <div className="bg-[#f6f7f7] border-b border-[#c3c4c7] px-3 py-2">
                        <h4 className="text-[13px] font-semibold text-[#1d2327] flex items-center gap-2">
                            <MapPin size={14} className="text-[#8c8f94]"/> Inventory by Location
                        </h4>
                    </div>
                    <div className="p-3">
                        {loadingLocs ? <p className="text-[12px] text-[#8c8f94] italic">Loading locations...</p> : (
                            <div className="space-y-2">
                                {locations.map(loc => (
                                    <div key={loc.id} className="flex justify-between items-center bg-white p-2 border border-[#f0f0f1]">
                                        <span className="text-[13px] text-[#3c434a]">
                                            {loc.name} {loc.isDefault && <span className="text-[10px] text-[#166534] bg-[#f0fdf4] border border-[#bbf7d0] px-1 rounded-sm ml-1 uppercase">Default</span>}
                                        </span>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            value={getQtyForLoc(loc.id)} 
                                            onChange={(e) => handleStockChange(loc.id, e.target.value)} 
                                            className="w-20 border border-[#8c8f94] px-2 py-1 text-right text-[13px] rounded-[3px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
                                        />
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t border-[#f0f0f1] mt-3">
                                    <span className="text-[12px] font-semibold text-[#646970] uppercase">Total Stock</span>
                                    <span className="text-[14px] font-bold text-[#1d2327] mr-1">{data.stock}</span>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-[#c3c4c7] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <label className="md:text-left text-[13px] text-[#3c434a]">Low stock threshold</label>
                            <input 
                                type="number" 
                                {...register("lowStockThreshold")} 
                                className="w-20 border border-[#8c8f94] px-2 py-1 text-right text-[13px] rounded-[3px] focus:border-[#2271b1] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]" 
                                placeholder="2" 
                            />
                        </div>
                    </div>
                </div>
            )}

            {data.productType === 'VARIABLE' && (
                <div className="bg-[#f0f6fc] border-l-4 border-[#2271b1] text-[#3c434a] p-3 text-[13px] flex gap-2 items-start shadow-sm mt-4">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#2271b1]"/>
                    <p>Stock for variable products is managed at the <strong>Variations</strong> tab.</p>
                </div>
            )}

            {/* Backorders & Limits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mt-6">
                <label className="md:text-left text-[13px] text-[#3c434a]">Allow backorders?</label>
                <div className="md:col-span-2">
                    <select 
                        {...register("backorderStatus")} 
                        className="w-full md:w-2/3 border border-[#8c8f94] px-2 py-1 rounded-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] outline-none"
                    >
                        <option value="DO_NOT_ALLOW">Do not allow</option>
                        <option value="ALLOW">Allow</option>
                        <option value="ALLOW_BUT_NOTIFY">Allow, but notify customer</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 items-center border-b border-[#f0f0f1] pb-4 mt-4">
                <div>
                    <label className="flex items-center gap-2 text-[13px] text-[#3c434a] select-none cursor-pointer">
                        <input type="checkbox" {...register("soldIndividually")} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]"/> 
                        Sold individually (Limit 1 per order)
                    </label>
                </div>
            </div>

            {/* 🔥 Pre-order Section */}
            <div className="pt-2">
                <label className="flex items-center gap-2 text-[13px] text-[#3c434a] font-semibold cursor-pointer mb-3">
                    <input type="checkbox" {...register("isPreOrder")} className="w-3.5 h-3.5 rounded-[2px] border-[#8c8f94] text-[#d63638] focus:ring-[#d63638]"/> 
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-[#8c8f94]"/> Enable Pre-order</span>
                </label>

                {isPreOrder && (
                    <div className="bg-[#fff5eb] border border-[#fbd38d] rounded-[3px] p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-[13px] text-[#c05621] font-semibold">Release Date <span className="text-[#d63638]">*</span></label>
                                <input 
                                    type="date" 
                                    {...register("preOrderReleaseDate")} 
                                    className="md:col-span-2 w-full md:w-1/2 border border-[#fbd38d] px-2 py-1 rounded-[3px] text-[13px] text-[#3c434a] outline-none focus:border-[#c05621] bg-white shadow-sm" 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-[13px] text-[#c05621] font-semibold">Pre-order Limit</label>
                                <input 
                                    type="number" 
                                    {...register("preOrderLimit")} 
                                    className="md:col-span-2 w-full md:w-1/3 border border-[#fbd38d] px-2 py-1 rounded-[3px] text-[13px] text-[#3c434a] outline-none focus:border-[#c05621] bg-white shadow-sm" 
                                    placeholder="Optional" 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-[13px] text-[#c05621] font-semibold">Message</label>
                                <input 
                                    type="text" 
                                    {...register("preOrderMessage")} 
                                    className="md:col-span-2 w-full border border-[#fbd38d] px-2 py-1 rounded-[3px] text-[13px] text-[#3c434a] outline-none focus:border-[#c05621] bg-white shadow-sm" 
                                    placeholder="e.g. Ships in late October" 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}