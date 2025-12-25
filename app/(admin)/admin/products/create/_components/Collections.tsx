// app/admin/products/create/_components/Collections.tsx

import { useState, useEffect } from "react";
import { getCollections } from "@/app/actions/admin/product/product-read"; 
import { ComponentProps } from "../types";
import { ChevronUp } from "lucide-react";

export default function Collections({ data, updateData }: ComponentProps) {
    const [dbCollections, setDbCollections] = useState<{id: string, name: string}[]>([]);

    useEffect(() => {
        getCollections().then(res => { if(res.success) setDbCollections(res.data as any) });
    }, []);

    const toggleCollection = (id: string) => {
        const newIds = data.collectionIds.includes(id)
            ? data.collectionIds.filter(c => c !== id)
            : [...data.collectionIds, id];
        updateData('collectionIds', newIds);
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">
                <span>Collections</span>
                <ChevronUp size={14} />
            </div>
            <div className="p-3">
                <div className="max-h-[150px] overflow-y-auto border border-gray-200 p-2 bg-gray-50 mb-2 rounded-sm custom-scrollbar">
                    {dbCollections.length > 0 ? dbCollections.map(col => (
                        <label key={col.id} className="flex items-center gap-2 mb-1 select-none text-xs">
                            <input 
                                type="checkbox" 
                                checked={data.collectionIds.includes(col.id)} 
                                onChange={() => toggleCollection(col.id)}
                                className="accent-[#2271b1]"
                            />
                            <span>{col.name}</span>
                        </label>
                    )) : <div className="text-xs text-gray-400 text-center">No collections found</div>}
                </div>
            </div>
        </div>
    );
}