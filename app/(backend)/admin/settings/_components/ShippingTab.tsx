"use client";

import { useState, useEffect } from "react";
import { Loader2, Globe, Settings, Package, MapPin, Truck, Box, ClipboardList } from "lucide-react";
import { 
    ShippingZone, 
    ShippingClass, 
    ShippingBox, 
    TransdirectBox, 
    PickupLocation, 
    Location, 
    TransdirectConfig, 
    CarrierService 
} from "@prisma/client";

import { getShippingData } from "@/app/actions/backend/settings/shipping/local";
import { getPackagingData } from "@/app/actions/backend/settings/shipping/packaging";
import { getLocationsData } from "@/app/actions/backend/settings/shipping/locations";
import { getTransdirectConfig } from "@/app/actions/backend/settings/shipping/transdirect-config";
import { getCarrierServices } from "@/app/actions/backend/settings/shipping/carriers";

// সাব-কম্পোনেন্ট ইমপোর্ট (আগের shipping/ ফোল্ডারের ভেতরের রিলেটিভ পাথ বজায় রাখা হয়েছে)
import Shipping_Zones from "./shipping//Shipping_Zones";
import Shipping_Options from "./shipping/Shipping_Options";
import Shipping_Classes from "./shipping/Shipping_Classes";
import Packaging_List from "./shipping/Packaging_List";
import Pickup_Locations from "./shipping/Pickup_Locations";
import Origin_Address from "./shipping/Origin_Address";
import Transdirect_Main from "./shipping/Transdirect_Main";
import Transdirect_Shipments from "./shipping/Transdirect_Shipments"; 
import Carrier_Service_List from "./shipping/Carrier_Service_List";

interface PageDataState {
    zones: (ShippingZone & { rates: any[] })[];
    classes: (ShippingClass & { _count?: { products: number } })[];
    options: any; 
    shippingBoxes: ShippingBox[];
    transdirectBoxes: TransdirectBox[];
    pickupLocations: PickupLocation[];
    originLocation: Location | null;
    transdirectConfig: TransdirectConfig | null;
    carriers: CarrierService[];
}

export default function ShippingTab() {
    const [activeSubTab, setActiveSubTab] = useState("zones");
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
                // @ts-ignore
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

    const subTabs = [
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
        return <div className="h-[250px] flex items-center justify-center"><Loader2 className="animate-spin text-[#2271b1]" size={28} /></div>;
    }

    return (
        <div>
            <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Shipping & Delivery</h2>
                <p className="text-slate-500 text-xs mt-1">Manage how you ship products, calculate rates, and handle local pickups.</p>
            </div>

            <div className="border-b border-slate-200 mb-6 overflow-x-auto scrollbar-hide">
                <div className="flex min-w-max space-x-1">
                    {subTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 rounded-t-md ${
                                activeSubTab === tab.id
                                    ? "border-[#2271b1] text-[#2271b1] bg-blue-50/50"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
                {activeSubTab === "zones" && (
                    <Shipping_Zones 
                        // @ts-ignore
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

                {activeSubTab === "packaging" && (
                    <Packaging_List 
                        shippingBoxes={data.shippingBoxes} 
                        transdirectBoxes={data.transdirectBoxes} 
                        refreshData={fetchData} 
                    />
                )}

                {activeSubTab === "locations" && (
                    <div className="space-y-8">
                        <Origin_Address location={data.originLocation} />
                        <Pickup_Locations locations={data.pickupLocations} refreshData={fetchData} />
                    </div>
                )}

                {activeSubTab === "transdirect" && (
                    <Transdirect_Main config={data.transdirectConfig} refreshData={fetchData} />
                )}

                {activeSubTab === "shipments" && (
                    <Transdirect_Shipments />
                )}

                {activeSubTab === "carriers" && (
                    <Carrier_Service_List carriers={data.carriers} refreshData={fetchData} />
                )}

                {activeSubTab === "classes" && (
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

                {activeSubTab === "options" && (
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