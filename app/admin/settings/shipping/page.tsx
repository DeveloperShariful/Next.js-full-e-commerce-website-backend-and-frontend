// File: app/admin/settings/shipping/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getShippingData } from "@/app/actions/settings/shipping";
import { ShippingZone, ShippingClass, ShippingOptionsData } from "./types";
import { Loader2, Globe, Settings, Package } from "lucide-react";

// Components
import Shipping_Zones from "./_components/Shipping_Zones";
import Shipping_Options from "./_components/Shipping_Options";
import Shipping_Classes from "./_components/Shipping_Classes";

export default function ShippingPage() {
    const [activeTab, setActiveTab] = useState("zones");
    const [loading, setLoading] = useState(true);
    
    // ✅ FIX: State Initialization now matches the Interface completely
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [classes, setClasses] = useState<ShippingClass[]>([]);
    const [options, setOptions] = useState<ShippingOptionsData>({
        enableShippingCalc: true,
        hideShippingCosts: false,
        shippingDestination: 'billing',
        // Missing fields added below:
        sellingLocation: 'all',
        sellingCountries: [],
        shippingLocation: 'all',
        shippingCountries: []
    });

    const fetchData = async () => {
        setLoading(true);
        const res = await getShippingData();
        if (res.success) {
            // ✅ FIX: Force type casting to ensure it matches the interface
            // The API returns the correct structure now, but TS needs assurance
            setZones(res.zones as unknown as ShippingZone[]);
            setClasses(res.classes as unknown as ShippingClass[]);
            
            const conf = res.options as any;
            
            setOptions({
                enableShippingCalc: conf.enableShippingCalc ?? true,
                hideShippingCosts: conf.hideShippingCosts ?? false,
                shippingDestination: conf.shippingDestination ?? 'billing',
                
                // Map the new fields
                sellingLocation: conf.sellingLocation || 'all',
                sellingCountries: conf.sellingCountries || [],
                shippingLocation: conf.shippingLocation || 'all',
                shippingCountries: conf.shippingCountries || [],
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    const tabs = [
        { id: "zones", label: "Shipping Zones", icon: Globe },
        { id: "options", label: "Shipping Options", icon: Settings },
        { id: "classes", label: "Shipping Classes", icon: Package },
    ];

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto pb-20">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 md:mb-6">Shipping & Delivery</h1>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200 mb-6 overflow-x-auto">
                <div className="flex min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? "border-[#2271b1] text-[#2271b1]"
                                    : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "zones" && (
                    <Shipping_Zones zones={zones} classes={classes} options={options} refreshData={fetchData} />
                )}
                {activeTab === "options" && (
                    <Shipping_Options zones={zones} classes={classes} options={options} refreshData={fetchData} />
                )}
                {activeTab === "classes" && (
                    <Shipping_Classes zones={zones} classes={classes} options={options} refreshData={fetchData} />
                )}
            </div>
        </div>
    );
}