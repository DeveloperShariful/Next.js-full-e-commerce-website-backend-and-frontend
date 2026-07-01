//app/(backend)/admin/settings/_components/ShippingTab.tsx

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
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
import Shipping_Zones from "./Shipping_Zones";
import Shipping_Options from "./Shipping_Options";
import Shipping_Classes from "./Shipping_Classes";
import Packaging_List from "./Packaging_List";
import Pickup_Locations from "./Pickup_Locations";
import Origin_Address from "./Origin_Address";
import Transdirect_Main from "./Transdirect_Main";
import Carrier_Service_List from "./Carrier_Service_List";

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
        { id: "zones", label: "Zones & Rates" },
        { id: "packaging", label: "Packaging" },
        { id: "locations", label: "Locations" },
        { id: "transdirect", label: "Transdirect Setup" }, 
        { id: "carriers", label: "Other Carriers" },
        { id: "classes", label: "Classes" },
        { id: "options", label: "Options" },
    ];

    if (loading) {
        return (
            <div className="h-[250px] w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-[#2271b1]" size={28} />
            </div>
        );
    }

    return (
        <div className="w-full text-[13px] text-[#3c434a]">
            
            {/* WordPress subsubsub style tabs - Fully Responsive flex-wrap */}
            <ul className="list-none p-0 m-0 mb-6 text-[13px] text-[#646970] flex flex-wrap items-center gap-y-2">
                {subTabs.map((tab, index) => (
                    <li key={tab.id} className="inline-block m-0 p-0">
                        <button
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`inline-block p-0 bg-transparent border-none cursor-pointer hover:text-[#135e96] transition-colors ${
                                activeSubTab === tab.id
                                    ? "text-[#000] font-semibold"
                                    : "text-[#2271b1]"
                            }`}
                        >
                            {tab.label}
                        </button>
                        {index < subTabs.length - 1 && <span className="mx-2 text-[#c3c4c7]">|</span>}
                    </li>
                ))}
            </ul>

            {/* Content Area */}
            <div className="animate-in fade-in duration-150 w-full">
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
                    <div className="space-y-[30px]">
                        <Origin_Address location={data.originLocation} />
                        <Pickup_Locations locations={data.pickupLocations} refreshData={fetchData} />
                    </div>
                )}

                {activeSubTab === "transdirect" && (
                    <Transdirect_Main config={data.transdirectConfig} refreshData={fetchData} />
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