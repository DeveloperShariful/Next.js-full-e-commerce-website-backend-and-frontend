//app/admin/products/create/_components/GoogleShopping.tsx

"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "../schema";
import { searchGoogleCategories } from "@/app/actions/backend/merchant-center/gmc-mapping.actions"; // 🚀 গুগল ক্যাটাগরি সার্চ অ্যাকশন ইম্পোর্ট

export default function GoogleShopping() {
  const { register, setValue, watch } = useFormContext<ProductFormValues>();
  
  // Autocomplete States
  const [isPending, startTransition] = useTransition();
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // গুগল ক্যাটাগরি ভ্যালু ওয়াচ করা
  const googleProductCategoryValue = watch("googleProductCategory") || "";

  // 🚀 বাইরের যেকোনো জায়গায় ক্লিক করলে ড্রপডাউন বন্ধ করার লজিক
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🚀 ক্যাটাগরি টাইপ করার সময় এপিআই সার্চ হ্যান্ডলার
  const handleCategoryChange = (val: string) => {
    setValue("googleProductCategory", val, { shouldDirty: true });
    setShowDropdown(true);

    if (val.trim().length > 2) {
      startTransition(async () => {
        const res = await searchGoogleCategories(val);
        if (res.success && res.data) {
          setSearchResults(res.data);
        } else {
          setSearchResults([]);
        }
      });
    } else {
      setSearchResults([]);
    }
  };

  const labelClass = "w-full md:w-[200px] text-[13px] font-semibold text-[#1d2327] py-2 md:py-0 shrink-0";
  const inputClass = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-[3px] transition-shadow";
  const selectClass = "w-full md:max-w-[400px] px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:outline-none rounded-[3px] cursor-pointer";
  const formRowClass = "flex flex-col md:flex-row md:items-center py-4 border-b border-[#f0f0f1] last:border-b-0";

  return (
    <div className="p-2 space-y-1 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="pb-3 border-b border-[#c3c4c7] mb-4">
        <h4 className="text-[14px] font-semibold text-[#1d2327] m-0">Product Google Attributes</h4>
        <p className="text-[11px] text-[#646970] m-0 mt-1">Configure advanced settings for Google Merchant Center feed synchronization.</p>
      </div>

      {/* MPN */}
      <div className={formRowClass}>
        <label className={labelClass}>Manufacturer Part Number (MPN)</label>
        <input type="text" placeholder="e.g. MPN-123456" {...register("mpn")} className={inputClass} />
      </div>

      {/* Brand */}
      <div className={formRowClass}>
        <label className={labelClass}>Brand (Vendor)</label>
        <input type="text" placeholder="e.g. GoBike" {...register("vendor")} className={inputClass} />
      </div>

      {/* Condition */}
      <div className={formRowClass}>
        <label className={labelClass}>Condition</label>
        <select {...register("condition")} className={selectClass}>
          <option value="NEW">New</option>
          <option value="REFURBISHED">Refurbished</option>
          <option value="USED">Used</option>
        </select>
      </div>

      {/* Gender */}
      <div className={formRowClass}>
        <label className={labelClass}>Gender</label>
        <select {...register("gender")} className={selectClass}>
          <option value="">Default (Unspecified)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>

      {/* Age Group */}
      <div className={formRowClass}>
        <label className={labelClass}>Age Group</label>
        <select {...register("ageGroup")} className={selectClass}>
          <option value="">Default (Unspecified)</option>
          <option value="adult">Adult</option>
          <option value="teen">Teen</option>
          <option value="kids">Kids</option>
          <option value="toddler">Toddler</option>
          <option value="infant">Infant</option>
          <option value="newborn">Newborn</option>
        </select>
      </div>

      {/* 🚀 NEW: Google Product Category (With Autocomplete Dropdown) */}
      <div className={`${formRowClass} relative`} ref={dropdownRef}>
        <label className={labelClass}>Google Product Category</label>
        <div className="w-full md:max-w-[400px] relative">
          <input 
            type="text" 
            value={googleProductCategoryValue}
            onChange={(e) => handleCategoryChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type to search Google taxonomy (e.g. Bikes)" 
            className="w-full px-3 py-1.5 bg-white border border-[#ccd0d4] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none rounded-[3px]" 
          />
          {showDropdown && searchResults.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#ccd0d4] shadow-lg max-h-[200px] overflow-y-auto rounded-[3px] list-none p-0 m-0">
              {searchResults.map((cat, i) => (
                <li 
                  key={i} 
                  onClick={() => {
                    setValue("googleProductCategory", cat, { shouldDirty: true });
                    setShowDropdown(false);
                  }}
                  className="px-3 py-2 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-b-0 text-[#2c3338]"
                >
                  {cat}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Google Title Override */}
      <div className={formRowClass}>
        <label className={labelClass}>Google Title (SEO)</label>
        <input type="text" placeholder="Title used only in Google Shopping feed" {...register("googleTitle")} className={inputClass} />
      </div>

      {/* Google Description Override */}
      <div className={formRowClass}>
        <label className={labelClass}>Google Description (SEO)</label>
        <textarea placeholder="Description used only in Google Shopping feed" {...register("googleDescription")} rows={3} className={`${inputClass} resize-y py-2`} />
      </div>

      {/* Is Bundle? */}
      <div className={formRowClass}>
        <label className={labelClass}>Is Bundle?</label>
        <select {...register("googleIsBundle")} className={selectClass}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>

      {/* Size */}
      <div className={formRowClass}>
        <label className={labelClass}>Size</label>
        <input type="text" placeholder="e.g. XL, 16 Inch" {...register("google_size")} className={inputClass} />
      </div>

      {/* Size System */}
      <div className={formRowClass}>
        <label className={labelClass}>Size system</label>
        <select {...register("google_size_system")} className={selectClass}>
          <option value="">Default</option>
          <option value="US">US</option>
          <option value="UK">UK</option>
          <option value="EU">EU</option>
          <option value="AU">AU</option>
          <option value="JP">JP</option>
        </select>
      </div>

      {/* Size Type */}
      <div className={formRowClass}>
        <label className={labelClass}>Size type</label>
        <select {...register("google_size_type")} className={selectClass}>
          <option value="">Default</option>
          <option value="regular">Regular</option>
          <option value="petite">Petite</option>
          <option value="plus">Plus</option>
          <option value="tall">Tall</option>
          <option value="maternity">Maternity</option>
        </select>
      </div>

      {/* Color */}
      <div className={formRowClass}>
        <label className={labelClass}>Color</label>
        <input type="text" placeholder="e.g. Red, Matte Black" {...register("google_color")} className={inputClass} />
      </div>

      {/* Material */}
      <div className={formRowClass}>
        <label className={labelClass}>Material</label>
        <input type="text" placeholder="e.g. Carbon Fiber, Aluminum" {...register("google_material")} className={inputClass} />
      </div>

      {/* Pattern */}
      <div className={formRowClass}>
        <label className={labelClass}>Pattern</label>
        <input type="text" placeholder="e.g. Striped, Solid" {...register("google_pattern")} className={inputClass} />
      </div>

      {/* Multipack */}
      <div className={formRowClass}>
        <label className={labelClass}>Multipack</label>
        <input type="text" placeholder="e.g. 1, 2, 6" {...register("google_multipack")} className={inputClass} />
      </div>

      {/* Adult Content */}
      <div className={formRowClass}>
        <label className={labelClass}>Adult Content</label>
        <select {...register("google_adult_content")} className={selectClass}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>

      {/* Availability Date */}
      <div className={formRowClass}>
        <label className={labelClass}>Availability Date</label>
        <input type="datetime-local" {...register("google_availability_date")} className={inputClass} />
      </div>

    </div>
  );
}