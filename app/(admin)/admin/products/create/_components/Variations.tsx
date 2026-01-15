// app/admin/products/create/_components/Variations.tsx

import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-hot-toast";
import ImageUpload from "@/components/media/image-upload"; 
import { ChevronDown, ChevronUp, Trash2, Wand2, MapPin, Box, X } from "lucide-react"; 
import { getLocations } from "@/app/actions/admin/product/product-read";
import { ProductFormData, Variation } from "../types";

export default function Variations() {
    const { watch, setValue } = useFormContext<ProductFormData>();
    const attributes = watch("attributes") || [];
    const variations = watch("variations") || [];
    const mainData = watch();

    const [openIndex, setOpenIndex] = useState<number | null>(null);
    
    // 🔥 NEW: Location States
    const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
    const [managingStockIndex, setManagingStockIndex] = useState<number | null>(null); // For Modal

    // Fetch Locations on Mount
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

    // --- VARIATION GENERATOR LOGIC ---
    const generateVariations = () => {
        const varAttrs = attributes.filter(a => a.variation && a.values.length > 0);
        
        if(varAttrs.length === 0) {
            toast.error("No attributes selected for variation.");
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

            return {
                id: `temp_gen_${Date.now()}_${index}`,
                name: combo.join(" / "),
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
                images: [],
                inventoryData: [] // Init empty inventory
            };
        });

        setValue("variations", newVariations, { shouldDirty: true });
        toast.success(`Generated ${newVariations.length} variations!`);
    };

    const addVariation = () => {
        const varAttrs = attributes.filter(a => a.variation);
        if(varAttrs.length === 0) {
            toast.error("Add attributes first!");
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
            images: [],
            inventoryData: []
        };

        setValue("variations", [...variations, newVariation], { shouldDirty: true });
        setOpenIndex(variations.length);
    };

    // --- UPDATE HANDLERS ---
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
        if(confirm("Remove this variation?")) {
            setValue("variations", variations.filter((_, vi) => vi !== index), { shouldDirty: true });
            setOpenIndex(null);
        }
    };

    // Image Handlers
    const handleVarImageUpload = (index: number, url: string) => {
        const currentImages = variations[index].images || [];
        updateVar(index, 'images', [...currentImages, url]);
    };

    const removeVarImage = (varIndex: number, imgIndex: number) => {
        const currentImages = variations[varIndex].images || [];
        updateVar(varIndex, 'images', currentImages.filter((_, i) => i !== imgIndex));
    };

    // 🔥 NEW: Multi-Warehouse Logic
    const handleStockUpdate = (locId: string, qtyStr: string) => {
        if (managingStockIndex === null) return;
        
        const newQty = parseInt(qtyStr) || 0;
        const currentVar = variations[managingStockIndex];
        const currentInv = currentVar.inventoryData || [];

        // Update inventory array
        const existingItem = currentInv.find(i => i.locationId === locId);
        let newInvData;

        if (existingItem) {
            newInvData = currentInv.map(i => i.locationId === locId ? { ...i, quantity: newQty } : i);
        } else {
            newInvData = [...currentInv, { locationId: locId, quantity: newQty }];
        }

        // Calculate Total
        const newTotal = newInvData.reduce((acc, curr) => acc + curr.quantity, 0);

        // Update State
        const newVars = [...variations];
        newVars[managingStockIndex].inventoryData = newInvData;
        newVars[managingStockIndex].stock = newTotal;
        setValue("variations", newVars, { shouldDirty: true });
    };

    const getVarQty = (varIdx: number, locId: string) => {
        return variations[varIdx]?.inventoryData?.find(i => i.locationId === locId)?.quantity || 0;
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-4 bg-white border border-gray-200 shadow-sm rounded-sm gap-3 sm:gap-0">
                <span className="text-sm font-semibold text-gray-700">{variations.length} variations defined</span>
                <div className="flex gap-2">
                    <button type="button" onClick={generateVariations} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-[#2271b1] rounded text-xs font-bold hover:bg-blue-100 transition">
                        <Wand2 size={14}/> Generate
                    </button>
                    <button type="button" onClick={addVariation} className="px-4 py-2 bg-[#f0f0f1] border border-[#2271b1] text-[#2271b1] rounded text-xs font-bold hover:bg-[#2271b1] hover:text-white transition">
                        Add Manually
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="border border-gray-300 rounded-sm divide-y divide-gray-300 shadow-sm">
                {variations.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm bg-gray-50">No variations yet.</div>
                )}

                {variations.map((v, i) => {
                    const isOpen = openIndex === i;
                    const mainImage = v.images && v.images.length > 0 ? v.images[0] : null;

                    return (
                        <div key={v.id} className="bg-white group transition-all">
                            {/* Accordion Header */}
                            <div onClick={() => toggleAccordion(i)} className={`p-3 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition ${isOpen ? 'bg-gray-50 border-b border-gray-200' : ''}`}>
                                <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden border border-gray-300">
                                    {mainImage && <img src={mainImage} alt="" className="w-full h-full object-cover"/>}
                                </div>
                                <div className="flex-1 flex flex-wrap gap-3" onClick={(e) => e.stopPropagation()}>
                                    {attributes.filter(a => a.variation).map(attr => (
                                        <div key={attr.name} className="flex items-center gap-1.5">
                                            <label className="text-[11px] font-bold text-gray-600 uppercase">{attr.name}:</label>
                                            <select value={v.attributes[attr.name] || ""} onChange={e => updateVarAttr(i, attr.name, e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-[#2271b1]">
                                                <option value="">Any</option>
                                                {attr.values.map(val => <option key={val} value={val}>{val}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={(e) => removeVariation(e, i)} className="text-gray-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
                                    {isOpen ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                                </div>
                            </div>
                            
                            {/* Accordion Body */}
                            {isOpen && (
                                <div className="p-5 bg-white animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        
                                        {/* Image Section */}
                                        <div className="w-full md:w-40 shrink-0">
                                            <label className="text-xs font-bold block mb-2 text-gray-700">Variant Images</label>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                {v.images?.map((img, imgIdx) => (
                                                    <div key={imgIdx} className="relative aspect-square border rounded overflow-hidden group/img">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => removeVarImage(i, imgIdx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover/img:opacity-100 transition"><Trash2 size={10}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <ImageUpload value={[]} onChange={(url) => handleVarImageUpload(i, url)} onRemove={() => {}} showPreview={false} />
                                        </div>

                                        {/* Fields Section */}
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">SKU</label>
                                                    <input value={v.sku || ""} onChange={e => updateVar(i, 'sku', e.target.value)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Regular Price ($)</label>
                                                    <input type="number" value={v.price} onChange={e => updateVar(i, 'price', parseFloat(e.target.value))} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none" />
                                                </div>
                                                
                                                {/* 🔥 STOCK BUTTON */}
                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Stock Qty</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="number" 
                                                            value={v.stock} 
                                                            readOnly 
                                                            className="w-full border border-gray-300 bg-gray-100 p-2 rounded-sm text-sm outline-none cursor-not-allowed text-gray-500" 
                                                            title="Total calculated from locations"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setManagingStockIndex(i)}
                                                            className="px-2 bg-blue-50 border border-blue-200 text-[#2271b1] rounded-sm hover:bg-blue-100 transition"
                                                            title="Manage Stock by Location"
                                                        >
                                                            <MapPin size={16}/>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold block mb-1">Barcode</label>
                                                    <input value={v.barcode || ""} onChange={e => updateVar(i, 'barcode', e.target.value)} className="w-full border border-gray-400 p-2 rounded-sm text-sm focus:border-[#2271b1] outline-none"/>
                                                </div>
                                            </div>
                                            
                                            <hr className="border-gray-100"/>
                                            {/* Shipping Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded border border-gray-200">
                                                <div><label className="text-xs font-bold block mb-1 text-gray-500">Weight (kg)</label><input type="number" value={v.weight || ""} onChange={e => updateVar(i, 'weight', parseFloat(e.target.value))} className="w-full border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" placeholder="Parent weight"/></div>
                                                <div className="col-span-3">
                                                    <label className="text-xs font-bold block mb-1 text-gray-500">Dimensions (L x W x H)</label>
                                                    <div className="flex gap-2">
                                                        <input type="number" placeholder="L" value={v.length || ""} onChange={e => updateVar(i, 'length', parseFloat(e.target.value))} className="w-1/3 border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
                                                        <input type="number" placeholder="W" value={v.width || ""} onChange={e => updateVar(i, 'width', parseFloat(e.target.value))} className="w-1/3 border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
                                                        <input type="number" placeholder="H" value={v.height || ""} onChange={e => updateVar(i, 'height', parseFloat(e.target.value))} className="w-1/3 border border-gray-300 p-1.5 rounded-sm text-xs focus:border-[#2271b1] outline-none" />
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

            {/* 🔥 STOCK MANAGEMENT MODAL */}
            {managingStockIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Box size={18} className="text-[#2271b1]"/> 
                                Manage Stock <span className="text-xs font-normal text-gray-500">({variations[managingStockIndex].name})</span>
                            </h3>
                            <button onClick={() => setManagingStockIndex(null)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                        </div>
                        
                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {locations.length === 0 ? (
                                <p className="text-sm text-red-500 text-center">No locations found. Please create a warehouse first.</p>
                            ) : (
                                locations.map(loc => (
                                    <div key={loc.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded hover:border-blue-300 transition">
                                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-400"/> {loc.name}
                                        </span>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={getVarQty(managingStockIndex, loc.id)}
                                            onChange={(e) => handleStockUpdate(loc.id, e.target.value)}
                                            className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-sm focus:border-[#2271b1] outline-none font-bold text-[#2271b1]"
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">Total Stock: <span className="text-lg text-black ml-1">{variations[managingStockIndex].stock}</span></span>
                            <button onClick={() => setManagingStockIndex(null)} className="px-4 py-2 bg-[#2271b1] text-white text-sm font-bold rounded hover:bg-[#1a5c91]">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}