// app/admin/products/create/_components/Inventory.tsx

import { ComponentProps } from "../types";

export default function Inventory({ data, updateData }: ComponentProps) {
    return (
        <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">SKU</label>
                <input 
                    value={data.sku} 
                    onChange={e => updateData('sku', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Barcode</label>
                <input 
                    value={data.barcode} 
                    onChange={e => updateData('barcode', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-start-2 col-span-2">
                    <label className="flex items-center gap-2 text-xs">
                        <input type="checkbox" checked={data.trackQuantity} onChange={e => updateData('trackQuantity', e.target.checked)} />
                        Track stock quantity
                    </label>
                </div>
            </div>
            {data.trackQuantity && data.productType === 'simple' && (
                <div className="grid grid-cols-3 gap-4 items-center">
                    <label className="text-right font-medium text-xs">Quantity</label>
                    <input 
                        type="number" 
                        value={data.stock} 
                        onChange={e => updateData('stock', parseInt(e.target.value))} 
                        className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    />
                </div>
            )}
        </div>
    );
}