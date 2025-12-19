import { ComponentProps } from "../types";

export default function General({ data, updateData }: ComponentProps) {
    return (
        <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Regular price ($)</label>
                <input 
                    type="number" 
                    value={data.price} 
                    onChange={e => updateData('price', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    placeholder="0.00"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Sale price ($)</label>
                <input 
                    type="number" 
                    value={data.salePrice} 
                    onChange={e => updateData('salePrice', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    placeholder="0.00"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs text-gray-500">Cost per item</label>
                <input 
                    type="number" 
                    value={data.cost} 
                    onChange={e => updateData('cost', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    placeholder="0.00"
                />
            </div>
        </div>
    );
}