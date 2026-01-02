// File: app/admin/products/create/_components/Variations.tsx

import { ComponentProps } from "../types";
import { toast } from "react-hot-toast";
import ImageUpload from "@/components/ui/image-upload"; 
import { ChevronDown, ChevronUp, Trash2, Wand2 } from "lucide-react"; // Wand2 icon added
import { useState } from "react";

export default function Variations({ data, updateData }: ComponentProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // 🔥 NEW: Cartesian Product Logic for Auto-Generation
    const generateVariations = () => {
        // 1. Get attributes marked for variation
        const varAttrs = data.attributes.filter(a => a.variation && a.values.length > 0);
        
        if(varAttrs.length === 0) {
            toast.error("No attributes selected for variation. Please check 'Attributes' tab.");
            return;
        }

        const confirmGen = window.confirm("This will replace existing variations. Are you sure?");
        if (!confirmGen) return;

        // 2. Generate combinations
        const cartesian = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
        
        const arraysToCombine = varAttrs.map(a => a.values);
        // If only 1 attribute, cartesian logic needs array of arrays
        const combinations = varAttrs.length === 1 
            ? arraysToCombine[0].map(v => [v]) 
            : cartesian(...arraysToCombine);

        // 3. Map to Variation Objects
        const newVariations = combinations.map((combo: string[], index: number) => {
            const attributesMap: Record<string, string> = {};
            varAttrs.forEach((attr, idx) => {
                attributesMap[attr.name] = combo[idx];
            });

            // Create Name (e.g., "Red / L")
            const varName = combo.join(" / ");

            return {
                id: `temp_gen_${Date.now()}_${index}`,
                name: varName,
                price: typeof data.price === 'number' ? data.price : 0, // Inherit base price
                stock: 0,
                sku: `${data.sku || 'SKU'}-${index + 1}`, // Auto SKU
                attributes: attributesMap,
                barcode: "",
                costPerItem: 0,
                weight: parseFloat(data.weight) || 0,
                length: parseFloat(data.length) || 0,
                width: parseFloat(data.width) || 0,
                height: parseFloat(data.height) || 0,
                images: [] // Empty array for images
            };
        });

        updateData('variations', newVariations);
        toast.success(`Generated ${newVariations.length} variations!`);
    };

    const addVariation = () => {
        const varAttrs = data.attributes.filter(a => a.variation);
        if(varAttrs.length === 0) {
            toast.error("Add attributes used for variations first in 'Attributes' tab");
            return;
        }
        
        const newId = `temp_${Date.now()}`;
        const defaultAttrs: Record<string, string> = {};
        varAttrs.forEach(a => defaultAttrs[a.name] = "");

        updateData('variations', [...data.variations, {
            id: newId,
            name: `Variation #${data.variations.length + 1}`,
            price: 0,
            stock: 0,
            sku: "",
            attributes: defaultAttrs,
            barcode: "",
            costPerItem: 0,
            weight: 0,
            length: 0,
            width: 0,
            height: 0,
            images: [] // Updated
        }]);
        setOpenIndex(data.variations.length);
    };

    const updateVar = (index: number, field: string, value: any) => {
        const newVars = [...data.variations];
        (newVars[index] as any)[field] = value;
        updateData('variations', newVars);
    };

    const updateVarAttr = (idx: number, attrName: string, val: string) => {
        const newVars = [...data.variations];
        newVars[idx].attributes = { ...newVars[idx].attributes, [attrName]: val };
        updateData('variations', newVars);
    };

    const removeVariation = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if(confirm("Are you sure you want to remove this variation?")) {
            updateData('variations', data.variations.filter((_, vi) => vi !== index));
            setOpenIndex(null);
        }
    };

    // Helper for Image Upload inside Variation
    const handleVarImageUpload = (index: number, url: string) => {
        const currentImages = data.variations[index].images || [];
        updateVar(index, 'images', [...currentImages, url]);
    };

    const removeVarImage = (varIndex: number, imgIndex: number) => {
        const currentImages = data.variations[varIndex].images || [];
        updateVar(varIndex, 'images', currentImages.filter((_, i) => i !== imgIndex));
    };

    return (
        <div>
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-4 bg-white border border-gray-200 shadow-sm rounded-sm gap-3 sm:gap-0">
                <span className="text-sm font-semibold text-gray-700">{data.variations.length} variations defined</span>
                
                <div className="flex gap-2">
                    {/* 🔥 NEW: Generate Button */}
                    <button 
                        type="button" 
                        onClick={generateVariations} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-[#2271b1] rounded text-xs font-bold hover:bg-blue-100 transition"
                    >
                        <Wand2 size={14}/> Generate
                    </button>

                    <button 
                        type="button" 
                        onClick={addVariation} 
                        className="px-4 py-2 bg-[#f0f0f1] border border-[#2271b1] text-[#2271b1] rounded text-xs font-bold hover:bg-[#2271b1] hover:text-white transition"
                    >
                        Add Manually
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="border border-gray-300 rounded-sm divide-y divide-gray-300 shadow-sm">
                {data.variations.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm bg-gray-50">
                        No variations yet. Click "Generate" to auto-create from attributes.
                    </div>
                )}

                {data.variations.map((v, i) => {
                    const isOpen = openIndex === i;
                    const mainImage = v.images && v.images.length > 0 ? v.images[0] : null;

                    return (
                        <div key={v.id} className="bg-white group transition-all">
                            
                            {/* Variation Header */}
                            <div 
                                onClick={() => toggleAccordion(i)}
                                className={`p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition ${isOpen ? 'bg-gray-50 border-b border-gray-200' : ''}`}
                            >
                                {/* Thumbnail Preview in Header */}
                                <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden border border-gray-300">
                                    {mainImage && <img src={mainImage} alt="" className="w-full h-full object-cover"/>}
                                </div>

                                <div className="flex-1 flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
                                    {data.attributes.filter(a => a.variation).map(attr => (
                                        <div key={attr.name} className="flex items-center gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-600 uppercase">{attr.name}:</label>
                                            <select 
                                                value={v.attributes[attr.name] || ""}
                                                onChange={e => updateVarAttr(i, attr.name, e.target.value)}
                                                className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#2271b1]"
                                            >
                                                <option value="">Any</option>
                                                {attr.values.map(val => <option key={val} value={val}>{val}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={(e) => removeVariation(e, i)} className="text-gray-400 hover:text-red-600 transition">
                                        <Trash2 size={16}/>
                                    </button>
                                    {isOpen ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                                </div>
                            </div>
                            
                            {/* Expanded Content */}
                            {isOpen && (
                                <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        
                                        {/* 🔥 LEFT: Multiple Image Upload */}
                                        <div className="w-full md:w-40 shrink-0">
                                            <label className="text-xs font-bold block mb-2 text-gray-700">Variant Images</label>
                                            
                                            {/* Image Grid */}
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                {v.images?.map((img, imgIdx) => (
                                                    <div key={imgIdx} className="relative aspect-square border rounded overflow-hidden group/img">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeVarImage(i, imgIdx)}
                                                            className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover/img:opacity-100 transition"
                                                        >
                                                            <Trash2 size={10}/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <ImageUpload 
                                                value={[]} // We handle state manually via onChange
                                                onChange={(url) => handleVarImageUpload(i, url)}
                                                onRemove={() => {}}
                                                showPreview={false} // Custom preview above
                                            />
                                        </div>

                                        {/* RIGHT: Fields */}
                                        <div className="flex-1 space-y-4">
                                            {/* Row 1: Basic Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div><label className="text-xs font-bold block mb-1">SKU</label><input value={v.sku} onChange={e => updateVar(i, 'sku', e.target.value)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" /></div>
                                                <div><label className="text-xs font-bold block mb-1">Regular Price ($)</label><input type="number" value={v.price} onChange={e => updateVar(i, 'price', parseFloat(e.target.value))} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" /></div>
                                                <div><label className="text-xs font-bold block mb-1">Stock Qty</label><input type="number" value={v.stock} onChange={e => updateVar(i, 'stock', parseInt(e.target.value))} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" /></div>
                                                <div><label className="text-xs font-bold block mb-1">Barcode (UPC)</label><input value={v.barcode || ""} onChange={e => updateVar(i, 'barcode', e.target.value)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/></div>
                                            </div>
                                            
                                            <hr className="border-gray-100"/>
                                            
                                            {/* Row 2: Advanced Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                                                <div><label className="text-xs font-bold block mb-1 text-gray-500">Cost per item</label><input type="number" value={v.costPerItem || ""} onChange={e => updateVar(i, 'costPerItem', parseFloat(e.target.value))} className="w-full border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" placeholder="0.00"/></div>
                                                <div><label className="text-xs font-bold block mb-1 text-gray-500">Weight (kg)</label><input type="number" value={v.weight || ""} onChange={e => updateVar(i, 'weight', parseFloat(e.target.value))} className="w-full border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" placeholder="Parent weight"/></div>
                                                
                                                <div className="col-span-2">
                                                    <label className="text-xs font-bold block mb-1 text-gray-500">Dimensions (L x W x H)</label>
                                                    <div className="flex gap-2">
                                                        <input type="number" placeholder="L" value={v.length || ""} onChange={e => updateVar(i, 'length', parseFloat(e.target.value))} className="w-full border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
                                                        <input type="number" placeholder="W" value={v.width || ""} onChange={e => updateVar(i, 'width', parseFloat(e.target.value))} className="w-full border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
                                                        <input type="number" placeholder="H" value={v.height || ""} onChange={e => updateVar(i, 'height', parseFloat(e.target.value))} className="w-full border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
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
        </div>
    );
}