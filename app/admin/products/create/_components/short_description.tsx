import { ComponentProps } from "../types";

export default function ShortDescription({ data, updateData }: ComponentProps) {
    return (
        <div className="bg-white border border-gray-300 rounded-sm">
            <div className="px-4 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs">Product Short Description</div>
            <textarea 
                value={data.shortDescription} 
                onChange={(e) => updateData('shortDescription', e.target.value)} 
                rows={4} 
                className="w-full p-4 outline-none resize-y text-sm focus:bg-gray-50"
            />
        </div>
    );
}