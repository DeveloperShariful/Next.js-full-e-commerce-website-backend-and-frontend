// File: app/admin/settings/shipping/_components/Local/Shipping_Method.tsx

"use client";

import { useState } from "react";
import { addShippingRate, deleteShippingRate, updateShippingRate } from "@/app/actions/settings/shipping/local";
// ✅ আমরা Local Types ব্যবহার করছি যাতে String vs Enum কনফ্লিক্ট না হয়
import { ShippingZone, ShippingRate } from "../../types"; 
import { TransdirectConfig, CarrierService } from "@prisma/client";
import { Plus, MapPin, Truck, ArrowRight, X, ChevronRight, HelpCircle, Pencil, Globe, Gift } from "lucide-react";
import { toast } from "react-hot-toast";

interface ShippingMethodProps {
    zone: ShippingZone;
    onBack: () => void;
    refreshData: () => void;
    transdirectConfig: TransdirectConfig | null;
    carriers: CarrierService[];
}

export default function Shipping_Method({ zone, onBack, refreshData, transdirectConfig, carriers }: ShippingMethodProps) {
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    
    // Rate Logic
    const [rateStep, setRateStep] = useState(1);
    
    // ✅ FIX: এখানে <string> টাইপ বলে দেওয়া হয়েছে যেন কাস্টম স্ট্রিং (যেমন: TRANSDIRECT) সাপোর্ট করে
    const [selectedMethodType, setSelectedMethodType] = useState<string>("FLAT_RATE");
    
    const [freeShipRequirement, setFreeShipRequirement] = useState("none");
    
    // Editing State
    const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

    // --- DYNAMIC METHODS GENERATOR ---
    const getAvailableMethods = () => {
        const methods = [
            { id: "FLAT_RATE", name: "Flat rate", desc: "Lets you charge a fixed rate for shipping.", icon: Truck },
            { id: "FREE_SHIPPING", name: "Free shipping", desc: "Special method triggered with coupons or minimum spend.", icon: Gift },
            { id: "LOCAL_PICKUP", name: "Local pickup", desc: "Allow customers to pick up orders themselves.", icon: MapPin }
        ];

        // 1. Add Transdirect if enabled
        if (transdirectConfig?.isEnabled) {
            methods.push({
                id: "TRANSDIRECT",
                name: "Transdirect Shipping",
                desc: "Real-time quotes from multiple couriers via Transdirect API.",
                icon: Globe
            });
        }

        // 2. Add Custom Carriers
        if (carriers && carriers.length > 0) {
            carriers.forEach(carrier => {
                if (carrier.isEnabled) {
                    methods.push({
                        id: `CARRIER_${carrier.id}`,
                        name: carrier.name,
                        desc: `Calculated rates via ${carrier.name} API.`,
                        icon: Truck
                    });
                }
            });
        }

        return methods;
    };

    // --- HANDLERS ---
    const handleSaveRate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        
        // Handle Dynamic Types Logic
        if (selectedMethodType === 'TRANSDIRECT') {
            formData.set("type", "CARRIER_CALCULATED");
            // Note: Transdirect এর জন্য carrierServiceId নাল থাকবে, বা আপনি চাইলে স্পেশাল ফ্ল্যাগ ইউজ করতে পারেন
        } else if (selectedMethodType.startsWith('CARRIER_')) {
            formData.set("type", "CARRIER_CALCULATED");
            const carrierId = selectedMethodType.replace('CARRIER_', '');
            formData.append("carrierServiceId", carrierId);
        } else {
            formData.set("type", selectedMethodType);
        }

        let res;
        if (editingRate) {
            formData.append("id", editingRate.id);
            res = await updateShippingRate(formData);
        } else {
            formData.append("zoneId", zone.id);
            res = await addShippingRate(formData);
        }

        if (res.success) {
            toast.success(editingRate ? "Rate updated" : "Rate added");
            setIsRateModalOpen(false);
            setRateStep(1);
            setEditingRate(null);
            refreshData();
        } else {
            toast.error(res.error || "Operation failed");
        }
    };

    const handleDeleteRate = async (id: string) => {
        if (confirm("Delete this shipping method?")) {
            await deleteShippingRate(id);
            refreshData();
        }
    };

    const openAddRateModal = () => {
        setEditingRate(null);
        setRateStep(1);
        setSelectedMethodType("FLAT_RATE");
        setFreeShipRequirement("none");
        setIsRateModalOpen(true);
    };

    const openEditRateModal = (rate: ShippingRate) => {
        setEditingRate(rate);
        
        // Determine type for editing view
        let type = rate.type as string; // Cast to string to avoid Enum conflict
        
        if (type === 'CARRIER_CALCULATED') {
            if (rate.carrierServiceId) {
                type = `CARRIER_${rate.carrierServiceId}`;
            } else {
                // Assuming no carrier ID means Transdirect
                type = 'TRANSDIRECT'; 
            }
        }
        
        setSelectedMethodType(type);
        setFreeShipRequirement(rate.freeShippingRequirement || "none");
        setRateStep(2); 
        setIsRateModalOpen(true);
    };

    return (
        <div className="animate-in fade-in">
            <button onClick={onBack} className="flex items-center gap-1 text-sm text-[#2271b1] hover:underline mb-4 font-medium">
                <ArrowRight className="rotate-180" size={14}/> Back to zones
            </button>

            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MapPin size={20} className="text-slate-400"/> {zone.name}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Manage shipping methods for this zone.</p>
                    </div>
                    <button onClick={openAddRateModal} className="px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] text-sm flex items-center gap-2">
                        <Plus size={16} /> Add shipping method
                    </button>
                </div>

                {/* Methods List */}
                <div className="space-y-3">
                    {zone.rates.map((rate) => (
                        <div key={rate.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-lg group hover:border-[#2271b1] transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded border border-slate-200">
                                    <Truck size={20} className="text-[#2271b1]"/>
                                </div>
                                <div className="cursor-pointer" onClick={() => openEditRateModal(rate)}>
                                    <h4 className="font-bold text-slate-800 group-hover:text-[#2271b1]">{rate.name}</h4>
                                    <div className="text-xs text-slate-500 flex gap-2 flex-wrap">
                                        <span className="uppercase bg-slate-200 px-1 rounded font-mono">{(rate.type as string).replace('_', ' ')}</span>
                                        {rate.type === 'FREE_SHIPPING' && rate.freeShippingRequirement && (
                                                <span className="text-green-600 font-medium">
                                                (Requires: {rate.freeShippingRequirement.replace('_', ' ')})
                                                </span>
                                        )}
                                        {/* Display Cost for Flat Rate or Local Pickup */}
                                        {(rate.type === 'FLAT_RATE' || rate.type === 'LOCAL_PICKUP') && (
                                                <span>Cost: {rate.price} {rate.taxStatus === 'none' ? '(No Tax)' : ''}</span>
                                        )}
                                        {/* Display Carrier Info */}
                                        {rate.type === 'CARRIER_CALCULATED' && (
                                            <span className="text-blue-600 font-medium">
                                                (API Calculated: {rate.carrierServiceId ? 'Custom Carrier' : 'Transdirect'})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => openEditRateModal(rate)} className="text-slate-400 hover:text-[#2271b1] p-2" title="Edit">
                                    <Pencil size={18}/>
                                </button>
                                <button onClick={() => handleDeleteRate(rate.id)} className="text-slate-400 hover:text-red-500 p-2" title="Delete">
                                    <X size={18}/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {zone.rates.length === 0 && (
                        <p className="text-center text-slate-500 italic py-4">No shipping methods found.</p>
                    )}
                </div>
            </div>

            {/* --- MODAL: ADD/EDIT RATE --- */}
            {isRateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                        
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-slate-800">
                                {rateStep === 1 
                                    ? "Add shipping method" 
                                    : `${editingRate ? 'Edit' : 'Set up'} method`
                                }
                            </h3>
                            <button onClick={() => setIsRateModalOpen(false)}><X size={20} className="text-slate-400"/></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {/* STEP 1: SELECT TYPE */}
                            {rateStep === 1 && !editingRate && (
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-500 mb-4">Choose the shipping method you wish to add.</p>
                                    
                                    {getAvailableMethods().map((method) => (
                                        <label key={method.id} className={`flex items-start gap-4 p-4 border rounded cursor-pointer transition-all ${selectedMethodType === method.id ? 'border-[#2271b1] bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <input 
                                                type="radio" 
                                                name="method_type" 
                                                value={method.id} 
                                                checked={selectedMethodType === method.id} 
                                                onChange={() => setSelectedMethodType(method.id)} 
                                                className="mt-1 w-4 h-4 text-[#2271b1] focus:ring-[#2271b1]" 
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <method.icon size={16} className="text-slate-700" />
                                                    <span className="block font-bold text-slate-800">{method.name}</span>
                                                </div>
                                                <span className="text-sm text-slate-500">{method.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* STEP 2: CONFIGURE DETAILS */}
                            {rateStep === 2 && (
                                <form id="rateForm" onSubmit={handleSaveRate} className="space-y-5">
                                    {/* Name Field */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                                        <input 
                                            name="name" 
                                            required 
                                            defaultValue={editingRate ? editingRate.name : getAvailableMethods().find(m => m.id === selectedMethodType)?.name} 
                                            className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" 
                                        />
                                    </div>

                                    {/* CARRIER / TRANSDIRECT INFO */}
                                    {(selectedMethodType === 'TRANSDIRECT' || selectedMethodType.startsWith('CARRIER_')) && (
                                        <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100 flex gap-2">
                                            <Globe size={16} className="mt-0.5 shrink-0"/>
                                            <div>
                                                <strong>Note:</strong> Rates will be calculated automatically at checkout based on the customer's address and item weight.
                                                <br/><span className="text-xs opacity-75 mt-1 block">Ensure your products have weights and dimensions set.</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* FREE SHIPPING CONFIG */}
                                    {selectedMethodType === 'FREE_SHIPPING' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Free shipping requires...</label>
                                                <select 
                                                    name="freeShippingRequirement" 
                                                    className="w-full border p-2 rounded outline-none focus:border-[#2271b1] bg-white text-sm"
                                                    value={freeShipRequirement}
                                                    onChange={(e) => setFreeShipRequirement(e.target.value)}
                                                >
                                                    <option value="none">No requirement</option>
                                                    <option value="coupon">A valid free shipping coupon</option>
                                                    <option value="min_amount">A minimum order amount</option>
                                                    <option value="either">A minimum order amount OR a coupon</option>
                                                    <option value="both">A minimum order amount AND a coupon</option>
                                                </select>
                                            </div>

                                            {['min_amount', 'either', 'both'].includes(freeShipRequirement) && (
                                                <div className="animate-in fade-in slide-in-from-top-1">
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Minimum Order Amount</label>
                                                    <input 
                                                        name="minPrice" 
                                                        type="number" 
                                                        step="0.01" 
                                                        defaultValue={editingRate?.minPrice || ""}
                                                        placeholder="0.00" 
                                                        className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" 
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* FLAT RATE & LOCAL PICKUP CONFIG */}
                                    {(selectedMethodType === 'FLAT_RATE' || selectedMethodType === 'LOCAL_PICKUP') && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Tax status</label>
                                                <select 
                                                    name="taxStatus" 
                                                    defaultValue={editingRate?.taxStatus || "taxable"}
                                                    className="w-full border p-2 rounded outline-none focus:border-[#2271b1] bg-white text-sm"
                                                >
                                                    <option value="taxable">Taxable</option>
                                                    <option value="none">None</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                                                    Cost <HelpCircle size={14} className="text-slate-400"/>
                                                </label>
                                                <input 
                                                    name="price" 
                                                    type="number" 
                                                    step="0.01" 
                                                    defaultValue={editingRate?.price || "0"} 
                                                    className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" 
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Enter a cost (excl. tax) or sum, e.g. <code>10.00</code>.</p>
                                            </div>
                                        </>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2 sticky bottom-0">
                            {rateStep === 1 && !editingRate ? (
                                <button onClick={() => setRateStep(2)} className="px-6 py-2 bg-[#2271b1] text-white rounded text-sm font-bold hover:bg-[#135e96] flex items-center gap-2">
                                    Continue <ChevronRight size={16}/>
                                </button>
                            ) : (
                                <>
                                    {!editingRate && (
                                        <button type="button" onClick={() => setRateStep(1)} className="px-4 py-2 border rounded text-sm font-bold hover:bg-white">Back</button>
                                    )}
                                    <button form="rateForm" type="submit" className="px-6 py-2 bg-[#2271b1] text-white rounded text-sm font-bold hover:bg-[#135e96]">
                                        {editingRate ? "Save changes" : "Create and save"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}