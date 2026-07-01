// File: app/admin/settings/shipping/_components/Local/Shipping_Method.tsx

"use client";

import { useState } from "react";
import { addShippingRate, deleteShippingRate, updateShippingRate } from "@/app/actions/backend/settings/shipping/local";
import { ShippingZone, ShippingRate } from "../types"; 
import { TransdirectConfig, CarrierService } from "@prisma/client";
import { X, HelpCircle } from "lucide-react";
import { toast } from "sonner";

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
    const [selectedMethodType, setSelectedMethodType] = useState<string>("FLAT_RATE");
    const [freeShipRequirement, setFreeShipRequirement] = useState("none");
    const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

    // --- DYNAMIC METHODS GENERATOR ---
    const getAvailableMethods = () => {
        const methods = [
            { id: "FLAT_RATE", name: "Flat rate", desc: "Lets you charge a fixed rate for shipping." },
            { id: "FREE_SHIPPING", name: "Free shipping", desc: "Special method triggered with coupons or minimum spend." },
            { id: "LOCAL_PICKUP", name: "Local pickup", desc: "Allow customers to pick up orders themselves." }
        ];

        if (transdirectConfig?.isEnabled) {
            methods.push({
                id: "TRANSDIRECT",
                name: "Transdirect Shipping",
                desc: "Real-time quotes from multiple couriers via Transdirect API."
            });
        }

        if (carriers && carriers.length > 0) {
            carriers.forEach(carrier => {
                if (carrier.isEnabled) {
                    methods.push({
                        id: `CARRIER_${carrier.id}`,
                        name: carrier.name,
                        desc: `Calculated rates via ${carrier.name} API.`
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
        
        if (selectedMethodType === 'TRANSDIRECT') {
            formData.set("type", "CARRIER_CALCULATED");
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
        let type = rate.type as string; 
        
        if (type === 'CARRIER_CALCULATED') {
            if (rate.carrierServiceId) type = `CARRIER_${rate.carrierServiceId}`;
            else type = 'TRANSDIRECT'; 
        }
        
        setSelectedMethodType(type);
        setFreeShipRequirement(rate.freeShippingRequirement || "none");
        setRateStep(2); 
        setIsRateModalOpen(true);
    };

    // WP Class Helpers
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white";

    return (
        <div className="w-full text-[13px] text-[#3c434a] animate-in fade-in mb-[30px]">
            
            <button 
                onClick={onBack} 
                className="bg-transparent border-none text-[#2271b1] hover:text-[#135e96] hover:underline cursor-pointer p-0 mb-[15px] font-semibold text-[13px]"
            >
                &larr; Back to Zones
            </button>

            <h2 className="text-[23px] font-normal text-[#1d2327] m-0 mb-[10px]">Zone: {zone.name}</h2>
            <p className="text-[13px] text-[#646970] mt-0 mb-[20px]">Regions: {zone.countries.join(", ") || "Everywhere else"}</p>

            <h3 className="text-[14px] font-semibold text-[#1d2327] mb-[10px] pb-0 border-none">Shipping Methods</h3>
            <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">You can add multiple shipping methods within this zone. Customers will see them as options at checkout.</p>

            {/* WP List Table for Methods */}
            <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border mb-[15px]">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[30%]">Title</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Status</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338]">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {zone.rates.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-[10px] py-[20px] text-center text-[#646970] italic">
                                    No shipping methods found.
                                </td>
                            </tr>
                        ) : zone.rates.map((rate, index) => (
                            <tr key={rate.id} className={`border-b border-[#f0f0f1] last:border-none hover:bg-[#f6f7f7] group ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                <td className="px-[10px] py-[10px] align-top">
                                    <strong 
                                        className="text-[#2271b1] cursor-pointer hover:underline block text-[13px]"
                                        onClick={() => openEditRateModal(rate)}
                                    >
                                        {rate.name}
                                    </strong>
                                    
                                    <div className="text-[12px] mt-1 ">
                                        <button 
                                            onClick={() => openEditRateModal(rate)}
                                            className="bg-transparent border-none text-[#2271b1] hover:underline cursor-pointer p-0"
                                        >
                                            Edit
                                        </button>
                                        <span className="text-[#c3c4c7] mx-1">|</span>
                                        <button 
                                            onClick={() => handleDeleteRate(rate.id)}
                                            className="bg-transparent border-none text-[#d63638] hover:underline cursor-pointer p-0"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                                <td className="px-[10px] py-[10px] text-[#646970] align-top">
                                    Enabled
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a] align-top leading-relaxed">
                                    <span className="capitalize block mb-1">{(rate.type as string).replace('_', ' ').toLowerCase()}</span>
                                    
                                    {rate.type === 'FREE_SHIPPING' && rate.freeShippingRequirement && (
                                        <span className="text-[#646970] text-[12px] italic block">
                                            Requires: {rate.freeShippingRequirement.replace('_', ' ')}
                                        </span>
                                    )}
                                    {(rate.type === 'FLAT_RATE' || rate.type === 'LOCAL_PICKUP') && (
                                        <span className="text-[#646970] text-[12px] italic block">
                                            Cost: {rate.price} {rate.taxStatus === 'none' ? '(No Tax)' : ''}
                                        </span>
                                    )}
                                    {rate.type === 'CARRIER_CALCULATED' && (
                                        <span className="text-[#646970] text-[12px] italic block">
                                            API Calculated: {rate.carrierServiceId ? 'Custom Carrier' : 'Transdirect'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button 
                onClick={openAddRateModal} 
                className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2c3338] hover:bg-[#f0f0f1] hover:border-[#8c8f94] hover:text-[#2c3338] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
            >
                Add shipping method
            </button>

            {/* --- WP STYLE MODAL: ADD/EDIT RATE --- */}
            {isRateModalOpen && (
                <div className="fixed inset-0 bg-[#000000b3] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#f0f0f1] shadow-md w-full max-w-lg flex flex-col font-sans text-[13px] text-[#3c434a] max-h-[90vh]">
                        
                        <div className="flex justify-between items-center px-[20px] py-[15px] border-b border-[#c3c4c7] bg-white shrink-0">
                            <h3 className="text-[18px] font-normal text-[#1d2327] m-0 leading-tight">
                                {rateStep === 1 ? "Add shipping method" : `${editingRate ? 'Edit' : 'Set up'} method`}
                            </h3>
                            <button type="button" onClick={() => setIsRateModalOpen(false)} className="text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-white p-[20px] overflow-y-auto flex-1">
                            
                            {/* STEP 1 */}
                            {rateStep === 1 && !editingRate && (
                                <div className="space-y-[15px]">
                                    <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">Choose the shipping method you wish to add. Only shipping methods which support zones are listed.</p>
                                    
                                    <div className="border border-[#c3c4c7] rounded-[3px] bg-white overflow-hidden">
                                        {getAvailableMethods().map((method, index) => (
                                            <label 
                                                key={method.id} 
                                                className={`flex items-start gap-3 p-[12px] cursor-pointer hover:bg-[#f6f7f7] transition-colors ${index !== 0 ? 'border-t border-[#f0f0f1]' : ''}`}
                                            >
                                                <input 
                                                    type="radio" 
                                                    name="method_type" 
                                                    value={method.id} 
                                                    checked={selectedMethodType === method.id} 
                                                    onChange={() => setSelectedMethodType(method.id)} 
                                                    className="mt-1 w-4 h-4 border-[#8c8f94] text-[#2271b1] focus:ring-[#2271b1]" 
                                                />
                                                <div>
                                                    <span className="block font-semibold text-[#1d2327]">{method.name}</span>
                                                    <span className="text-[12px] text-[#646970] mt-1 block">{method.desc}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2 */}
                            {rateStep === 2 && (
                                <form id="rateForm" onSubmit={handleSaveRate} className="space-y-[15px]">
                                    
                                    <div>
                                        <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Method Title</label>
                                        <input 
                                            name="name" 
                                            required 
                                            defaultValue={editingRate ? editingRate.name : getAvailableMethods().find(m => m.id === selectedMethodType)?.name} 
                                            className={wpInputClass} 
                                        />
                                        <p className="text-[11px] text-[#646970] mt-1 mb-0">This controls the title which the user sees during checkout.</p>
                                    </div>

                                    {(selectedMethodType === 'TRANSDIRECT' || selectedMethodType.startsWith('CARRIER_')) && (
                                        <div className="p-[12px] bg-[#f0f0f1] text-[#3c434a] text-[13px] rounded-[3px] border border-[#c3c4c7]">
                                            <strong>Note:</strong> Rates will be calculated automatically at checkout based on the customer's address and item weight. Ensure your products have weights and dimensions set.
                                        </div>
                                    )}

                                    {selectedMethodType === 'FREE_SHIPPING' && (
                                        <>
                                            <div>
                                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Free shipping requires...</label>
                                                <select 
                                                    name="freeShippingRequirement" 
                                                    className={wpInputClass}
                                                    value={freeShipRequirement}
                                                    onChange={(e) => setFreeShipRequirement(e.target.value)}
                                                >
                                                    <option value="none">N/A</option>
                                                    <option value="coupon">A valid free shipping coupon</option>
                                                    <option value="min_amount">A minimum order amount</option>
                                                    <option value="either">A minimum order amount OR a coupon</option>
                                                    <option value="both">A minimum order amount AND a coupon</option>
                                                </select>
                                            </div>

                                            {['min_amount', 'either', 'both'].includes(freeShipRequirement) && (
                                                <div className="animate-in fade-in slide-in-from-top-1">
                                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Minimum order amount</label>
                                                    <input 
                                                        name="minPrice" 
                                                        type="number" 
                                                        step="0.01" 
                                                        defaultValue={editingRate?.minPrice || ""}
                                                        placeholder="0.00" 
                                                        className={wpInputClass} 
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {(selectedMethodType === 'FLAT_RATE' || selectedMethodType === 'LOCAL_PICKUP') && (
                                        <>
                                            <div>
                                                <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Tax status</label>
                                                <select 
                                                    name="taxStatus" 
                                                    defaultValue={editingRate?.taxStatus || "taxable"}
                                                    className={wpInputClass}
                                                >
                                                    <option value="taxable">Taxable</option>
                                                    <option value="none">None</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="flex items-center gap-1 text-[13px] font-medium text-[#1d2327] mb-1">
                                                    Cost <HelpCircle size={14} className="text-[#a7aaad]"/>
                                                </label>
                                                <input 
                                                    name="price" 
                                                    type="number" 
                                                    step="0.01" 
                                                    defaultValue={editingRate?.price || "0"} 
                                                    className={wpInputClass} 
                                                />
                                                <p className="text-[11px] text-[#646970] mt-1 mb-0">Enter a cost (excl. tax) or sum, e.g. 10.00.</p>
                                            </div>
                                        </>
                                    )}
                                </form>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-[15px] border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
                            {rateStep === 1 && !editingRate ? (
                                <button 
                                    type="button" onClick={() => setRateStep(2)} 
                                    className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm min-h-[30px]"
                                >
                                    Continue
                                </button>
                            ) : (
                                <>
                                    {!editingRate && (
                                        <button 
                                            type="button" onClick={() => setRateStep(1)} 
                                            className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
                                        >
                                            Back
                                        </button>
                                    )}
                                    <button 
                                        form="rateForm" type="submit" 
                                        className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm min-h-[30px]"
                                    >
                                        {editingRate ? "Save changes" : "Add shipping method"}
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