//File Path: app/(backend)/admin/marketing/merchant-center/_components/Step3AttributeMapping.tsx

"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { getStoreMappingData, saveGmcMapping, searchGoogleCategories } from "@/app/actions/backend/marketing/gmc-mapping.actions";

export default function Step3AttributeMapping() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"categories" | "attributes" | "customLabels">("categories");

  // Store Data
  const [storeCategories, setStoreCategories] = useState<any[]>([]);
  const [storeAttributes, setStoreAttributes] = useState<any[]>([]);
  
  // Mapping States
  const [catMapping, setCatMapping] = useState<Record<string, string>>({});
  const [attrMapping, setAttrMapping] = useState<any>({});
  
  // Autocomplete States
  const [googleCatResults, setGoogleCatResults] = useState<string[]>([]);
  const [activeSearchRow, setActiveSearchRow] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const result = await getStoreMappingData();
      if (result.success && result.data) {
        setStoreCategories(result.data.categories);
        setStoreAttributes(result.data.attributes);
        setAttrMapping(result.data.savedMapping);
        
        const initialCatMap: Record<string, string> = {};
        result.data.categories.forEach((cat: any) => {
          initialCatMap[cat.id] = cat.googleCategoryName || "";
        });
        setCatMapping(initialCatMap);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Outside click handler to close category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveSearchRow(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Google Category Auto-complete Search Handler
  const handleCategorySearch = async (categoryId: string, query: string) => {
    setCatMapping({ ...catMapping, [categoryId]: query });
    setActiveSearchRow(categoryId);
    
    if (query.length > 2) {
      const res = await searchGoogleCategories(query);
      if (res.success) setGoogleCatResults(res.data);
    } else {
      setGoogleCatResults([]);
    }
  };

  const selectGoogleCategory = (categoryId: string, googleCat: string) => {
    setCatMapping({ ...catMapping, [categoryId]: googleCat });
    setActiveSearchRow(null);
  };

  const handleComplete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const categoryPayload = Object.keys(catMapping)
        .map((id) => ({ categoryId: id, googleCategory: catMapping[id] }))
        .filter(c => c.googleCategory !== "");

      const result = await saveGmcMapping(categoryPayload, attrMapping);
      if (!result.success) setErrorMsg(result.error || "Failed to save mapping.");
    });
  };

  if (isLoading) return <div className="p-10 text-center text-[13px] text-[#646970]">Loading Advanced Mapping Data...</div>;

  // 🚀 WP Admin Style: RESPONSIVE Multi-Select Attribute Component
  const MultiAttributeSelect = ({ section, field, label }: { section: string, field: string, label: string }) => {
    const selectedValues: string[] = attrMapping[section]?.[field] || [];

    const handleAdd = (val: string) => {
      if (!val || selectedValues.includes(val)) return;
      setAttrMapping({
        ...attrMapping,
        [section]: { ...attrMapping[section], [field]: [...selectedValues, val] }
      });
    };

    const handleRemove = (val: string) => {
      setAttrMapping({
        ...attrMapping,
        [section]: { ...attrMapping[section], [field]: selectedValues.filter(v => v !== val) }
      });
    };

    return (
      // 🚀 Changed to flex-col on mobile, table-row on desktop
      <tr className="flex flex-col md:table-row hover:bg-[#fcfcfc] transition-colors border-b border-[#f0f0f1] last:border-b-0 py-3 md:py-0">
        <th className="block md:table-cell py-2 md:py-4 px-4 md:px-5 align-top w-full md:w-[250px] text-[13px] font-semibold text-[#1d2327]">
          {label}
        </th>
        <td className="block md:table-cell py-2 md:py-4 px-4 md:px-5 w-full">
          {/* Mapped Badges with Premium Style */}
          <div className="flex flex-wrap gap-2 mb-2.5">
            {selectedValues.map(val => {
              const attrDetails = storeAttributes.find(a => `attr_${a.slug}` === val);
              const displayName = attrDetails ? attrDetails.name : val.replace("attr_", "");
              
              return (
                <div key={val} className="bg-[#f0f6ea] border border-[#bce3c6] text-[#137333] px-2.5 py-1 rounded-[3px] text-[11px] flex items-center gap-2 font-medium shadow-sm">
                  <span>{displayName}</span>
                  <button onClick={() => handleRemove(val)} className="text-[#d63638] hover:text-[#b32d2e] font-bold text-[13px] bg-transparent border-none cursor-pointer">×</button>
                </div>
              );
            })}
          </div>

          {/* Select Dropdown with WordPress style */}
          <select
            onChange={(e) => { handleAdd(e.target.value); e.target.value = ""; }}
            className="w-full md:max-w-[320px] bg-white border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none cursor-pointer"
          >
            <option value="">+ Add mapping attribute...</option>
            {storeAttributes.filter(a => !selectedValues.includes(`attr_${a.slug}`)).map(attr => (
              <option key={attr.slug} value={`attr_${attr.slug}`}>{attr.name}</option>
            ))}
          </select>

          {/* WP Notice Style Live Value Preview */}
          {selectedValues.length > 0 && (
            <div className="mt-3 bg-[#f6f7f7] p-3 border-l-4 border-[#2271b1] rounded-r-[3px] text-[11px] text-[#50575e] leading-relaxed shadow-sm">
              <strong>Values mapped to Google:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                {selectedValues.map(val => {
                  const attrDetails = storeAttributes.find(a => `attr_${a.slug}` === val);
                  if (!attrDetails) return null;
                  return (
                    <li key={val}>
                      {attrDetails.name}: <span className="italic font-medium text-[#2c3338]">{attrDetails.values.slice(0, 5).join(", ")} {attrDetails.values.length > 5 ? "..." : ""}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white border border-[#ccd0d4] rounded-[3px] shadow-sm overflow-hidden animate-in fade-in duration-300" ref={dropdownRef}>
      
      {/* WordPress Admin Style Flat Tabs */}
      <div className="flex border-b border-[#ccd0d4] bg-[#f6f7f7] px-4 pt-3 gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveTab("categories")} 
          className={`px-4 py-2 text-[13px] font-semibold border-t border-l border-r transition-colors duration-150 ${activeTab === "categories" ? "bg-white border-[#ccd0d4] text-[#1d2327] rounded-t-[3px] relative top-[1px] border-b-white" : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96] rounded-t-[3px]"}`}
        >
          Category Mapping
        </button>
        <button 
          onClick={() => setActiveTab("attributes")} 
          className={`px-4 py-2 text-[13px] font-semibold border-t border-l border-r transition-colors duration-150 ${activeTab === "attributes" ? "bg-white border-[#ccd0d4] text-[#1d2327] rounded-t-[3px] relative top-[1px] border-b-white" : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96]"}`}
        >
          Product Attributes
        </button>
        <button 
          onClick={() => setActiveTab("customLabels")} 
          className={`px-4 py-2 text-[13px] font-semibold border-t border-l border-r transition-colors duration-150 ${activeTab === "customLabels" ? "bg-white border-[#ccd0d4] text-[#1d2327] rounded-t-[3px] relative top-[1px] border-b-white" : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96]"}`}
        >
          Custom Labels (Ads)
        </button>
      </div>

      <div className="p-4 sm:p-6">
        {errorMsg && <div className="bg-[#fcf0f1] border-l-4 border-[#d63638] p-3 mb-5 text-[13px] text-[#d63638] font-medium">{errorMsg}</div>}

        {/* 🚀 TAB 1: CATEGORY MAPPING WITH RESPONSIVE WP LIST TABLE */}
        {activeTab === "categories" && (
          <div>
            <p className="text-[13px] text-[#646970] mb-4">Search and select the official Google category that matches your store category.</p>
            <div className="border border-[#ccd0d4] rounded-[3px] overflow-hidden max-h-[500px] overflow-y-auto pb-32">
              <table className="block md:table w-full text-left border-collapse text-[13px]">
                <thead className="hidden md:table-header-group bg-[#f9f9f9] border-b border-[#ccd0d4] text-[#1d2327] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Store Category</th>
                    <th className="py-2.5 px-4">Google Category (Search)</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group divide-y divide-[#f0f0f0]">
                  {storeCategories.map(cat => (
                    <tr key={cat.id} className="flex flex-col md:table-row hover:bg-[#fcfcfc] transition-colors py-3 md:py-0">
                      <td className="block md:table-cell py-1.5 md:py-3 px-4 font-semibold text-[#2271b1] w-full md:w-1/3">{cat.name}</td>
                      <td className="block md:table-cell py-1.5 md:py-3 px-4 relative w-full">
                        <input
                          type="text"
                          value={catMapping[cat.id] || ""}
                          onChange={(e) => handleCategorySearch(cat.id, e.target.value)}
                          onFocus={() => setActiveSearchRow(cat.id)}
                          placeholder="Type to search official Google taxonomy (e.g. Bikes)"
                          className="w-full border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] focus:outline-none transition-shadow"
                        />
                        {/* Auto-complete Floating Dropdown */}
                        {activeSearchRow === cat.id && googleCatResults.length > 0 && (
                          <ul className="absolute z-50 left-4 right-4 mt-1 bg-white border border-[#ccd0d4] shadow-md max-h-[200px] overflow-y-auto rounded-[3px] list-none p-0 m-0">
                            {googleCatResults.map((res, i) => (
                              <li 
                                key={i} 
                                onClick={() => selectGoogleCategory(cat.id, res)}
                                className="px-3 py-2 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-b-0 text-[#2c3338]"
                              >
                                {res}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🚀 TAB 2 & 3: ATTRIBUTES AND CUSTOM LABELS */}
        {activeTab === "attributes" && (
          <div className="border border-[#ccd0d4] rounded-[3px] overflow-hidden">
            <table className="block md:table w-full text-left border-collapse text-[13px]">
              <tbody className="block md:table-row-group">
                <MultiAttributeSelect section="attributes" field="color" label="Color" />
                <MultiAttributeSelect section="attributes" field="size" label="Size" />
                <MultiAttributeSelect section="attributes" field="material" label="Material" />
                <MultiAttributeSelect section="attributes" field="gender" label="Gender" />
                <MultiAttributeSelect section="attributes" field="ageGroup" label="Age Group" />
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "customLabels" && (
          <div className="border border-[#ccd0d4] rounded-[3px] overflow-hidden">
            <table className="block md:table w-full text-left border-collapse text-[13px]">
              <tbody className="block md:table-row-group">
                <MultiAttributeSelect section="customLabels" field="customLabel0" label="Custom Label 0 (Ads)" />
                <MultiAttributeSelect section="customLabels" field="customLabel1" label="Custom Label 1" />
              </tbody>
            </table>
          </div>
        )}

        {/* Submit Actions */}
        <div className="mt-6 pt-5 border-t border-[#ccd0d4] text-right">
          <button 
            onClick={handleComplete} 
            disabled={isPending} 
            className="w-full sm:w-auto bg-[#2271b1] hover:bg-[#135e96] border border-[#2271b1] text-white px-5 py-2 text-[13px] font-semibold rounded-[3px] cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving configuration..." : "Save & Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}