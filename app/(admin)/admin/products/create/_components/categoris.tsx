// app/admin/products/create/_components/categoris.tsx

import { useState, useEffect } from "react";
import { ComponentProps } from "../types";
import { getCategories } from "@/app/actions/admin/product/category";
import { ChevronUp } from "lucide-react";

export default function Categories({ data, updateData }: ComponentProps) {
    const [dbCategories, setDbCategories] = useState<{id: string, name: string}[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        getCategories().then(res => { if(res.success) setDbCategories(res.data as any) });
    }, []);

    const addCategory = () => {
        if(!input.trim()) return;
        // Fix for duplicate key: use timestamp
        const newCat = { id: `temp_${Date.now()}`, name: input.trim() };
        setDbCategories([...dbCategories, newCat]);
        updateData('category', newCat.name);
        setInput("");
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">
                <span>Product Categories</span>
                <ChevronUp size={14} />
            </div>
            <div className="p-3">
                <div className="max-h-[150px] overflow-y-auto border border-gray-200 p-2 bg-gray-50 mb-2 rounded-sm">
                    {dbCategories.map(cat => (
                        <label key={cat.id} className="flex items-center gap-2 mb-1 select-none text-xs">
                            <input 
                                type="radio" 
                                checked={data.category === cat.name} 
                                onChange={() => updateData('category', cat.name)}
                                className="text-[#2271b1]"
                            />
                            <span>{cat.name}</span>
                        </label>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="New category name" 
                        className="flex-1 border border-gray-300 px-2 py-1 text-xs outline-none focus:border-[#2271b1]"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    />
                    <button type="button" onClick={addCategory} className="px-2 py-1 bg-gray-100 border border-gray-300 text-xs font-medium text-[#2271b1] hover:bg-gray-200">Add</button>
                </div>
            </div>
        </div>
    );
}