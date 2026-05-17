// File Location: app/admin/coupons/create/_components/tab-usage-restriction.tsx

"use client";

import { useState } from "react";
import { HelpCircle, Loader2, X, Package } from "lucide-react";
import { CouponFormType } from "../../types";
import { searchProductsForCoupon, searchCategoriesForCoupon } from "@/app/actions/backend/coupon/search-resources";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface TabUsageRestrictionProps {
  formData: CouponFormType;
  updateField: (field: keyof CouponFormType, value: any) => void;
}

export const TabUsageRestriction = ({ formData, updateField }: TabUsageRestrictionProps) => {
  const { formatPrice } = useGlobalStore();
  
  // --- States for Dynamic Multi-Select Search ---
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);

  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryResults, setCategoryResults] = useState<any[]>([]);
  const [searchingCategory, setSearchingCategory] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<{id: string, name: string}[]>([]);

  const TooltipHelp = ({ text }: { text: string }) => (
    <span className="text-[#a7aaad] hover:text-[#3c434a] cursor-help shrink-0" title={text}>
        <HelpCircle size={14} />
    </span>
  );

  // --- Handlers for Dynamic Product Search ---
  const handleProductSearch = async (val: string) => {
      setProductQuery(val);
      if (val.length > 2) {
          setSearchingProduct(true);
          const res = await searchProductsForCoupon(val);
          setProductResults(res);
          setSearchingProduct(false);
      } else {
          setProductResults([]);
      }
  };

  const addProduct = (prod: any) => {
      if (!formData.productIds.includes(prod.id)) {
          updateField("productIds", [...formData.productIds, prod.id]);
          setSelectedProducts([...selectedProducts, prod]);
      }
      setProductQuery("");
      setProductResults([]);
  };

  const removeProduct = (id: string) => {
      updateField("productIds", formData.productIds.filter(pid => pid !== id));
      setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  // --- Handlers for Dynamic Category Search ---
  const handleCategorySearch = async (val: string) => {
      setCategoryQuery(val);
      if (val.length > 2) {
          setSearchingCategory(true);
          const res = await searchCategoriesForCoupon(val);
          setCategoryResults(res);
          setSearchingCategory(false);
      } else {
          setCategoryResults([]);
      }
  };

  const addCategory = (cat: {id: string, name: string}) => {
      if (!formData.categoryIds.includes(cat.id)) {
          updateField("categoryIds", [...formData.categoryIds, cat.id]);
          setSelectedCategories([...selectedCategories, cat]);
      }
      setCategoryQuery("");
      setCategoryResults([]);
  };

  const removeCategory = (id: string) => {
      updateField("categoryIds", formData.categoryIds.filter(cid => cid !== id));
      setSelectedCategories(selectedCategories.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Minimum spend</label>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="number" 
                    value={formData.minSpend}
                    onChange={(e) => updateField("minSpend", parseFloat(e.target.value) || "")}
                    placeholder="No minimum"
                    className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1]"
                />
                <TooltipHelp text="Minimum subtotal needed to use this coupon." />
            </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Maximum spend</label>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="number" 
                    value={formData.maxSpend}
                    onChange={(e) => updateField("maxSpend", parseFloat(e.target.value) || "")}
                    placeholder="No maximum"
                    className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1]"
                />
                <TooltipHelp text="Maximum subtotal allowed when using this coupon." />
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338] mt-1">Individual use only</label>
            <div className="flex-1 flex items-start gap-2">
                <input 
                    type="checkbox" 
                    checked={formData.individualUse}
                    onChange={(e) => updateField("individualUse", e.target.checked)}
                    className="h-[16px] w-[16px] mt-0.5 border-[#8c8f94] rounded-[3px] cursor-pointer"
                />
                <span className="text-[#646970] leading-snug">Check this box if the coupon cannot be used in conjunction with other coupons.</span>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pb-6 border-b border-[#f0f0f1] relative">
            <div className="absolute bottom-[-10px] left-[50%] bg-white px-2 text-[#a7aaad] font-bold text-[10px]">AND</div>
            
            <label className="sm:w-[160px] font-medium text-[#2c3338] mt-1">Exclude sale items</label>
            <div className="flex-1 flex items-start gap-2">
                <input 
                    type="checkbox" 
                    checked={formData.excludeSaleItems}
                    onChange={(e) => updateField("excludeSaleItems", e.target.checked)}
                    className="h-[16px] w-[16px] mt-0.5 border-[#8c8f94] rounded-[3px] cursor-pointer"
                />
                <span className="text-[#646970] leading-snug">Check this box if the coupon should not apply to items on sale.</span>
            </div>
        </div>

        {/* ========================================== */}
        {/* DYNAMIC PRODUCTS SEARCH (WITH IMAGE & PRICE)*/}
        {/* ========================================== */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <label className="sm:w-[160px] font-medium text-[#2c3338] mt-2">Products</label>
            <div className="flex-1 flex items-start gap-2">
                <div className="w-full max-w-[400px] border border-[#8c8f94] bg-white rounded-[3px] shadow-sm p-1.5 focus-within:border-[#2271b1] focus-within:ring-1 focus-within:ring-[#2271b1]">
                    
                    {/* Selected Product Tags */}
                    <div className="flex flex-wrap gap-1 mb-1">
                        {selectedProducts.map(p => (
                            <span key={p.id} className="bg-[#f0f0f1] border border-[#c3c4c7] text-[#3c434a] text-[12px] px-2 py-0.5 rounded-[3px] flex items-center gap-1">
                                {p.name} 
                                <button onClick={() => removeProduct(p.id)} className="text-[#a7aaad] hover:text-[#d63638]"><X size={12}/></button>
                            </span>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <input 
                            type="text" 
                            value={productQuery}
                            onChange={(e) => handleProductSearch(e.target.value)}
                            placeholder={selectedProducts.length === 0 ? "Search for a product..." : ""} 
                            className="w-full h-[24px] px-1 bg-transparent text-[13px] outline-none"
                        />
                        {searchingProduct && <Loader2 size={14} className="absolute right-2 top-1.5 animate-spin text-[#2271b1]" />}
                        
                        {/* ✅ FIXED: High-End Dropdown Suggestions with Image & Price */}
                        {productResults.length > 0 && (
                            <div className="absolute z-50 w-full bg-white border border-[#2271b1] shadow-lg max-h-60 overflow-y-auto mt-1 rounded-[3px]">
                                {productResults.map((p) => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => addProduct(p)}
                                        className="p-2 hover:bg-[#f0f6fc] cursor-pointer border-b border-[#f0f0f1] last:border-0 flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="h-8 w-8 shrink-0 bg-white border border-[#e2e4e7] rounded-[2px] flex items-center justify-center overflow-hidden">
                                            {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover"/> : <Package size={14} className="text-[#a7aaad]"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px] font-semibold text-[#1d2327] group-hover:text-[#135e96] truncate">{p.name}</div>
                                            {p.sku && <div className="text-[10px] text-[#646970] font-mono">SKU: {p.sku}</div>}
                                        </div>
                                        <div className="text-[12px] font-bold text-[#3c434a]">
                                            {formatPrice(p.price)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <TooltipHelp text="Products that the coupon will be applied to." />
            </div>
        </div>

        {/* ========================================== */}
        {/* DYNAMIC CATEGORIES SEARCH                  */}
        {/* ========================================== */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 pt-4">
            
            <label className="sm:w-[160px] font-medium text-[#2c3338] mt-2">Product categories</label>
            <div className="flex-1 flex items-start gap-2">
                <div className="w-full max-w-[400px] border border-[#8c8f94] bg-white rounded-[3px] shadow-sm p-1.5 focus-within:border-[#2271b1] focus-within:ring-1 focus-within:ring-[#2271b1]">
                    
                    <div className="flex flex-wrap gap-1 mb-1">
                        {selectedCategories.map(c => (
                            <span key={c.id} className="bg-[#f0f0f1] border border-[#c3c4c7] text-[#3c434a] text-[12px] px-2 py-0.5 rounded-[3px] flex items-center gap-1">
                                {c.name} 
                                <button onClick={() => removeCategory(c.id)} className="text-[#a7aaad] hover:text-[#d63638]"><X size={12}/></button>
                            </span>
                        ))}
                    </div>

                    <div className="relative">
                        <input 
                            type="text" 
                            value={categoryQuery}
                            onChange={(e) => handleCategorySearch(e.target.value)}
                            placeholder={selectedCategories.length === 0 ? "Any category..." : ""} 
                            className="w-full h-[24px] px-1 bg-transparent text-[13px] outline-none"
                        />
                        {searchingCategory && <Loader2 size={14} className="absolute right-2 top-1.5 animate-spin text-[#2271b1]" />}
                        
                        {categoryResults.length > 0 && (
                            <div className="absolute z-50 w-full bg-white border border-[#2271b1] shadow-lg max-h-40 overflow-y-auto mt-1 rounded-[3px]">
                                {categoryResults.map((c) => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => addCategory(c)}
                                        className="px-3 py-2 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0"
                                    >
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <TooltipHelp text="Product categories that the coupon will be applied to." />
            </div>
        </div>

        {/* Allowed Emails */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-2">
            <label className="sm:w-[160px] font-medium text-[#2c3338]">Allowed emails</label>
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="text" 
                    value={formData.allowedEmails}
                    onChange={(e) => updateField("allowedEmails", e.target.value)}
                    placeholder="No restrictions" 
                    className="w-full max-w-[400px] h-[30px] px-3 border border-[#8c8f94] bg-white rounded-[3px] outline-none shadow-sm focus:border-[#2271b1]"
                />
                <TooltipHelp text="List of allowed billing emails to check against when an order is placed. Separate email addresses with commas." />
            </div>
        </div>

    </div>
  );
};