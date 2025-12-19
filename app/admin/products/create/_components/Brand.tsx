import { useState, useEffect } from "react";
import { ComponentProps } from "../types"; // Adjust path if needed
import { getBrands } from "@/app/actions/product";
import { ChevronUp, Plus, Search } from "lucide-react";

export default function Brand({ data, updateData }: ComponentProps) {
    const [dbBrands, setDbBrands] = useState<{id: string, name: string}[]>([]);
    const [input, setInput] = useState("");
    const [filteredBrands, setFilteredBrands] = useState<{id: string, name: string}[]>([]);
    const [showInput, setShowInput] = useState(false);

    useEffect(() => {
        getBrands().then(res => { 
            if(res.success) {
                setDbBrands(res.data as any);
                setFilteredBrands(res.data as any);
            }
        });
    }, []);

    // Filter brands based on search
    const handleSearch = (val: string) => {
        setInput(val);
        const filtered = dbBrands.filter(b => b.name.toLowerCase().includes(val.toLowerCase()));
        setFilteredBrands(filtered);
    };

    const handleSelect = (brandName: string) => {
        // If clicking the same brand, deselect it
        if (data.vendor === brandName) {
            updateData('vendor', "");
        } else {
            updateData('vendor', brandName);
        }
    };

    const addNewBrand = () => {
        if(!input.trim()) return;
        updateData('vendor', input.trim());
        setDbBrands([...dbBrands, { id: `temp_${Date.now()}`, name: input.trim() }]);
        setFilteredBrands([...filteredBrands, { id: `temp_${Date.now()}`, name: input.trim() }]);
        setInput("");
        setShowInput(false);
    };

    return (
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm">
            <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300 bg-gray-50 font-semibold text-xs text-gray-700">
                <span>Product Brand</span>
                <ChevronUp size={14} />
            </div>
            <div className="p-3">
                
                {/* Search / Add Input */}
                <div className="mb-2 relative">
                    <input 
                        value={input}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search brand..." 
                        className="w-full border border-gray-300 px-2 py-1.5 pl-7 text-xs rounded-sm outline-none focus:border-[#2271b1]"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewBrand())}
                    />
                    <Search size={12} className="absolute left-2 top-2 text-gray-400"/>
                </div>

                {/* Brand List */}
                <div className="max-h-[150px] overflow-y-auto border border-gray-200 p-2 bg-gray-50 mb-2 rounded-sm custom-scrollbar">
                    {filteredBrands.length > 0 ? (
                        filteredBrands.map(brand => (
                            <label key={brand.id} className="flex items-center gap-2 mb-1 select-none text-xs cursor-pointer hover:text-[#2271b1]">
                                <input 
                                    type="radio" 
                                    checked={data.vendor === brand.name} 
                                    onChange={() => handleSelect(brand.name)}
                                    className="accent-[#2271b1]"
                                />
                                <span>{brand.name}</span>
                            </label>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-2">No brands found.</p>
                    )}
                </div>

                {/* Add New Button Logic */}
                {input && !filteredBrands.some(b => b.name.toLowerCase() === input.toLowerCase()) && (
                    <button 
                        type="button" 
                        onClick={addNewBrand} 
                        className="w-full py-1 bg-gray-100 border border-gray-300 text-xs font-medium text-[#2271b1] hover:bg-gray-200 rounded-sm flex items-center justify-center gap-1"
                    >
                        <Plus size={12}/> Add "{input}"
                    </button>
                )}
            </div>
        </div>
    );
}