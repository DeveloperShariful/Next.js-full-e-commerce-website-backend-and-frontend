// app/admin/products/create/_components/description.tsx

import { ComponentProps } from "../types";

export default function Description({ data, updateData }: ComponentProps) {
    return (
        <div className="bg-white border border-gray-300 rounded-sm">
            <div className="px-4 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs">Description</div>
            <textarea 
                value={data.description} 
                onChange={(e) => updateData('description', e.target.value)} 
                rows={10} 
                className="w-full p-4 outline-none resize-y text-sm focus:bg-gray-50 transition"
                placeholder="Product detailed description..."
            />
        </div>
    );
}