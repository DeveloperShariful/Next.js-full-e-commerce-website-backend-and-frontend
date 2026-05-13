// app/admin/products/create/_components/Brand.tsx

"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form"; 
import { getBrands } from "@/app/actions/admin/product/product-read";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { ProductFormValues } from "../schema"; 

export default function Brand() {
    const { setValue, watch } = useFormContext<ProductFormValues>();
    const currentVendor = watch("vendor"); 

    const [dbBrands, setDbBrands] = useState<{id: string, name: string}[]>([]);
    const [input, setInput] = useState("");
    const [filteredBrands, setFilteredBrands] = useState<{id: string, name: string}[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        getBrands().then(res => { 
            if(res.success) {
                setDbBrands(res.data as any);
                setFilteredBrands(res.data as any);
            }
        });
    }, []);

    const handleSearch = (val: string) => {
        setInput(val);
        const filtered = dbBrands.filter(b => b.name.toLowerCase().includes(val.toLowerCase()));
        setFilteredBrands(filtered);
    };

    const handleSelect = (brandName: string) => {
        if (currentVendor === brandName) {
            setValue('vendor', "", { shouldDirty: true });
        } else {
            setValue('vendor', brandName, { shouldDirty: true });
        }
    };

    const addNewBrand = () => {
        if(!input.trim()) return;
        
        setValue('vendor', input.trim(), { shouldDirty: true });

        const newBrand = { id: `temp_${Date.now()}`, name: input.trim() };
        setDbBrands([...dbBrands, newBrand]);
        setFilteredBrands([...filteredBrands, newBrand]); 
        
        setInput("");
    };

    return (
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            {/* Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Product Brands</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {/* Content */}
            {isExpanded && (
                <div className="p-3 bg-white">
                    {/* Search */}
                    <div className="mb-3 relative">
                        <input 
                            value={input}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search brands..." 
                            className="w-full border border-[#8c8f94] px-2 py-1 pl-7 text-[13px] rounded-[3px] outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1]"
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewBrand())}
                        />
                        <Search size={14} className="absolute left-2 top-1.5 text-[#8c8f94]"/>
                    </div>

                    {/* Brand List */}
                    <div className="max-h-[150px] overflow-y-auto border border-[#c3c4c7] p-2 bg-white mb-2 rounded-[3px] custom-scrollbar">
                        {filteredBrands.length > 0 ? (
                            <ul className="space-y-1.5">
                                {filteredBrands.map(brand => (
                                    <li key={brand.id}>
                                        <label className="flex items-start gap-2 select-none text-[13px] text-[#3c434a] cursor-pointer hover:text-[#2271b1]">
                                            <input 
                                                type="radio" 
                                                checked={currentVendor === brand.name} 
                                                onChange={() => handleSelect(brand.name)}
                                                className="mt-0.5 w-3.5 h-3.5 text-[#2271b1] border-[#8c8f94] focus:ring-[#2271b1]"
                                            />
                                            <span className="leading-tight">{brand.name}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-[12px] text-[#8c8f94] italic text-center py-2">No brands found.</p>
                        )}
                    </div>

                    {/* Add New Button */}
                    {input && !filteredBrands.some(b => b.name.toLowerCase() === input.toLowerCase()) && (
                        <button 
                            type="button" 
                            onClick={addNewBrand} 
                            className="w-full py-1.5 mt-1 bg-[#f6f7f7] border border-[#c3c4c7] text-[13px] font-medium text-[#2271b1] hover:bg-[#f0f0f1] rounded-[3px] transition-colors"
                        >
                            + Add "{input}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}