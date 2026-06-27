//File Path: app/(backend)/admin/marketing/merchant-center/_components/Step3AttributeMapping.tsx

"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { getStoreMappingData, saveGmcMapping, searchGoogleCategories } from "@/app/actions/backend/marketing/gmc-mapping.actions";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface StoreCategory {
  id: string;
  name: string;
  googleCategoryName: string | null;
}

interface StoreAttribute {
  id: string;
  name: string;
  slug: string;
  values: string[];
}

interface AttributeMapping {
  attributes: Record<string, string[]>;
  customLabels: Record<string, string[]>;
}

const DEFAULT_MAPPING: AttributeMapping = {
  attributes: { color: [], size: [], material: [], gender: [], ageGroup: [] },
  customLabels: { customLabel0: [], customLabel1: [], customLabel2: [], customLabel3: [], customLabel4: [] },
};

// ─────────────────────────────────────────────────────────────
// MULTI-ATTRIBUTE SELECT — defined outside to prevent recreation
// ─────────────────────────────────────────────────────────────
interface MultiSelectProps {
  section: keyof AttributeMapping;
  field: string;
  label: string;
  description: string;
  icon: string;
  storeAttributes: StoreAttribute[];
  attrMapping: AttributeMapping;
  onChange: (section: keyof AttributeMapping, field: string, values: string[]) => void;
}

function MultiAttributeSelect({ section, field, label, description, icon, storeAttributes, attrMapping, onChange }: MultiSelectProps) {
  const selectedValues: string[] = attrMapping[section]?.[field] ?? [];

  const handleAdd = (val: string) => {
    if (!val || selectedValues.includes(val)) return;
    onChange(section, field, [...selectedValues, val]);
  };

  const handleRemove = (val: string) => {
    onChange(section, field, selectedValues.filter(v => v !== val));
  };

  const unmapped = storeAttributes.filter(a => !selectedValues.includes(`attr_${a.slug}`));

  return (
    <div className="border border-[#e5e7eb] rounded-xl p-4 sm:p-5 hover:border-[#2271b1] hover:shadow-sm transition-all bg-white">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-[13px] font-bold text-[#1d2327] m-0">{label}</h4>
              <p className="text-[11px] text-[#6b7280] mt-0.5">{description}</p>
            </div>
            {selectedValues.length > 0 && (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {selectedValues.length} mapped
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mapped badges */}
      {selectedValues.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedValues.map(val => {
            const attr = storeAttributes.find(a => `attr_${a.slug}` === val);
            const name = attr?.name ?? val.replace("attr_", "");
            const preview = attr?.values?.slice(0, 3).join(", ") ?? "";
            return (
              <div key={val} className="group flex items-center gap-1.5 bg-[#f0f6ea] border border-[#bce3c6] text-[#137333] px-2.5 py-1.5 rounded-lg text-[12px] font-medium shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span>{name}</span>
                {preview && <span className="text-[10px] opacity-60 hidden sm:inline">({preview}{attr && attr.values.length > 3 ? "…" : ""})</span>}
                <button
                  onClick={() => handleRemove(val)}
                  className="ml-0.5 text-[#d63638] hover:text-[#b32d2e] font-bold text-[14px] leading-none bg-transparent border-none cursor-pointer p-0 opacity-60 hover:opacity-100"
                  title={`Remove ${name}`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3 p-3 bg-[#fafafa] border border-dashed border-[#d1d5db] rounded-lg">
          <span className="text-[#9ca3af] text-[11px]">No attributes mapped yet. Select from your store attributes below.</span>
        </div>
      )}

      {/* Dropdown */}
      {unmapped.length > 0 ? (
        <select
          onChange={e => { handleAdd(e.target.value); e.target.value = ""; }}
          className="w-full sm:max-w-xs border border-[#d1d5db] rounded-lg px-3 py-2 text-[12px] text-[#374151] bg-white focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 focus:outline-none cursor-pointer"
        >
          <option value="">+ Add attribute mapping…</option>
          {unmapped.map(attr => (
            <option key={attr.slug} value={`attr_${attr.slug}`}>{attr.name} ({attr.values.length} values)</option>
          ))}
        </select>
      ) : (
        <p className="text-[11px] text-emerald-600 font-medium">✓ All available attributes mapped</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Step3AttributeMapping() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"categories" | "attributes" | "customLabels">("categories");

  const [storeCategories, setStoreCategories] = useState<StoreCategory[]>([]);
  const [storeAttributes, setStoreAttributes] = useState<StoreAttribute[]>([]);
  const [catMapping, setCatMapping] = useState<Record<string, string>>({});
  const [attrMapping, setAttrMapping] = useState<AttributeMapping>(DEFAULT_MAPPING);

  const [googleCatResults, setGoogleCatResults] = useState<string[]>([]);
  const [activeSearchRow, setActiveSearchRow] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const result = await getStoreMappingData();
      if (result.success && result.data) {
        setStoreCategories(result.data.categories as StoreCategory[]);
        setStoreAttributes(result.data.attributes as StoreAttribute[]);
        setAttrMapping((result.data.savedMapping as AttributeMapping) ?? DEFAULT_MAPPING);
        const initMap: Record<string, string> = {};
        (result.data.categories as StoreCategory[]).forEach(cat => {
          initMap[cat.id] = cat.googleCategoryName ?? "";
        });
        setCatMapping(initMap);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setActiveSearchRow(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCategorySearch = async (categoryId: string, query: string) => {
    setCatMapping(prev => ({ ...prev, [categoryId]: query }));
    setActiveSearchRow(categoryId);
    if (query.length > 1) {
      const res = await searchGoogleCategories(query);
      if (res.success) setGoogleCatResults(res.data);
    } else {
      setGoogleCatResults([]);
    }
  };

  const selectGoogleCategory = (categoryId: string, googleCat: string) => {
    setCatMapping(prev => ({ ...prev, [categoryId]: googleCat }));
    setActiveSearchRow(null);
    setGoogleCatResults([]);
  };

  const handleAttrChange = useCallback((section: keyof AttributeMapping, field: string, values: string[]) => {
    setAttrMapping(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: values },
    }));
  }, []);

  const handleSave = () => {
    setErrorMsg(null);
    setSaveSuccess(false);
    startTransition(async () => {
      const catPayload = Object.entries(catMapping)
        .map(([categoryId, googleCategory]) => ({ categoryId, googleCategory }))
        .filter(c => c.googleCategory.trim() !== "");
      const result = await saveGmcMapping(catPayload, attrMapping as unknown as import("@prisma/client").Prisma.InputJsonValue);
      if (result.success) setSaveSuccess(true);
      else setErrorMsg(result.error ?? "Failed to save mapping.");
    });
  };

  // Stats
  const mappedCatCount = Object.values(catMapping).filter(Boolean).length;
  const totalAttrMapped = Object.values(attrMapping.attributes).flat().length +
    Object.values(attrMapping.customLabels).flat().length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-[#2271b1] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] text-[#6b7280]">Loading attribute mapping data…</p>
      </div>
    );
  }

  const tabs = [
    { id: "categories" as const, label: "Category Mapping", icon: "🗂️", badge: `${mappedCatCount}/${storeCategories.length}` },
    { id: "attributes" as const, label: "Product Attributes", icon: "🎨", badge: `${Object.values(attrMapping.attributes).flat().length}` },
    { id: "customLabels" as const, label: "Custom Labels", icon: "🏷️", badge: `${Object.values(attrMapping.customLabels).flat().length}` },
  ];

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden" ref={dropdownRef}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-[#e5e7eb] px-5 py-4 bg-gradient-to-r from-[#f8fafc] to-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#1d2327] m-0">Attribute Mapping</h3>
            <p className="text-[12px] text-[#6b7280] mt-0.5 m-0">Map your store attributes to Google Shopping fields for accurate product listings.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-[11px] text-[#6b7280] m-0">Categories</p>
              <p className="text-[14px] font-bold text-[#2271b1] m-0">{mappedCatCount}/{storeCategories.length}</p>
            </div>
            <div className="w-px h-8 bg-[#e5e7eb]" />
            <div className="text-center">
              <p className="text-[11px] text-[#6b7280] m-0">Attributes</p>
              <p className="text-[14px] font-bold text-emerald-600 m-0">{totalAttrMapped}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Nav ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#e5e7eb] bg-[#f9fafb] px-4 gap-0 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap bg-transparent cursor-pointer ${
              activeTab === tab.id
                ? "border-[#2271b1] text-[#2271b1]"
                : "border-transparent text-[#6b7280] hover:text-[#1d2327] hover:border-[#d1d5db]"
            }`}
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="inline sm:hidden">{tab.label.split(" ")[0]}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.id ? "bg-[#2271b1] text-white" : "bg-[#e5e7eb] text-[#6b7280]"
            }`}>{tab.badge}</span>
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        {/* Notices */}
        {saveSuccess && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">✓</span>
            <p className="text-[13px] text-emerald-800 font-semibold m-0">Mapping saved successfully! Google will use these settings on the next product sync.</p>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">!</span>
            <p className="text-[13px] text-red-800 m-0">{errorMsg}</p>
          </div>
        )}

        {/* ── TAB 1: CATEGORY MAPPING ──────────────────────────────────── */}
        {activeTab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-[#6b7280] m-0">
                Search Google&apos;s official taxonomy and match each store category. This determines where your products appear in Google Shopping.
              </p>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {storeCategories.map(cat => {
                const isMapped = !!(catMapping[cat.id]);
                return (
                  <div key={cat.id} className={`rounded-xl border p-4 transition-all ${isMapped ? "border-emerald-200 bg-emerald-50/40" : "border-[#e5e7eb] bg-white hover:border-[#2271b1]"}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Store category name */}
                      <div className="flex items-center gap-2 sm:w-[200px] flex-shrink-0">
                        {isMapped ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">✓</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-[#e5e7eb] text-[#9ca3af] text-[10px] flex items-center justify-center flex-shrink-0">○</span>
                        )}
                        <span className="text-[13px] font-semibold text-[#1d2327] leading-tight">{cat.name}</span>
                      </div>

                      {/* Arrow */}
                      <span className="hidden sm:block text-[#d1d5db] text-lg">→</span>

                      {/* Google category search */}
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={catMapping[cat.id] ?? ""}
                          onChange={e => handleCategorySearch(cat.id, e.target.value)}
                          onFocus={() => { setActiveSearchRow(cat.id); if ((catMapping[cat.id] ?? "").length > 1) searchGoogleCategories(catMapping[cat.id] ?? "").then(r => r.success && setGoogleCatResults(r.data)); }}
                          placeholder="Type product name (e.g. electric bike, bicycle tyre)"
                          className={`w-full border rounded-lg px-3 py-2 text-[12px] text-[#374151] bg-white focus:ring-2 focus:ring-[#2271b1]/20 focus:outline-none transition-all ${
                            isMapped ? "border-emerald-300 focus:border-emerald-400" : "border-[#d1d5db] focus:border-[#2271b1]"
                          }`}
                        />
                        {/* Clear button */}
                        {catMapping[cat.id] && (
                          <button
                            onClick={() => setCatMapping(prev => ({ ...prev, [cat.id]: "" }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] bg-transparent border-none cursor-pointer p-0 text-lg leading-none"
                          >
                            ×
                          </button>
                        )}
                        {/* Autocomplete dropdown */}
                        {activeSearchRow === cat.id && googleCatResults.length > 0 && (
                          <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#e5e7eb] shadow-lg rounded-lg max-h-[200px] overflow-y-auto list-none p-1 m-0">
                            {googleCatResults.map((res, i) => (
                              <li
                                key={i}
                                onClick={() => selectGoogleCategory(cat.id, res)}
                                className="px-3 py-2 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer rounded-md text-[#374151] transition-colors"
                              >
                                {res}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {storeCategories.length === 0 && (
              <div className="text-center py-12 text-[#9ca3af]">
                <p className="text-[13px]">No active categories found in your store.</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PRODUCT ATTRIBUTES ────────────────────────────────── */}
        {activeTab === "attributes" && (
          <div className="space-y-4">
            <p className="text-[13px] text-[#6b7280] m-0 mb-4">
              Tell Google which of your store attributes represent Color, Size, Material, etc. These are required for Shopping ads approval.
            </p>
            <MultiAttributeSelect section="attributes" field="color" label="Color" description="Maps to Google's color attribute (required for apparel)" icon="🎨" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
            <MultiAttributeSelect section="attributes" field="size" label="Size" description="Maps to Google's size attribute (required for clothing, shoes)" icon="📐" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
            <MultiAttributeSelect section="attributes" field="material" label="Material" description="Maps to Google's material attribute" icon="🧵" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
            <MultiAttributeSelect section="attributes" field="gender" label="Gender" description="Maps to Google's gender attribute (Men / Women / Unisex)" icon="👤" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
            <MultiAttributeSelect section="attributes" field="ageGroup" label="Age Group" description="Maps to Google's age_group attribute (Adult / Kids)" icon="🧒" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
          </div>
        )}

        {/* ── TAB 3: CUSTOM LABELS ─────────────────────────────────────── */}
        {activeTab === "customLabels" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
              <span className="text-blue-500 text-lg flex-shrink-0">ℹ️</span>
              <div>
                <p className="text-[13px] font-semibold text-blue-800 m-0">What are Custom Labels?</p>
                <p className="text-[12px] text-blue-700 mt-0.5 m-0">Custom labels let you segment products in Google Ads campaigns (e.g. &quot;sale&quot;, &quot;seasonal&quot;, &quot;high-margin&quot;). They do not affect organic listings.</p>
              </div>
            </div>
            <MultiAttributeSelect section="customLabels" field="customLabel0" label="Custom Label 0" description="Primary segmentation label (e.g. 'Sale', 'Clearance')" icon="🏷️" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
            <MultiAttributeSelect section="customLabels" field="customLabel1" label="Custom Label 1" description="Secondary segmentation label (e.g. 'Seasonal', 'New Arrival')" icon="🏷️" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
            <MultiAttributeSelect section="customLabels" field="customLabel2" label="Custom Label 2" description="Campaign grouping (e.g. 'High Margin', 'Bestseller')" icon="🏷️" storeAttributes={storeAttributes} attrMapping={attrMapping} onChange={handleAttrChange} />
          </div>
        )}

        {/* ── Save Button ──────────────────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-[#e5e7eb] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] text-[#9ca3af] m-0">
            Changes apply on the next product sync. Existing synced products will be updated automatically.
          </p>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-shrink-0 inline-flex items-center gap-2 bg-[#2271b1] hover:bg-[#135e96] text-white px-6 py-2.5 text-[13px] font-semibold rounded-lg cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Mapping Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
