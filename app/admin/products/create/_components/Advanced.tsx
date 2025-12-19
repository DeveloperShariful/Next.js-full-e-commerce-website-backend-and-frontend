import { ComponentProps } from "../types";

export default function Advanced({ data, updateData }: ComponentProps) {
    return (
        <div className="space-y-4 max-w-lg">
            <div>
                <label className="block text-xs font-medium mb-1">Purchase Note</label>
                <textarea 
                    value={data.purchaseNote} 
                    onChange={e => updateData('purchaseNote', e.target.value)} 
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                    rows={2} 
                />
            </div>
            <div>
                <label className="block text-xs font-medium mb-1">Menu Order</label>
                <input 
                    type="number" 
                    value={data.menuOrder} 
                    onChange={e => updateData('menuOrder', parseInt(e.target.value))} 
                    className="w-full border border-gray-400 p-2 rounded-sm text-sm outline-none focus:border-[#2271b1]" 
                />
            </div>
            <div>
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={data.enableReviews} onChange={e => updateData('enableReviews', e.target.checked)} />
                    Enable Reviews
                </label>
            </div>
        </div>
    );
}