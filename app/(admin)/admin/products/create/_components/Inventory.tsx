// app/admin/products/create/_components/Inventory.tsx

import { useFormContext } from "react-hook-form";
import { ProductFormData } from "../types";

export default function Inventory() {
    const { register, watch, setValue } = useFormContext<ProductFormData>();
    const data = watch();

    return (
        <div className="space-y-4 max-w-lg">
            {/* SKU & Barcode (Existing) */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">SKU</label>
                <input 
                    {...register("sku")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Barcode (GTIN/UPC)</label>
                <input 
                    {...register("barcode")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                />
            </div>
            
            {/* 🔥 NEW: MPN */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">MPN</label>
                <input 
                    {...register("mpn")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                    placeholder="Manufacturer Part Number" 
                />
            </div>

            <hr className="border-gray-200" />

            {/* Track Quantity Logic */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-start-2 col-span-2">
                    <label className="flex items-center gap-2 text-xs select-none">
                        <input 
                            type="checkbox" 
                            {...register("trackQuantity")}
                        />
                        Track stock quantity
                    </label>
                </div>
            </div>

            {data.trackQuantity && data.productType === 'SIMPLE' && (
                <>
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Quantity</label>
                        <input 
                            type="number" 
                            {...register("stock")}
                            className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                        />
                    </div>
                    
                    {/* 🔥 NEW: Low Stock Threshold */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Low stock threshold</label>
                        <input 
                            type="number" 
                            {...register("lowStockThreshold")}
                            className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" 
                            placeholder="2" 
                        />
                    </div>
                </>
            )}

            {/* 🔥 NEW: Backorders */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Allow backorders?</label>
                <select 
                    {...register("backorderStatus")}
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm"
                >
                    <option value="DO_NOT_ALLOW">Do not allow</option>
                    <option value="ALLOW">Allow</option>
                    <option value="ALLOW_BUT_NOTIFY">Allow, but notify customer</option>
                </select>
            </div>

            {/* 🔥 NEW: Sold Individually */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-start-2 col-span-2">
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