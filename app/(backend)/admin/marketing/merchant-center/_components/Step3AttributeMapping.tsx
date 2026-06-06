//File Path: app/(backend)/admin/marketing/merchant-center/_components/Step3AttributeMapping.tsx

"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { getStoreMappingData, saveGmcMapping, searchGoogleCategories } from "@/app/actions/backend/merchant-center/gmc-mapping.actions";

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

  // 🚀 Google Category Auto-complete Search Handler
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
      if (!result.success) setErrorMsg(result.error || "Failed.");
    });
  };

  if (isLoading) return <div className="p-10 text-center text-[#646970]">Loading Advanced Mapping Data...</div>;

  // 🚀 Multi-Select Attribute Component with VALUE PREVIEW
  const MultiAttributeSelect = ({ section, field, label }: { section: string, field: string, label: string }) => {
    // Array of selected slugs (e.g. ["attr_frame-color", "attr_t-shirt-color"])
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
      <tr>
        <th className="py-4 px-4 align-top w-[250px] text-[13px] font-semibold text-[#1d2327] border-b border-[#f0f0f1]">
          {label}
        </th>
        <td className="py-4 px-4 border-b border-[#f0f0f1]">
          {/* Selected Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedValues.map(val => {
              const attrDetails = storeAttributes.find(a => `attr_${a.slug}` === val);
              const displayName = attrDetails ? attrDetails.name : val.replace("attr_", "");
              
              return (
                <div key={val} className="bg-[#f0f6ea] border border-[#c6e1c6] text-[#00a32a] px-2 py-1 rounded-[3px] text-[12px] flex items-center gap-2">
                  <span className="font-semibold">{displayName}</span>
                  <button onClick={() => handleRemove(val)} className="text-[#d63638] hover:text-[#b32d2e] font-bold">×</button>
                </div>
              );
            })}
          </div>

          {/* Dropdown to add more */}
          <select
            onChange={(e) => { handleAdd(e.target.value); e.target.value = ""; }}
            className="w-full max-w-[300px] border border-[#8c8f94] rounded-[3px] px-2 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:outline-none"
          >
            <option value="">+ Add mapping attribute...</option>
            {storeAttributes.filter(a => !selectedValues.includes(`attr_${a.slug}`)).map(attr => (
              <option key={attr.slug} value={`attr_${attr.slug}`}>{attr.name}</option>
            ))}
          </select>

          {/* 🚀 LIVE VALUE PREVIEW */}
          {selectedValues.length > 0 && (
            <div className="mt-3 bg-[#f6f7f7] p-2 border border-[#ccd0d4] rounded-[3px] text-[11px] text-[#50575e]">
              <strong>Values mapped to Google:</strong>
              <ul className="list-disc ml-4 mt-1">
                {selectedValues.map(val => {
                  const attrDetails = storeAttributes.find(a => `attr_${a.slug}` === val);
                  if (!attrDetails) return null;
                  return (
                    <li key={val}>
                      {attrDetails.name}: <span className="italic">{attrDetails.values.slice(0, 5).join(", ")} {attrDetails.values.length > 5 ? "..." : ""}</span>
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
    <div className="p-0">
      {/* Tabs */}
      <div className="flex border-b border-[#ccd0d4] bg-[#f6f7f7] px-6 pt-4">
        <button onClick={() => setActiveTab("categories")} className={`px-4 py-2 text-[13px] font-semibold border border-b-0 rounded-t-[3px] mr-1 ${activeTab === "categories" ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px]" : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96]"}`}>Category Mapping</button>
        <button onClick={() => setActiveTab("attributes")} className={`px-4 py-2 text-[13px] font-semibold border border-b-0 rounded-t-[3px] mr-1 ${activeTab === "attributes" ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px]" : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96]"}`}>Product Attributes</button>
        <button onClick={() => setActiveTab("customLabels")} className={`px-4 py-2 text-[13px] font-semibold border border-b-0 rounded-t-[3px] ${activeTab === "customLabels" ? "bg-white border-[#ccd0d4] text-[#1d2327] relative top-[1px]" : "bg-transparent border-transparent text-[#2271b1] hover:text-[#135e96]"}`}>Custom Labels (Ads)</button>
      </div>

      <div className="p-6">
        {errorMsg && <div className="bg-[#fcf0f1] border-l-4 border-[#d63638] p-3 mb-5 text-[13px] text-[#d63638]">{errorMsg}</div>}

        {/* 🚀 TAB 1: CATEGORY MAPPING WITH AUTOCOMPLETE */}
        {activeTab === "categories" && (
          <div>
            <p className="text-[13px] text-[#646970] mb-4">Search and select the official Google category that matches your store category.</p>
            <div className="bg-white border border-[#ccd0d4] max-h-[500px] overflow-y-visible pb-32">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f9f9f9] border-b border-[#ccd0d4]">
                  <tr>
                    <th className="py-2 px-4 text-[13px] font-semibold text-[#1d2327]">Store Category</th>
                    <th className="py-2 px-4 text-[13px] font-semibold text-[#1d2327]">Google Category (Search)</th>
                  </tr>
                </thead>
                <tbody>
                  {storeCategories.map(cat => (
                    <tr key={cat.id}>
                      <td className="py-3 px-4 text-[13px] font-semibold text-[#2271b1] border-b border-[#f0f0f1] w-1/3">{cat.name}</td>
                      <td className="py-3 px-4 border-b border-[#f0f0f1] relative">
                        <input
                          type="text"
                          value={catMapping[cat.id] || ""}
                          onChange={(e) => handleCategorySearch(cat.id, e.target.value)}
                          onFocus={() => setActiveSearchRow(cat.id)}
                          placeholder="Type to search (e.g. Bikes)"
                          className="w-full border border-[#8c8f94] rounded-[3px] px-3 py-1.5 text-[13px] focus:border-[#2271b1] focus:ring-1 focus:outline-none"
                        />
                        {/* Auto-complete Dropdown */}
                        {activeSearchRow === cat.id && googleCatResults.length > 0 && (
                          <ul className="absolute z-50 left-4 right-4 top-[45px] bg-white border border-[#ccd0d4] shadow-lg max-h-[200px] overflow-y-auto">
                            {googleCatResults.map((res, i) => (
                              <li 
                                key={i} 
                                onClick={() => selectGoogleCategory(cat.id, res)}
                                className="px-3 py-2 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-b-0"
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

        {/* 🚀 TAB 2: ATTRIBUTE MAPPING WITH MULTI-SELECT & PREVIEW */}
        {activeTab === "attributes" && (
          <div className="bg-white border border-[#ccd0d4]">
            <table className="w-full text-left border-collapse">
              <tbody>
                <MultiAttributeSelect section="attributes" field="color" label="Color" />
                <MultiAttributeSelect section="attributes" field="size" label="Size" />
                <MultiAttributeSelect section="attributes" field="material" label="Material" />
                <MultiAttributeSelect section="attributes" field="gender" label="Gender" />
                <MultiAttributeSelect section="attributes" field="ageGroup" label="Age Group" />
              </tbody>
            </table>
          </div>
        )}

        {/* 🚀 TAB 3: CUSTOM LABELS */}
        {activeTab === "customLabels" && (
          <div className="bg-white border border-[#ccd0d4]">
            <table className="w-full text-left border-collapse">
              <tbody>
                <MultiAttributeSelect section="customLabels" field="customLabel0" label="Custom Label 0 (Ads)" />
                <MultiAttributeSelect section="customLabels" field="customLabel1" label="Custom Label 1" />
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-[#ccd0d4] text-right">
          <button onClick={handleComplete} disabled={isPending} className="bg-[#2271b1] text-white px-6 py-2 text-[13px] font-semibold shadow-sm">
            {isPending ? "Saving configuration..." : "Save & Complete Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}