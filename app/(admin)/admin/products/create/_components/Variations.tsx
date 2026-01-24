// File: app/admin/products/create/_components/Variations.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { toast } from "react-hot-toast";
import { ChevronDown, ChevronUp, Trash2, Wand2, MapPin, Box, X, Plus, Settings2, Search, CheckSquare, Square, Filter } from "lucide-react"; 
import { getLocations } from "@/app/actions/admin/product/product-read";
import { ProductFormData, Variation } from "../types";
import { MediaSelectorModal } from "@/components/media/media-selector-modal";
import { useGlobalStore } from "@/app/providers/global-store-provider"; 
import Image from "next/image";

export default function Variations() {
    const { watch, setValue, control, register } = useFormContext<ProductFormData>();
    const attributes = watch("attributes") || [];
    const mainData = watch();
    
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "variations"
    });

    const variations = watch("variations"); 

    const { symbol } = useGlobalStore(); 
    const currency = symbol || "$";

    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
    const [managingStockIndex, setManagingStockIndex] = useState<number | null>(null);
    const [mediaModalIndex, setMediaModalIndex] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Bulk Edit States
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkPrice, setBulkPrice] = useState("");
    const [bulkStock, setBulkStock] = useState("");
    const [bulkSkuPrefix, setBulkSkuPrefix] = useState("");
    
    // New Bulk Fields for Weight & Dimensions
    const [bulkWeight, setBulkWeight] = useState("");
    const [bulkLength, setBulkLength] = useState("");
    const [bulkWidth, setBulkWidth] = useState("");
    const [bulkHeight, setBulkHeight] = useState("");
    
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkFilters, setBulkFilters] = useState<Record<string, string[]>>({});

    useEffect(() => {
        getLocations().then(res => {
            if(res.success && res.data) {
                setLocations(res.data as any);
            }
        });
    }, []);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const generateVariations = () => {
        const varAttrs = attributes.filter(a => a.variation && a.values.length > 0);
        
        if(varAttrs.length === 0) {
            toast.error("No attributes selected for variation.");
            return;
        }

        const confirmGen = window.confirm("This will merge new combinations with existing ones. Continue?");
        if (!confirmGen) return;

        const cartesian = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
        const arraysToCombine = varAttrs.map(a => a.values);
        const combinations = varAttrs.length === 1 ? arraysToCombine[0].map(v => [v]) : cartesian(...arraysToCombine);

        const newVariationsList: Variation[] = combinations.map((combo: string[], index: number) => {
            const attributesMap: Record<string, string> = {};
            varAttrs.forEach((attr, idx) => {
                attributesMap[attr.name] = combo[idx];
            });

            const existingVar = variations.find(v => {
                return Object.keys(attributesMap).every(key => v.attributes[key] === attributesMap[key]);
            });

            if (existingVar) return existingVar;

            return {
                id: `temp_gen_${Date.now()}_${index}`,
                name: combo.join(" / "),
                price: typeof mainData.price === 'number' ? mainData.price : 0,
                stock: 0,
                trackQuantity: true, 
                sku: `${mainData.sku || 'SKU'}-${index + 1}`,
                attributes: attributesMap,
                barcode: "",
                costPerItem: 0,
                weight: typeof mainData.weight === 'number' ? mainData.weight : 0,
                length: typeof mainData.length === 'number' ? mainData.length : 0,
                width: typeof mainData.width === 'number' ? mainData.width : 0,
                height: typeof mainData.height === 'number' ? mainData.height : 0,
                images: [],
                inventoryData: [],
                isPreOrder: false,
                preOrderReleaseDate: null
            };
        });

        setValue("variations", newVariationsList, { shouldDirty: true });
        toast.success(`Generated ${newVariationsList.length} variations.`);
    };

    const addVariation = () => {
        const varAttrs = attributes.filter(a => a.variation);
        const defaultAttrs: Record<string, string> = {};
        varAttrs.forEach(a => defaultAttrs[a.name] = "");

        append({
            id: `temp_${Date.now()}`,
            name: `Variation #${fields.length + 1}`,
            price: 0,
            stock: 0,
            trackQuantity: true,
            sku: "",
            attributes: defaultAttrs,
            barcode: "",
            costPerItem: 0,
            weight: 0, length: 0, width: 0, height: 0,
            images: [],
            inventoryData: [],
            isPreOrder: false,
            preOrderReleaseDate: null
        });
        setOpenIndex(fields.length);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === variations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(variations.map(v => v.id!));
        }
    };

    const toggleBulkFilter = (attrName: string, value: string) => {
        setBulkFilters(prev => {
            const currentValues = prev[attrName] || [];
            if (currentValues.includes(value)) {
                const newValues = currentValues.filter(v => v !== value);
                if (newValues.length === 0) {
                    const { [attrName]: _, ...rest } = prev;
                    return rest;
                }
                return { ...prev, [attrName]: newValues };
            } else {
                return { ...prev, [attrName]: [...currentValues, value] };
            }
        });
    };

    const bulkDelete = () => {
        if (selectedIds.length === 0) return toast.error("Select items to delete");
        if (confirm(`Delete ${selectedIds.length} variations?`)) {
            const newVars = variations.filter(v => !selectedIds.includes(v.id!));
            setValue("variations", newVars, { shouldDirty: true });
            setSelectedIds([]);
            toast.success("Deleted successfully");
        }
    };

    const applyBulk = () => {
        const priceVal = bulkPrice ? parseFloat(bulkPrice) : null;
        const stockVal = bulkStock ? parseInt(bulkStock) : null;
        const weightVal = bulkWeight ? parseFloat(bulkWeight) : null;
        const lenVal = bulkLength ? parseFloat(bulkLength) : null;
        const widVal = bulkWidth ? parseFloat(bulkWidth) : null;
        const hgtVal = bulkHeight ? parseFloat(bulkHeight) : null;
        
        let targetCount = 0;

        const newVars = variations.map(v => {
            let shouldUpdate = false;

            if (selectedIds.length > 0) {
                if (selectedIds.includes(v.id!)) shouldUpdate = true;
            } 
            else {
                const matchesFilter = Object.entries(bulkFilters).every(([key, selectedValues]) => {
                    if (!selectedValues || selectedValues.length === 0) return true;
                    return selectedValues.includes(v.attributes[key]);
                });

                if (matchesFilter && Object.keys(bulkFilters).length > 0) shouldUpdate = true;
            }

            if (shouldUpdate) {
                targetCount++;
                return {
                    ...v,
                    price: priceVal !== null ? priceVal : v.price,
                    stock: stockVal !== null ? stockVal : v.stock,
                    sku: bulkSkuPrefix ? `${bulkSkuPrefix}-${v.name}` : v.sku,
                    weight: weightVal !== null ? weightVal : v.weight,
                    length: lenVal !== null ? lenVal : v.length,
                    width: widVal !== null ? widVal : v.width,
                    height: hgtVal !== null ? hgtVal : v.height,
                    inventoryData: stockVal !== null ? [] : v.inventoryData
                };
            }
            return v;
        });

        if (targetCount === 0) {
            toast.error("No variations matched your criteria.");
            return;
        }

        setValue("variations", newVars, { shouldDirty: true });
        toast.success(`Updated ${targetCount} variations!`);
        setBulkMode(false);
        setSelectedIds([]);
        setBulkFilters({});
        
        // Reset Inputs
        setBulkPrice(""); setBulkStock(""); setBulkSkuPrefix("");
        setBulkWeight(""); setBulkLength(""); setBulkWidth(""); setBulkHeight("");
    };

    const updateVar = (index: number, field: keyof Variation, value: any) => {
        const newVars = [...variations];
        // @ts-ignore
        newVars[index][field] = value;
        setValue("variations", newVars, { shouldDirty: true });
    };

    const updateVarAttr = (idx: number, attrName: string, val: string) => {
        const newVars = [...variations];
        newVars[idx].attributes = { ...newVars[idx].attributes, [attrName]: val };
        setValue("variations", newVars, { shouldDirty: true });
    };

    const removeVariation = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if(confirm("Are you sure? If this variation has sales, it will be archived.")) {
            remove(index);
            setOpenIndex(null);
        }
    };

    const handleMediaSelect = (media: any | any[]) => {
        if (mediaModalIndex === null) return;

        const selectedFiles = Array.isArray(media) ? media : [media];
        const newImagesObj = selectedFiles.map((m: any) => ({
            url: m.url, mediaId: m.id, altText: m.altText || "", id: undefined 
        }));

        const currentImages = variations[mediaModalIndex].images || [];
        const existingUrls = currentImages.map((img: any) => typeof img === 'string' ? img : img.url);
        const uniqueNewImages = newImagesObj.filter((img: any) => !existingUrls.includes(img.url));
        
        updateVar(mediaModalIndex, 'images', [...currentImages, ...uniqueNewImages]);
        setMediaModalIndex(null);
    };

    const removeVarImage = (varIndex: number, imgIndex: number) => {
        const currentImages = variations[varIndex].images || [];
        const newImages = currentImages.filter((_, i) => i !== imgIndex);
        updateVar(varIndex, 'images', newImages);
    };

    const handleStockUpdate = (locId: string, qtyStr: string) => {
        if (managingStockIndex === null) return;
        const newQty = parseInt(qtyStr) || 0;
        const currentVar = variations[managingStockIndex];
        const currentInv = currentVar.inventoryData || [];

        const existingItem = currentInv.find(i => i.locationId === locId);
        let newInvData;

        if (existingItem) {
            newInvData = currentInv.map(i => i.locationId === locId ? { ...i, quantity: newQty } : i);
        } else {
            newInvData = [...currentInv, { locationId: locId, quantity: newQty }];
        }

        const newTotal = newInvData.reduce((acc, curr) => acc + curr.quantity, 0);
        const newVars = [...variations];
        newVars[managingStockIndex].inventoryData = newInvData;
        newVars[managingStockIndex].stock = newTotal;
        setValue("variations", newVars, { shouldDirty: true });
    };

    const getVarQty = (varIdx: number, locId: string) => {
        return variations[varIdx]?.inventoryData?.find(i => i.locationId === locId)?.quantity || 0;
    };

    const filteredVariations = useMemo(() => {
        if (!searchTerm) return variations;
        return variations.filter(v => 
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [variations, searchTerm]);

    const activeAttributeFilters = useMemo(() => {
        return attributes.filter(a => a.variation && a.values.length > 0);
    }, [attributes]);

    return (
        <div>
            {/* Header: Flex col on mobile, row on desktop */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-4 bg-white border border-gray-200 shadow-sm rounded-sm gap-3 sm:gap-0">
                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{variations.length} variations</span>
                    <div className="relative w-full sm:w-auto">
                        <input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Filter variations..."
                            className="pl-7 pr-2 py-1 border border-gray-300 rounded text-xs outline-none focus:border-blue-500 w-full sm:w-48"
                        />
                        <Search size={12} className="absolute left-2 top-2 text-gray-400"/>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <button type="button" onClick={generateVariations} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-[#2271b1] rounded text-xs font-bold hover:bg-blue-100 whitespace-nowrap">
                        <Wand2 size={14}/> Generate
                    </button>
                    <button type="button" onClick={addVariation} className="px-3 py-1.5 bg-[#f0f0f1] border border-[#2271b1] text-[#2271b1] rounded text-xs font-bold hover:bg-[#2271b1] hover:text-white whitespace-nowrap">
                        Add Manual
                    </button>
                    <button type="button" onClick={() => setBulkMode(!bulkMode)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 text-gray-700 rounded text-xs font-bold hover:bg-gray-200 whitespace-nowrap">
                        <Settings2 size={14} /> Bulk Edit
                    </button>
                </div>
            </div>

            {bulkMode && (
                <div className="bg-gray-100 p-4 mb-4 rounded border border-gray-300 animate-in slide-in-from-top-2">
                    <div className="flex flex-wrap items-center justify-between mb-3 border-b border-gray-300 pb-2 gap-2">
                        <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                            <Settings2 size={14}/> Bulk Edit Configuration
                        </span>
                        <div className="text-[10px] text-gray-500 font-medium">
                            {selectedIds.length > 0 
                                ? <span className="text-blue-600">Targeting {selectedIds.length} Selected Items</span>
                                : "Targeting by Filter"
                            }
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="col-span-1">
                            <label className="text-xs font-bold block mb-1">Regular Price</label>
                            <input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 bg-white"/>
                        </div>
                        <div className="col-span-1">
                            <label className="text-xs font-bold block mb-1">Stock Qty</label>
                            <input type="number" value={bulkStock} onChange={e => setBulkStock(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 bg-white"/>
                        </div>
                        <div className="col-span-2 md:col-span-2">
                            <label className="text-xs font-bold block mb-1">SKU Prefix</label>
                            <input value={bulkSkuPrefix} onChange={e => setBulkSkuPrefix(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 bg-white" placeholder="e.g. GOBIKE-2025"/>
                        </div>
                    </div>

                    {/* 🔥 Bulk Edit Fields for Weight & Dimensions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-2 border-t border-gray-200">
                        <div>
                            <label className="text-xs font-bold block mb-1">Weight (kg)</label>
                            <input type="number" value={bulkWeight} onChange={e => setBulkWeight(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 bg-white"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1">Length</label>
                            <input type="number" value={bulkLength} onChange={e => setBulkLength(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 bg-white"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1">Width</label>
                            <input type="number" value={bulkWidth} onChange={e => setBulkWidth(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 bg-white"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold block mb-1">Height</label>
                            <input type="number" value={bulkHeight} onChange={e => setBulkHeight(e.target.value)} className="w-full border border-gray-300 p-1.5 text-sm rounded outline-none focus:border-blue-500 bg-white"/>
                        </div>
                    </div>

                    {selectedIds.length === 0 && (
                        <div className="mb-4 bg-white border border-gray-200 p-3 rounded">
                            <label className="text-xs font-bold block mb-2 text-gray-600 flex items-center gap-1">
                                <Filter size={12}/> Target Specific Attributes (Select Multiple):
                            </label>
                            
                            <div className="space-y-3">
                                {activeAttributeFilters.map(attr => (
                                    <div key={attr.name} className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">{attr.name}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {attr.values.map(val => {
                                                const isSelected = bulkFilters[attr.name]?.includes(val);
                                                return (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => toggleBulkFilter(attr.name, val)}
                                                        className={`px-2 py-1 text-[11px] border rounded transition select-none
                                                            ${isSelected 
                                                                ? 'bg-[#2271b1] text-white border-[#2271b1]' 
                                                                : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-[#2271b1] hover:text-[#2271b1]'
                                                            }`}
                                                    >
                                                        {val}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-gray-300 pt-3">
                        <button type="button" onClick={() => setBulkMode(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                        <button type="button" onClick={applyBulk} className="px-4 py-1.5 bg-[#2271b1] text-white font-bold rounded text-xs hover:bg-[#135e96]">
                            Apply Changes
                        </button>
                    </div>
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-red-50 border border-red-200 rounded">
                    <span className="text-xs text-red-700 font-bold">{selectedIds.length} items selected</span>
                    <button type="button" onClick={bulkDelete} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center gap-1 ml-auto">
                        <Trash2 size={12}/> Delete Selected
                    </button>
                </div>
            )}

            <div className="border border-gray-300 rounded-sm divide-y divide-gray-300 shadow-sm bg-gray-50">
                <div className="bg-white p-2 border-b border-gray-200 flex items-center gap-4 sticky top-0 z-10">
                    <button type="button" onClick={toggleSelectAll} className="p-1 text-gray-400 hover:text-[#2271b1]">
                        {selectedIds.length === variations.length && variations.length > 0 ? <CheckSquare size={18} className="text-[#2271b1]"/> : <Square size={18}/>}
                    </button>
                    <span className="text-xs font-bold text-gray-500 uppercase">Select All</span>
                </div>

                {filteredVariations.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">No variations found.</div>
                )}

                {filteredVariations.map((v, i) => {
                    const realIndex = variations.findIndex(item => item.id === v.id);
                    if(realIndex === -1) return null;

                    const isOpen = openIndex === realIndex;
                    const isSelected = selectedIds.includes(v.id!);
                    const firstImage = v.images && v.images.length > 0 ? v.images[0] : null;
                    const imageUrl = firstImage ? (typeof firstImage === 'object' ? (firstImage as any).url : firstImage) : null;

                    return (
                        <div key={v.id} className={`bg-white group transition-all ${isSelected ? 'bg-blue-50/30' : ''}`}>
                            {/* Responsive Row Layout */}
                            <div className={`flex flex-wrap items-center gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-gray-50 transition ${isOpen ? 'bg-gray-50 border-b border-gray-200' : ''}`}>
                                <div onClick={(e) => { e.stopPropagation(); toggleSelect(v.id!); }}>
                                    {isSelected ? <CheckSquare size={18} className="text-[#2271b1]"/> : <Square size={18} className="text-gray-300 group-hover:text-gray-400"/>}
                                </div>

                                <div onClick={() => toggleAccordion(realIndex)} className="flex-1 flex items-start sm:items-center gap-2 sm:gap-4 min-w-0">
                                    <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden border border-gray-300 relative shrink-0">
                                        {imageUrl && <Image src={imageUrl} alt="" fill className="object-cover"/>}
                                    </div>
                                    <div className="flex-1 flex flex-col sm:flex-row flex-wrap gap-1 sm:gap-3 items-start sm:items-center min-w-0">
                                        <div className="flex flex-col min-w-0">
                                            {/* Adjusted width for mobile to prevent overflow */}
                                            <span className="text-sm font-bold text-gray-700 truncate w-24 sm:w-48">{v.name}</span>
                                            <span className="text-xs text-gray-400">{v.sku || 'No SKU'}</span>
                                        </div>
                                        {/* Wrappable details */}
                                        <div className="flex items-center gap-3 ml-0 sm:ml-auto mr-2 sm:mr-4 mt-1 sm:mt-0">
                                             <span className="text-xs font-mono text-gray-600">{currency}{v.price}</span>
                                             <span className={`text-xs font-bold px-2 py-0.5 rounded ${v.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                                             </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                                    <button type="button" onClick={(e) => removeVariation(e, realIndex)} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
                                    <button type="button" onClick={() => toggleAccordion(realIndex)}>
                                        {isOpen ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                                    </button>
                                </div>
                            </div>
                            
                            {isOpen && (
                                <div className="p-3 sm:p-5 bg-white animate-in slide-in-from-top-2 duration-200 border-t border-gray-100">
                                     <div className="flex flex-col md:flex-row gap-6">
                                        <div className="w-full md:w-40 shrink-0">
                                            <label className="text-xs font-bold block mb-2 text-gray-700">Variant Images</label>
                                            <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 mb-2">
                                                {v.images?.map((img: any, imgIdx: number) => (
                                                    <div key={imgIdx} className="relative aspect-square border rounded overflow-hidden group/img">
                                                        <Image src={typeof img === 'object' ? img.url : img} alt="" fill className="object-cover" />
                                                        <button type="button" onClick={() => removeVarImage(realIndex, imgIdx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover/img:opacity-100 transition"><Trash2 size={10}/></button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => setMediaModalIndex(realIndex)} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded hover:border-[#2271b1] hover:bg-blue-50 transition text-gray-400 hover:text-[#2271b1]">
                                                    <Plus size={16} /><span className="text-[10px] font-bold mt-1">Add</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">SKU</label>
                                                    <input {...register(`variations.${realIndex}.sku`)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Price ({currency})</label>
                                                    <input type="number" {...register(`variations.${realIndex}.price`)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Stock</label>
                                                    <div className="flex gap-2">
                                                        <input type="number" value={v.stock} readOnly className="w-full border border-gray-300 bg-gray-100 p-2 rounded-sm text-sm text-gray-500 cursor-not-allowed" />
                                                        <button type="button" onClick={() => setManagingStockIndex(realIndex)} className="px-2 bg-blue-50 border border-blue-200 text-[#2271b1] rounded-sm hover:bg-blue-100"><MapPin size={16}/></button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Barcode</label>
                                                    <input {...register(`variations.${realIndex}.barcode`)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                                                 {attributes.filter(a => a.variation).map(attr => (
                                                    <div key={attr.name} className="flex items-center gap-2 w-full sm:w-auto">
                                                        <label className="text-[11px] font-bold text-gray-600 uppercase whitespace-nowrap">{attr.name}:</label>
                                                        <select {...register(`variations.${realIndex}.attributes.${attr.name}`)} className="text-xs border border-gray-300 rounded px-2 py-1 outline-none w-full sm:w-auto">
                                                            <option value="">Any</option>
                                                            {attr.values.map(val => <option key={val} value={val}>{val}</option>)}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>

                                            <hr className="border-gray-100"/>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                                                <div><label className="text-xs font-bold block mb-1 text-gray-500">Weight (kg)</label><input type="number" {...register(`variations.${realIndex}.weight`)} className="w-full border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" placeholder="Parent weight"/></div>
                                                <div className="col-span-1 md:col-span-3">
                                                    <label className="text-xs font-bold block mb-1 text-gray-500">Dimensions (L x W x H)</label>
                                                    <div className="flex gap-2">
                                                        <input type="number" placeholder="L" {...register(`variations.${realIndex}.length`)} className="w-1/3 min-w-0 border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
                                                        <input type="number" placeholder="W" {...register(`variations.${realIndex}.width`)} className="w-1/3 min-w-0 border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
                                                        <input type="number" placeholder="H" {...register(`variations.${realIndex}.height`)} className="w-1/3 min-w-0 border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {managingStockIndex !== null && (
                <StockManagerModal 
                    locations={locations} 
                    currentVar={variations[managingStockIndex]} 
                    onClose={() => setManagingStockIndex(null)}
                    onSave={(newInv, newTotal) => {
                        update(managingStockIndex, { ...variations[managingStockIndex], inventoryData: newInv, stock: newTotal });
                        setManagingStockIndex(null);
                    }}
                />
            )}

            {mediaModalIndex !== null && (
                <MediaSelectorModal 
                    onClose={() => setMediaModalIndex(null)}
                    onSelect={handleMediaSelect}
                    allowMultiple={false}
                />
            )}
        </div>
    );
}

interface StockManagerProps {
    locations: { id: string; name: string }[];
    currentVar: any;
    onClose: () => void;
    onSave: (newInv: any[], newTotal: number) => void;
}

function StockManagerModal({ locations, currentVar, onClose, onSave }: StockManagerProps) {
    const [localInv, setLocalInv] = useState<any[]>(currentVar.inventoryData || []);
    
    const handleUpdate = (locId: string, qty: number) => {
        const exists = localInv.find((i: any) => i.locationId === locId);
        if (exists) {
            setLocalInv(localInv.map((i: any) => i.locationId === locId ? { ...i, quantity: qty } : i));
        } else {
            setLocalInv([...localInv, { locationId: locId, quantity: qty }]);
        }
    };

    const getQty = (locId: string) => localInv.find((i: any) => i.locationId === locId)?.quantity || 0;
    const total = localInv.reduce((acc: number, curr: any) => acc + (parseInt(curr.quantity) || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Box size={18} className="text-[#2271b1]"/> Manage Stock</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                </div>
                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {locations.length === 0 ? (
                        <p className="text-sm text-red-500 text-center">No locations found.</p>
                    ) : (
                        locations.map((loc) => (
                            <div key={loc.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded hover:border-blue-300 transition">
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><MapPin size={14}/> {loc.name}</span>
                                <input 
                                    type="number" 
                                    min="0" 
                                    value={getQty(loc.id)} 
                                    onChange={(e) => handleUpdate(loc.id, parseInt(e.target.value) || 0)} 
                                    className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:border-[#2271b1] outline-none font-bold text-[#2271b1]"
                                />
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total: <span className="text-lg text-black ml-1">{total}</span></span>
                    <button onClick={() => onSave(localInv, total)} className="px-4 py-2 bg-[#2271b1] text-white text-sm font-bold rounded hover:bg-[#1a5c91]">Done</button>
                </div>
            </div>
        </div>
    );
}