// app/admin/products/create/_components/categoris.tsx

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronUp } from "lucide-react";
import { getCategories } from "@/app/actions/admin/product/category";
import { ProductFormData } from "../types";

export default function Categories() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const currentCategory = watch("category");
    
    const [dbCategories, setDbCategories] = useState<{id: string, name: string}[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        getCategories().then(res => {
            if(res.success) setDbCategories(res.data as any);
        });
    }, []);

    const addCategory = () => {
        if(!input.trim()) return;
        
        const newCat = { id: `temp_${Date.now()}`, name: input.trim() };
        setDbCategories([...dbCategories, newCat]);
        setValue("category", newCat.name, { shouldDirty: true, shouldValidate: true });
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
                                checked={currentCategory === cat.name} 
                                onChange={() => setValue("category", cat.name, { shouldDirty: true, shouldValidate: true })}
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