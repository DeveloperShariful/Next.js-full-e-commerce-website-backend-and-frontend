// File: app/admin/settings/shipping/_components/Shipping_Zones.tsx

"use client";

import { useState, useMemo } from "react";
import { createShippingZone, deleteShippingZone } from "@/app/actions/settings/shipping";
import { ComponentProps, ShippingZone } from "../types";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { getCountryAndStatesList } from "@/lib/location-helpers"; // ✅ Import updated helper
import Shipping_Method from "./Shipping_Method";

export default function Shipping_Zones({ zones, options, refreshData }: ComponentProps) {
    const [view, setView] = useState<'list' | 'manage'>('list');
    const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);

    // ✅ UPDATED: Filter Countries AND States based on General Settings
    const availableRegions = useMemo(() => {
        let allowedCountries: string[] = [];

        // 1. Determine which countries are allowed based on settings
        if (options.shippingLocation === 'specific' && options.shippingCountries.length > 0) {
            allowedCountries = options.shippingCountries;
        } else if (options.shippingLocation === 'all_selling' && options.sellingLocation === 'specific' && options.sellingCountries.length > 0) {
            allowedCountries = options.sellingCountries;
        }

        // 2. Generate list with States using the new helper
        // If allowedCountries is empty array [], it fetches ALL countries + states
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

    // If viewing a single zone, render the Method Component
    if (view === 'manage' && selectedZone) {
        const zoneData = zones.find(z => z.id === selectedZone.id) || selectedZone;
        return (
            <Shipping_Method 
                zone={zoneData} 
                onBack={() => setView('list')} 
                refreshData={refreshData} 
            />
        );
    }

    // Default: List View
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Shipping Zones</h2>
                    <p className="text-sm text-slate-500">A shipping zone is a geographic region where a certain set of shipping methods apply.</p>
                </div>
                <button onClick={() => setIsZoneModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white font-bold rounded hover:bg-[#135e96] text-sm">
                    <Plus size={16} /> Add shipping zone
                </button>
            </div>

            <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-4 font-bold text-slate-700 w-1/4">Zone Name</th>
                            <th className="p-4 font-bold text-slate-700 w-1/4">Regions</th>
                            <th className="p-4 font-bold text-slate-700 w-1/3">Shipping Methods</th>
                            <th className="p-4 font-bold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {zones.map((zone) => (
                            <tr key={zone.id} className="hover:bg-slate-50 group">
                                <td className="p-4 font-bold text-[#2271b1] cursor-pointer" onClick={() => { setSelectedZone(zone); setView('manage'); }}>
                                    {zone.name}
                                </td>
                                <td className="p-4 text-slate-600">
                                    {/* Display cleaner region names */}
                                    {zone.countries.length > 0 
                                        ? <span className="line-clamp-2" title={zone.countries.join(", ")}>
                                            {/* We just show raw codes here for now, or you can map them back to labels if needed */}
                                            {zone.countries.join(", ")}
                                          </span>
                                        : <span className="text-slate-400 italic">Everywhere else</span>
                                    }
                                </td>
                                <td className="p-4 text-slate-600">
                                    {zone.rates.length > 0 
                                        ? zone.rates.map(r => r.name).join(", ") 
                                        : <span className="text-slate-400 italic">No methods</span>
                                    }
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => { setSelectedZone(zone); setView('manage'); }} className="text-[#2271b1] font-medium hover:underline text-xs md:text-sm">Manage</button>
                                        <button onClick={() => handleDeleteZone(zone.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL: CREATE ZONE --- */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Shipping Zone</h3>
                            <button onClick={() => setIsZoneModalOpen(false)}><X size={20} className="text-slate-400"/></button>
                        </div>
                        <form onSubmit={handleCreateZone} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Zone Name</label>
                                <input name="name" required placeholder="e.g. Australia" className="w-full border p-2 rounded outline-none focus:border-[#2271b1]" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Zone Region</label>
                                <select name="countries" className="w-full border p-2 rounded outline-none focus:border-[#2271b1] bg-white text-sm h-64" multiple>
                                    {/* ✅ Render availableRegions (Countries + States) */}
                                    {availableRegions.map(region => (
                                        <option key={region.value} value={JSON.stringify([region.value])}>
                                            {region.label}
                                        </option> 
                                    ))}
                                    {availableRegions.length === 0 && <option disabled>No regions available</option>}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                                <button type="button" onClick={() => setIsZoneModalOpen(false)} className="px-4 py-2 border rounded text-sm font-bold">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-[#2271b1] text-white rounded text-sm font-bold">Create Zone</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}