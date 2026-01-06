// app/admin/products/create/_components/Variations.tsx

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-hot-toast";
import ImageUpload from "@/components/ui/image-upload"; 
import { ChevronDown, ChevronUp, Trash2, Wand2 } from "lucide-react"; 
import { ProductFormData, Variation } from "../types";

export default function Variations() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const attributes = watch("attributes") || [];
    const variations = watch("variations") || [];
    const mainData = watch(); // Access other fields like price, sku etc.

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const generateVariations = () => {
        const varAttrs = attributes.filter(a => a.variation && a.values.length > 0);
        
        if(varAttrs.length === 0) {
            toast.error("No attributes selected for variation. Please check 'Attributes' tab.");
            return;
        }

        const confirmGen = window.confirm("This will replace existing variations. Are you sure?");
        if (!confirmGen) return;

        const cartesian = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
        
        const arraysToCombine = varAttrs.map(a => a.values);
        const combinations = varAttrs.length === 1 
            ? arraysToCombine[0].map(v => [v]) 
            : cartesian(...arraysToCombine);

        const newVariations: Variation[] = combinations.map((combo: string[], index: number) => {
            const attributesMap: Record<string, string> = {};
            varAttrs.forEach((attr, idx) => {
                attributesMap[attr.name] = combo[idx];
            });

            const varName = combo.join(" / ");

            return {
                id: `temp_gen_${Date.now()}_${index}`,
                name: varName,
                price: typeof mainData.price === 'number' ? mainData.price : 0,
                stock: 0,
                sku: `${mainData.sku || 'SKU'}-${index + 1}`,
                attributes: attributesMap,
                barcode: "",
                costPerItem: 0,
                weight: parseFloat(mainData.weight as unknown as string) || 0,
                length: parseFloat(mainData.length as unknown as string) || 0,
                width: parseFloat(mainData.width as unknown as string) || 0,
                height: parseFloat(mainData.height as unknown as string) || 0,
                images: []
            };
        });

        setValue("variations", newVariations, { shouldDirty: true });
        toast.success(`Generated ${newVariations.length} variations!`);
    };

    const addVariation = () => {
        const varAttrs = attributes.filter(a => a.variation);
        if(varAttrs.length === 0) {
            toast.error("Add attributes used for variations first in 'Attributes' tab");
            return;
        }
        
        const newId = `temp_${Date.now()}`;
        const defaultAttrs: Record<string, string> = {};
        varAttrs.forEach(a => defaultAttrs[a.name] = "");

        const newVariation: Variation = {
            id: newId,
            name: `Variation #${variations.length + 1}`,
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
            images: []
        };

        setValue("variations", [...variations, newVariation], { shouldDirty: true });
        setOpenIndex(variations.length);
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
        if(confirm("Are you sure you want to remove this variation?")) {
            setValue("variations", variations.filter((_, vi) => vi !== index), { shouldDirty: true });
            setOpenIndex(null);
        }
    };

    const handleVarImageUpload = (index: number, url: string) => {
        const currentImages = variations[index].images || [];
        updateVar(index, 'images', [...currentImages, url]);
    };

    const removeVarImage = (varIndex: number, imgIndex: number) => {
        const currentImages = variations[varIndex].images || [];
        updateVar(varIndex, 'images', currentImages.filter((_, i) => i !== imgIndex));
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-4 bg-white border border-gray-200 shadow-sm rounded-sm gap-3 sm:gap-0">
                <span className="text-sm font-semibold text-gray-700">{variations.length} variations defined</span>
                
                <div className="flex gap-2">
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

            <div className="border border-gray-300 rounded-sm divide-y divide-gray-300 shadow-sm">
                {variations.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm bg-gray-50">
                        No variations yet. Click "Generate" to auto-create from attributes.
                    </div>
                )}

                {variations.map((v, i) => {
                    const isOpen = openIndex === i;
                    const mainImage = v.images && v.images.length > 0 ? v.images[0] : null;

                    return (
                        <div key={v.id} className="bg-white group transition-all">
                            
                            <div 
                                onClick={() => toggleAccordion(i)}
                                className={`p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition ${isOpen ? 'bg-gray-50 border-b border-gray-200' : ''}`}
                            >
                                <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden border border-gray-300">
                                    {mainImage && <img src={mainImage} alt="" className="w-full h-full object-cover"/>}
                                </div>

                                <div className="flex-1 flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
                                    {attributes.filter(a => a.variation).map(attr => (
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
                            
                            {isOpen && (
                                <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        
                                        <div className="w-full md:w-40 shrink-0">
                                            <label className="text-xs font-bold block mb-2 text-gray-700">Variant Images</label>
                                            
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
                                                value={[]} 
                                                onChange={(url) => handleVarImageUpload(i, url)}
                                                onRemove={() => {}}
                                                showPreview={false} 
                                            />
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div><label className="text-xs font-bold block mb-1">SKU</label><input value={v.sku || ""} onChange={e => updateVar(i, 'sku', e.target.value)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" /></div>
                                                <div><label className="text-xs font-bold block mb-1">Regular Price ($)</label><input type="number" value={v.price} onChange={e => updateVar(i, 'price', parseFloat(e.target.value))} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" /></div>
                                                <div><label className="text-xs font-bold block mb-1">Stock Qty</label><input type="number" value={v.stock} onChange={e => updateVar(i, 'stock', parseInt(e.target.value))} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" /></div>
                                                <div><label className="text-xs font-bold block mb-1">Barcode (UPC)</label><input value={v.barcode || ""} onChange={e => updateVar(i, 'barcode', e.target.value)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/></div>
                                            </div>
                                            
                                            <hr className="border-gray-100"/>
                                            
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