// File: app/admin/settings/shipping/_components/Local/Shipping_Zones.tsx

"use client";

import { useState, useMemo } from "react";
import { createShippingZone, deleteShippingZone } from "@/app/actions/backend/settings/shipping/local";
import { ComponentProps, ShippingZone } from "./types";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getCountryAndStatesList } from "@/app/actions/backend/settings/general/location-helpers"; 
import Shipping_Method from "./Shipping_Method";
import { TransdirectConfig, CarrierService } from "@prisma/client";

interface Props extends ComponentProps {
    transdirectConfig: TransdirectConfig | null;
    carriers: CarrierService[];
}

export default function Shipping_Zones({ zones, options, refreshData, transdirectConfig, carriers }: Props) {
    const [view, setView] = useState<'list' | 'manage'>('list');
    const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);

    const availableRegions = useMemo(() => {
        let allowedCountries: string[] = [];

        if (options.shippingLocation === 'specific' && options.shippingCountries.length > 0) {
            allowedCountries = options.shippingCountries;
        } else if (options.shippingLocation === 'all_selling' && options.sellingLocation === 'specific' && options.sellingCountries.length > 0) {
            allowedCountries = options.sellingCountries;
        }

        return getCountryAndStatesList(allowedCountries);

    }, [options]);

    // --- HANDLERS ---
    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const res = await createShippingZone(formData);
        if (res.success) {
            toast.success("Zone created");
            setIsZoneModalOpen(false);
            refreshData();
        } else {
            toast.error("Failed to create zone");
        }
    };

    const handleDeleteZone = async (id: string) => {
        if (confirm("Delete this zone?")) {
            await deleteShippingZone(id);
            refreshData();
        }
    };

    // View: Manage Rates
    if (view === 'manage' && selectedZone) {
        const zoneData = zones.find(z => z.id === selectedZone.id) || selectedZone;
        return (
            <Shipping_Method 
                zone={zoneData} 
                onBack={() => setView('list')} 
                refreshData={refreshData} 
                transdirectConfig={transdirectConfig}
                carriers={carriers}
            />
        );
    }

    // WP Input Class Helper for Modal
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full box-border bg-white";

    // View: List Zones
    return (
        <div className="w-full text-[13px] text-[#3c434a] animate-in fade-in mb-[30px]">
            
            {/* WP Page Title & Action */}
            <div className="flex items-center gap-3 mb-[15px]">
                <h2 className="text-xl font-bold text-slate-800">Shipping Zones</h2>
                <button 
                    onClick={() => setIsZoneModalOpen(true)} 
                    className="bg-[#f6f7f7] border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[10px] py-[2px] text-[13px] font-semibold cursor-pointer"
                >
                    Add shipping zone
                </button>
            </div>
            <p className="text-[13px] text-[#646970] mt-0 mb-[15px]">A shipping zone is a geographic region where a certain set of shipping methods and rates apply. Customers only see the methods available for their address.</p>

            {/* WP List Table */}
            <div className="w-full overflow-x-auto bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] box-border">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[25%]">Zone Name</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[25%]">Regions</th>
                            <th scope="col" className="px-[10px] py-[8px] font-normal text-[#2c3338] w-[35%]">Shipping Methods</th>
                        </tr>
                    </thead>
                    <tbody>
                        {zones.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-[10px] py-[20px] text-center text-[#646970] italic">
                                    No shipping zones found. Please add a shipping zone.
                                </td>
                            </tr>
                        ) : zones.map((zone, index) => (
                            <tr key={zone.id} className={`border-b border-[#f0f0f1] last:border-none hover:bg-[#f6f7f7] group ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                                <td className="px-[10px] py-[10px] align-top">
                                    <strong 
                                        className="text-[#2271b1] cursor-pointer hover:underline block text-[13px]"
                                        onClick={() => { setSelectedZone(zone); setView('manage'); }}
                                    >
                                        {zone.name}
                                    </strong>
                                    
                                    {/* WP Row Actions (Hover to reveal) */}
                                    <div className="text-[12px] mt-1 ">
                                        <button 
                                            onClick={() => { setSelectedZone(zone); setView('manage'); }}
                                            className="bg-transparent border-none text-[#2271b1] hover:underline cursor-pointer p-0"
                                        >
                                            Edit
                                        </button>
                                        <span className="text-[#c3c4c7] mx-1">|</span>
                                        <button 
                                            onClick={() => handleDeleteZone(zone.id)}
                                            className="bg-transparent border-none text-[#d63638] hover:underline cursor-pointer p-0"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a] align-top leading-relaxed">
                                    {zone.countries.length > 0 
                                        ? zone.countries.join(", ")
                                        : <span className="text-[#646970] italic">Everywhere else</span>
                                    }
                                </td>
                                <td className="px-[10px] py-[10px] text-[#3c434a] align-top">
                                    {zone.rates.length > 0 
                                        ? zone.rates.map(r => r.name).join(", ") 
                                        : <span className="text-[#d63638]">No methods added. Customers in this zone will not be able to checkout.</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- WP STYLE MODAL: CREATE ZONE --- */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 bg-[#000000b3] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#f0f0f1] shadow-md w-full max-w-lg flex flex-col font-sans text-[13px] text-[#3c434a]">
                        
                        <div className="flex justify-between items-center px-[20px] py-[15px] border-b border-[#c3c4c7] bg-white shrink-0">
                            <h3 className="text-[18px] font-normal text-[#1d2327] m-0 leading-tight">
                                Add Shipping Zone
                            </h3>
                            <button type="button" onClick={() => setIsZoneModalOpen(false)} className="text-[#646970] hover:text-[#d63638] bg-transparent border-none cursor-pointer p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="bg-white p-[20px] overflow-y-auto flex-1">
                            <form id="zone-form" onSubmit={handleCreateZone} className="space-y-[15px]">
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Zone Name</label>
                                    <input name="name" required placeholder="e.g. Australia" className={wpInputClass} />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Zone Regions</label>
                                    <select name="countries" className={`${wpInputClass} !h-[200px]`} multiple>
                                        {availableRegions.map(region => (
                                            <option key={region.value} value={JSON.stringify([region.value])}>
                                                {region.label}
                                            </option> 
                                        ))}
                                        {availableRegions.length === 0 && <option disabled>No regions available</option>}
                                    </select>
                                    <p className="text-[11px] text-[#646970] mt-1 mb-0">Hold Ctrl (Windows) or Cmd (Mac) to select multiple regions.</p>
                                </div>
                            </form>
                        </div>

                        <div className="p-[15px] border-t border-[#c3c4c7] bg-[#f6f7f7] flex justify-end gap-2 shrink-0">
                            <button 
                                type="button" onClick={() => setIsZoneModalOpen(false)} 
                                className="bg-[#f6f7f7] border border-[#8c8f94] text-[#2271b1] hover:bg-[#f0f0f1] hover:text-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer min-h-[30px]"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" form="zone-form" 
                                className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm min-h-[30px]"
                            >
                                Save changes
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}