// app/admin/products/create/_components/categoris.tsx

"use client";

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getCategoryTree } from "@/app/actions/backend/product/product-category";
import { ProductFormData } from "../types";

// ক্যাটাগরি ট্রি রেন্ডার করার জন্য টাইপ ডিফাইন
type CategoryNode = {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    children?: CategoryNode[];
};

export default function Categories() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    
    // ✅ FIX: Multiple Categories array watch
    const currentCategoryIds = watch("categoryIds") || [];
    
    const [dbCategories, setDbCategories] = useState<CategoryNode[]>([]);
    const [input, setInput] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        // Fetch categories and build tree
        getCategoryTree().then((res: any[]) => {
            if(res && res.length > 0) {
                const tree = buildCategoryTree(res);
                setDbCategories(tree);
            }
        });
    }, []);

    // 🌳 Helper: Build Tree Structure from flat array
    const buildCategoryTree = (categories: any[]): CategoryNode[] => {
        const categoryMap = new Map<string, CategoryNode>();
        const tree: CategoryNode[] = [];

        categories.forEach(cat => {
            categoryMap.set(cat.id, { ...cat, children: [] });
        });

        categories.forEach(cat => {
            if (cat.parentId && categoryMap.has(cat.parentId)) {
                categoryMap.get(cat.parentId)!.children!.push(categoryMap.get(cat.id)!);
            } else {
                tree.push(categoryMap.get(cat.id)!);
            }
        });

        return tree;
    };

    // ✅ FIX: Handle Multiple Checkbox Selection
    const handleToggle = (categoryId: string) => {
        let newSelection = [...currentCategoryIds];
        
        if (newSelection.includes(categoryId)) {
            // Remove if already selected
            newSelection = newSelection.filter(id => id !== categoryId);
        } else {
            // Add if not selected
            newSelection.push(categoryId);
        }
        
        setValue("categoryIds", newSelection, { shouldDirty: true });
    };

    // Add New Category (Temp)
    const addCategory = () => {
        if(!input.trim()) return;
        
        const newCat: CategoryNode = { 
            id: `temp_${Date.now()}`, 
            name: input.trim(),
            slug: input.trim().toLowerCase().replace(/\s+/g, '-'),
            parentId: null,
            children: []
        };
        
        // Add to UI tree instantly
        setDbCategories([newCat, ...dbCategories]);
        
        // Auto select the new category
        setValue("categoryIds", [...currentCategoryIds, newCat.id], { shouldDirty: true });
        
        setInput("");
    };

    // 🌳 Recursive Component to render Tree
    const CategoryTreeList = ({ categories, level = 0 }: { categories: CategoryNode[], level?: number }) => {
        return (
            <ul className={`space-y-1.5 ${level > 0 ? "ml-[18px] mt-1.5" : ""}`}>
                {categories.map(cat => (
                    <li key={cat.id}>
                        <label className="flex items-start gap-[6px] select-none text-[13px] text-[#3c434a] cursor-pointer hover:text-[#2271b1]">
                            <input 
                                type="checkbox" 
                                checked={currentCategoryIds.includes(cat.id)} 
                                onChange={() => handleToggle(cat.id)}
                                className="mt-[2px] w-[14px] h-[14px] text-[#2271b1] border-[#8c8f94] rounded-[2px] focus:ring-[#2271b1]"
                            />
                            <span className="leading-tight">{cat.name}</span>
                        </label>
                        
                        {/* Recursive Call for Children */}
                        {cat.children && cat.children.length > 0 && (
                            <CategoryTreeList categories={cat.children} level={level + 1} />
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="bg-white border border-[#c3c4c7] shadow-sm rounded-[3px]">
            {/* Header */}
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex justify-between items-center px-3 py-2 border-b border-[#f0f0f1] bg-white cursor-pointer select-none"
            >
                <span className="font-semibold text-[14px] text-[#1d2327]">Product categories</span>
                {isExpanded ? <ChevronUp size={16} className="text-[#8c8f94]" /> : <ChevronDown size={16} className="text-[#8c8f94]" />}
            </div>
            
            {/* Content */}
            {isExpanded && (
                <div className="p-3 bg-[#fdfdfd]">
                    {/* Category List (Tree View) */}
                    <div className="max-h-[250px] overflow-y-auto border border-[#c3c4c7] p-[12px] bg-white mb-3 rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] custom-scrollbar">
                        {dbCategories.length === 0 ? (
                            <p className="text-[12px] text-[#8c8f94] italic m-0">No categories found.</p>
                        ) : (
                            <CategoryTreeList categories={dbCategories} />
                        )}
                    </div>

                    {/* Add New Category Input */}
                    <div className="mt-2 pt-2 border-t border-[#f0f0f1]">
                        <label className="text-[12px] text-[#2271b1] hover:underline cursor-pointer mb-2 block font-medium">+ Add new category</label>
                        <div className="flex gap-2">
                            <input 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="New category name" 
                                className="flex-1 border border-[#8c8f94] px-2 py-1 text-[13px] outline-none focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] rounded-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)]"
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                            />
                            <button 
                                type="button" 
                                onClick={addCategory} 
                                className="px-3 py-1 bg-[#f6f7f7] border border-[#8c8f94] text-[#2c3338] text-[13px] hover:bg-[#f0f0f1] hover:text-[#1d2327] rounded-[3px] transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}