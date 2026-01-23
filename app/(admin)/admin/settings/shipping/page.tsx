// File: app/admin/settings/shipping/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Loader2, Globe, Settings, Package, MapPin, Truck, Box, ClipboardList } from "lucide-react";
import { 
    ShippingZone, 
    ShippingRate, 
    ShippingClass, 
    ShippingBox, 
    TransdirectBox, 
    PickupLocation, 
    Location, 
    TransdirectConfig, 
    CarrierService 
} from "@prisma/client";

import { getShippingData } from "@/app/actions/admin/settings/shipping/local";
import { getPackagingData } from "@/app/actions/admin/settings/shipping/packaging";
import { getLocationsData } from "@/app/actions/admin/settings/shipping/locations";
import { getTransdirectConfig } from "@/app/actions/admin/settings/shipping/transdirect-config";
import { getCarrierServices } from "@/app/actions/admin/settings/shipping/carriers";

import Shipping_Zones from "./_components/Local/Shipping_Zones";
import Shipping_Options from "./_components/Local/Shipping_Options";
import Shipping_Classes from "./_components/Local/Shipping_Classes";
import Packaging_List from "./_components/Packaging/Packaging_List";
import Pickup_Locations from "./_components/Locations/Pickup_Locations";
import Origin_Address from "./_components/Locations/Origin_Address";
import Transdirect_Main from "./_components/Transdirect/Transdirect_Main";
import Transdirect_Shipments from "./_components/Transdirect/Transdirect_Shipments"; 
import Carrier_Service_List from "./_components/Carriers/Carrier_Service_List";

// ✅ FIX: Update interface to allow any type for rates (to handle Decimal)
interface PageDataState {
    zones: (ShippingZone & { rates: any[] })[]; // Changed from ShippingRate[] to any[]
    classes: (ShippingClass & { _count?: { products: number } })[];
    options: any; 
    shippingBoxes: ShippingBox[];
    transdirectBoxes: TransdirectBox[];
    pickupLocations: PickupLocation[];
    originLocation: Location | null;
    transdirectConfig: TransdirectConfig | null;
    carriers: CarrierService[];
}

export default function ShippingPage() {
    const [activeTab, setActiveTab] = useState("zones");
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState<PageDataState>({
        zones: [],
        classes: [],
        options: {},
        shippingBoxes: [],
        transdirectBoxes: [],
        pickupLocations: [],
        originLocation: null,
        transdirectConfig: null,
        carriers: []
    });

    const fetchData = async () => {
        try {
            const [localRes, packageRes, locRes, transRes, carrierRes] = await Promise.all([
                getShippingData(),
                getPackagingData(),
                getLocationsData(),
                getTransdirectConfig(),
                getCarrierServices()
            ]);

            setData({
                // @ts-ignore - Ignoring Decimal/Number mismatch
                zones: localRes.success && localRes.zones ? localRes.zones : [],
                classes: localRes.success && localRes.classes ? (localRes.classes as any) : [],
                options: localRes.success && localRes.options ? localRes.options : {},
                
                shippingBoxes: packageRes.success && packageRes.shippingBoxes ? packageRes.shippingBoxes : [],
                transdirectBoxes: packageRes.success && packageRes.transdirectBoxes ? packageRes.transdirectBoxes : [],
                
                pickupLocations: locRes.success && locRes.pickupLocations ? locRes.pickupLocations : [],
                originLocation: locRes.success && locRes.originLocation ? locRes.originLocation : null,
                
                transdirectConfig: transRes.success && transRes.data ? transRes.data : null,
                
                carriers: carrierRes.success && carrierRes.carriers ? carrierRes.carriers : []
            });
        } catch (error) {
            console.error("Error fetching shipping data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const tabs = [
        { id: "zones", label: "Zones & Rates", icon: Globe },
        { id: "packaging", label: "Packaging", icon: Box },
        { id: "locations", label: "Locations", icon: MapPin },
        { id: "transdirect", label: "Transdirect Setup", icon: Truck }, 
        { id: "shipments", label: "Transdirect Shipments", icon: ClipboardList }, 
        { id: "carriers", label: "Other Carriers", icon: Settings },
        { id: "classes", label: "Classes", icon: Package },
        { id: "options", label: "Options", icon: Settings },
    ];

    if (loading) {
        return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-[#2271b1]" size={32} /></div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
            
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Shipping & Delivery</h1>
                <p className="text-slate-500 mt-2">Manage how you ship products, calculate rates, and handle local pickups.</p>
            </div>

            <div className="border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max space-x-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 rounded-t-md ${
                                activeTab === tab.id
                                    ? "border-[#2271b1] text-[#2271b1] bg-blue-50/50"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {activeTab === "zones" && (
                    <Shipping_Zones 
                        // @ts-ignore - Ignoring Decimal/Number mismatch
                        zones={data.zones} 
                        // @ts-ignore
                        options={data.options} 
                        // @ts-ignore
                        classes={data.classes}
                        transdirectConfig={data.transdirectConfig}
                        carriers={data.carriers}
                        refreshData={fetchData} 
                    />
                )}

                {activeTab === "packaging" && (
                    <Packaging_List 
                        shippingBoxes={data.shippingBoxes} 
                        transdirectBoxes={data.transdirectBoxes} 
                        refreshData={fetchData} 
                    />
                )}

                {activeTab === "locations" && (
                    <div className="space-y-8">
                        <Origin_Address location={data.originLocation} />
                        <Pickup_Locations locations={data.pickupLocations} refreshData={fetchData} />
                    </div>
                )}

                {activeTab === "transdirect" && (
                    <Transdirect_Main config={data.transdirectConfig} refreshData={fetchData} />
                )}

                {activeTab === "shipments" && (
                    <Transdirect_Shipments />
                )}

                {activeTab === "carriers" && (
                    <Carrier_Service_List carriers={data.carriers} refreshData={fetchData} />
                )}

                {activeTab === "classes" && (
                    <Shipping_Classes 
                        // @ts-ignore
                        classes={data.classes} 
                        // @ts-ignore
                        zones={data.zones}
                        // @ts-ignore
                        options={data.options}
                        refreshData={fetchData} 
                    />
                )}

                {activeTab === "options" && (
                     <Shipping_Options 
                        // @ts-ignore
                        options={data.options} 
                        // @ts-ignore
                        zones={data.zones}
                        // @ts-ignore
                        classes={data.classes}
                        refreshData={fetchData} 
                    />
                )}

            </div>
        </div>
    );
}