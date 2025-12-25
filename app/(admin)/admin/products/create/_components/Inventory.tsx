// app/admin/products/create/_components/Inventory.tsx

import { ComponentProps } from "../types";

export default function Inventory({ data, updateData }: ComponentProps) {
    return (
        <div className="space-y-4 max-w-lg">
            {/* SKU & Barcode (Existing) */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">SKU</label>
                <input value={data.sku} onChange={e => updateData('sku', e.target.value)} className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Barcode (GTIN/UPC)</label>
                <input value={data.barcode} onChange={e => updateData('barcode', e.target.value)} className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" />
            </div>
            
            {/* 🔥 NEW: MPN */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">MPN</label>
                <input value={data.mpn} onChange={e => updateData('mpn', e.target.value)} className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" placeholder="Manufacturer Part Number" />
            </div>

            <hr className="border-gray-200" />

            {/* Track Quantity Logic */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-start-2 col-span-2">
                    <label className="flex items-center gap-2 text-xs select-none">
                        <input type="checkbox" checked={data.trackQuantity} onChange={e => updateData('trackQuantity', e.target.checked)} />
                        Track stock quantity
                    </label>
                </div>
            </div>

            {data.trackQuantity && data.productType === 'simple' && (
                <>
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Quantity</label>
                        <input type="number" value={data.stock} onChange={e => updateData('stock', parseInt(e.target.value))} className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" />
                    </div>
                    
                    {/* 🔥 NEW: Low Stock Threshold */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-right font-medium text-xs">Low stock threshold</label>
                        <input type="number" value={data.lowStockThreshold} onChange={e => updateData('lowStockThreshold', parseInt(e.target.value))} className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm" placeholder="2" />
                    </div>
                </>
            )}

            {/* 🔥 NEW: Backorders */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Allow backorders?</label>
                <select value={data.backorderStatus} onChange={e => updateData('backorderStatus', e.target.value)} className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none text-sm">
                    <option value="DO_NOT_ALLOW">Do not allow</option>
                    <option value="ALLOW">Allow</option>
                    <option value="ALLOW_BUT_NOTIFY">Allow, but notify customer</option>
                </select>
            </div>

            {/* 🔥 NEW: Sold Individually */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-start-2 col-span-2">
                    <label className="flex items-center gap-2 text-xs select-none">
                        <input type="checkbox" checked={data.soldIndividually} onChange={e => updateData('soldIndividually', e.target.checked)} />
                        Sold individually (Limit purchases to 1 item per order)
                    </label>
                </div>
            </div>
        </div>
    );
}