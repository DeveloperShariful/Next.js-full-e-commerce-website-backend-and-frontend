// File: app/admin/products/create/_components/Inventory.tsx

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getLocations } from "@/app/actions/admin/product/product-read";
import { MapPin, AlertCircle } from "lucide-react";
import { ProductFormData } from "../types";

export default function Inventory() {
    const { register, watch, setValue } = useFormContext<ProductFormData>();
    const data = watch();
    
    // States
    const [locations, setLocations] = useState<{id: string, name: string, isDefault: boolean}[]>([]);
    const [loadingLocs, setLoadingLocs] = useState(true);

    // Watch Inventory Data
    const inventoryData = watch("inventoryData") || [];

    // 1. Fetch Locations on Mount
    useEffect(() => {
        getLocations().then(res => {
            if(res.success && res.data) {
                setLocations(res.data as any);
                
                // If it's a new product or no inventory data yet, init with default location logic
                // But only if we are in Simple product mode and tracking quantity
                if (data.productType === 'SIMPLE' && data.trackQuantity) {
                    const currentStock = data.stock || 0;
                    const existingData = data.inventoryData || [];
                    
                    if (existingData.length === 0 && res.data.length > 0) {
                        // Assign existing total stock to default location
                        const defaultLoc = res.data.find((l: any) => l.isDefault) || res.data[0];
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

    // 2. Handle Stock Change for Specific Location
    const handleStockChange = (locId: string, qtyStr: string) => {
        const newQty = parseInt(qtyStr) || 0;
        
        // Update inventoryData array
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

        // 🔥 OPTIMISTIC UI: Auto-calculate Total Stock
        const total = newInventoryData.reduce((acc, curr) => acc + curr.quantity, 0);
        setValue("stock", total, { shouldDirty: true });
    };

    const getQtyForLoc = (locId: string) => {
        return inventoryData.find(i => i.locationId === locId)?.quantity || 0;
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Identity Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="md:text-right font-medium text-xs">SKU</label>
                <input 
                    {...register("sku")}
                    className="md:col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    placeholder="Stock Keeping Unit"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="md:text-right font-medium text-xs">Barcode (GTIN/UPC)</label>
                <input 
                    {...register("barcode")}
                    className="md:col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="md:text-right font-medium text-xs">MPN</label>
                <input 
                    {...register("mpn")}
                    className="md:col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    placeholder="Manufacturer Part Number" 
                />
            </div>

            <hr className="border-gray-200" />

            {/* Track Quantity Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-start-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
                        <input 
                            type="checkbox" 
                            {...register("trackQuantity")}
                        />
                        Track stock quantity
                    </label>
                </div>
            </div>

            {/* 🔥 MULTI-WAREHOUSE STOCK TABLE */}
            {data.trackQuantity && data.productType === 'SIMPLE' && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-4 animate-in fade-in">
                    <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin size={14}/> Inventory by Location
                    </h4>

                    {loadingLocs ? (
                        <p className="text-xs text-gray-400">Loading locations...</p>
                    ) : (
                        <div className="space-y-2">
                            {locations.map(loc => (
                                <div key={loc.id} className="flex justify-between items-center bg-white p-2 border border-gray-200 rounded-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-gray-800">
                                            {loc.name} {loc.isDefault && <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded ml-1">Default</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={getQtyForLoc(loc.id)}
                                            onChange={(e) => handleStockChange(loc.id, e.target.value)}
                                            className="w-24 border border-gray-300 px-2 py-1 text-right text-sm rounded focus:border-[#2271b1] outline-none font-medium"
                                        />
                                    </div>
                                </div>
                            ))}
                            
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                <span className="text-xs font-bold text-gray-600 uppercase">Total Stock</span>
                                <span className="text-sm font-bold text-[#2271b1]">{data.stock}</span>
                            </div>
                        </div>
                    )}

                    {/* Low Stock Threshold */}
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="md:text-right font-medium text-xs">Low stock threshold</label>
                        <input 
                            type="number" 
                            {...register("lowStockThreshold")}
                            className="md:col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                            placeholder="2" 
                        />
                    </div>
                </div>
            )}

            {data.productType === 'VARIABLE' && (
                <div className="bg-blue-50 text-blue-800 p-3 rounded text-xs flex gap-2 items-start border border-blue-200">
                    <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                    <p>Stock for variable products is managed at the <strong>Variations</strong> tab.</p>
                </div>
            )}

            {/* Backorders & Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="md:text-right font-medium text-xs">Allow backorders?</label>
                <select 
                    {...register("backorderStatus")}
                    className="md:col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="DO_NOT_ALLOW">Do not allow</option>
                    <option value="ALLOW">Allow</option>
                    <option value="ALLOW_BUT_NOTIFY">Allow, but notify customer</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-start-2 md:col-span-2">
                    <label className="flex items-center gap-2 text-xs select-none">
                        <input 
                            type="checkbox" 
                            {...register("soldIndividually")}
                        />
                        Sold individually (Limit purchases to 1 item per order)
                    </label>
                </div>
            </div>
        </div>
    );
}