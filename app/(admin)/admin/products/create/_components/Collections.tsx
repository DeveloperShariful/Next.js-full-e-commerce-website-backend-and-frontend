// File: app/admin/products/create/_components/Collections.tsx

import { useState, useEffect } from "react";
import { getCollections } from "@/app/actions/admin/product/product-read"; 
import { ComponentProps } from "../types";
import { ChevronUp, Search, Check } from "lucide-react";

export default function Collections({ data, updateData }: ComponentProps) {
    const [dbCollections, setDbCollections] = useState<{id: string, name: string}[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        getCollections().then(res => { if(res.success) setDbCollections(res.data as any) });
    }, []);

    const toggleCollection = (id: string) => {
        const newIds = data.collectionIds.includes(id)
            ? data.collectionIds.filter(c => c !== id)
            : [...data.collectionIds, id];
        updateData('collectionIds', newIds);
    };

    // 🔥 Dynamic Filtering based on Search
    const filteredCollections = dbCollections.filter(col => 
        col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">
                <span>Collections</span>
                <ChevronUp size={14} />
            </div>
            
            <div className="p-3">
                {/* Search Input */}
                <div className="relative mb-2">
                    <input 
                        type="text" 
                        placeholder="Search collections..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 pl-7 pr-2 py-1.5 text-xs rounded-sm outline-none focus:border-[#2271b1]"
                    />
                    <Search size={12} className="absolute left-2 top-2 text-gray-400"/>
                </div>

                {/* List */}
                <div className="max-h-[150px] overflow-y-auto border border-gray-200 p-2 bg-gray-50 mb-2 rounded-sm custom-scrollbar">
                    {filteredCollections.length > 0 ? filteredCollections.map(col => (
                        <label key={col.id} className="flex items-center gap-2 mb-1.5 select-none text-xs cursor-pointer hover:bg-gray-100 p-1 rounded transition">
                            <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${data.collectionIds.includes(col.id) ? 'bg-[#2271b1] border-[#2271b1]' : 'border-gray-400 bg-white'}`}>
                                {data.collectionIds.includes(col.id) && <Check size={10} className="text-white"/>}
                            </div>
                            
                            {/* Hidden real checkbox for accessibility */}
                            <input 
                                type="checkbox" 
                                checked={data.collectionIds.includes(col.id)} 
                                onChange={() => toggleCollection(col.id)}
                                className="hidden"
                            />
                            <span className={data.collectionIds.includes(col.id) ? 'font-medium text-[#2271b1]' : 'text-gray-700'}>{col.name}</span>
                        </label>
                    )) : (
                        <div className="text-xs text-gray-400 text-center py-2">
                            {searchTerm ? "No matching collections" : "No collections found"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}