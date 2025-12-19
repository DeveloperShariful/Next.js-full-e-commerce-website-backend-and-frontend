import { ComponentProps } from "../types";

export default function Shipping({ data, updateData }: ComponentProps) {
    return (
        <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-right font-medium text-xs">Weight (kg)</label>
                <input 
                    type="number" 
                    value={data.weight} 
                    onChange={e => updateData('weight', e.target.value)} 
                    className="col-span-2 w-full border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none"
                    placeholder="0"
                />
            </div>
            <div className="grid grid-cols-3 gap-4 items-start">
                <label className="text-right font-medium text-xs pt-2">Dimensions (cm)</label>
                <div className="col-span-2 flex gap-2">
                    <input type="number" placeholder="L" value={data.length} onChange={e => updateData('length', e.target.value)} className="w-1/3 border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none" />
                    <input type="number" placeholder="W" value={data.width} onChange={e => updateData('width', e.target.value)} className="w-1/3 border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none" />
                    <input type="number" placeholder="H" value={data.height} onChange={e => updateData('height', e.target.value)} className="w-1/3 border border-gray-400 px-2 py-1.5 rounded-sm focus:border-[#2271b1] outline-none" />
                </div>
            </div>
        </div>
    );
}