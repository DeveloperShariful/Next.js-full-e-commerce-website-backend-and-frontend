//app/(backend)/admin/settings/_components/GeneralTab.tsx

"use client";

import { useState, useEffect } from "react";
import { getGeneralSettings, updateGeneralSettings } from "@/app/actions/backend/settings/general/general";
import { toast } from "sonner";
import { Loader2, Save, Store, Globe, Share2 } from "lucide-react";

// সাব-কম্পোনেন্ট ইমপোর্ট (আগের general/ ফোল্ডারের ভেতরের রিলেটিভ পাথ বজায় রাখা হয়েছে)
import Store_Info from "./general/Store_Info";
import Store_Address from "./general/Store_Address";
import General_Options from "./general/General_Options";
import Taxes_and_coupons from "./general/Taxes_and_coupons";
import Currency_options from "./general/Currency_options";
import Measurement_Maintenance from "./general/Measurement_Maintenance";
import Social_Links from "./general/Social_Links";

export interface GeneralSettingsData {
    storeName: string;
    storeEmail: string;
    storePhone: string;
    weightUnit: string;
    dimensionUnit: string;
    maintenance: boolean;
    socialLinks: {
        facebook: string;
        instagram: string;
        twitter: string;
        youtube: string;
        linkedin: string;
    };
    storeAddress: {
        address1: string;
        address2: string;
        city: string;
        country: string; 
        postcode: string;
    };
    generalConfig: {
        sellingLocation: string; 
        sellingCountries: string[]; 
        shippingLocation: string; 
        shippingCountries: string[];
        defaultCustomerLocation: string; 
        enableCoupons: boolean;
        calcCouponsSequentially: boolean; 
        enableReviews: boolean;
        enableGuestCheckout: boolean;
    };
    taxSettings: {
        enableTax: boolean;
        pricesIncludeTax: boolean;
    };
    currencyOptions: {
        currency: string;
        currencyPosition: string; 
        thousandSeparator: string;
        decimalSeparator: string;
        numDecimals: number;
    };
}

export default function GeneralTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("general");

  const [data, setData] = useState<GeneralSettingsData>({
    storeName: "", storeEmail: "", storePhone: "",
    weightUnit: "kg", dimensionUnit: "cm", maintenance: false,
    socialLinks: { facebook: "", instagram: "", twitter: "", youtube: "", linkedin: "" },
    storeAddress: { address1: "", address2: "", city: "", country: "AU", postcode: "" },
    generalConfig: { 
        sellingLocation: "all", sellingCountries: [],
        shippingLocation: "all", shippingCountries: [],
        defaultCustomerLocation: "shop_base",
        enableCoupons: true, calcCouponsSequentially: false,
        enableReviews: true,
        enableGuestCheckout: false
    },
    taxSettings: { enableTax: false, pricesIncludeTax: false },
    currencyOptions: {
        currency: "AUD", currencyPosition: "left",
        thousandSeparator: ",", decimalSeparator: ".", numDecimals: 2
    }
  });

  useEffect(() => {
    getGeneralSettings().then(res => {
      if(res.success && res.data) {
        const s = res.data;
        const gc = (s.generalConfig as any) || {};
        const co = gc.currencyOptions || {}; 
        const sl = (s.socialLinks as any) || {};

        setData({
            storeName: s.storeName || "",
            storeEmail: s.storeEmail || "",
            storePhone: s.storePhone || "",
            weightUnit: s.weightUnit || "kg",
            dimensionUnit: s.dimensionUnit || "cm",
            maintenance: s.maintenance || false,
            socialLinks: {
                facebook: sl.facebook || "", instagram: sl.instagram || "",
                twitter: sl.twitter || "", youtube: sl.youtube || "", linkedin: sl.linkedin || ""
            },
            storeAddress: (s.storeAddress as any) || { address1: "", address2: "", city: "", country: "AU", postcode: "" },
            generalConfig: {
                sellingLocation: gc.sellingLocation || "all",
                sellingCountries: Array.isArray(gc.sellingCountries) ? gc.sellingCountries : [],
                shippingLocation: gc.shippingLocation || "all",
                shippingCountries: Array.isArray(gc.shippingCountries) ? gc.shippingCountries : [],
                defaultCustomerLocation: gc.defaultCustomerLocation || "shop_base",
                enableCoupons: gc.enableCoupons ?? true,
                calcCouponsSequentially: gc.calcCouponsSequentially ?? false,
                enableReviews: gc.enableReviews ?? true,
                enableGuestCheckout: gc.enableGuestCheckout ?? false
            },
            taxSettings: (s.taxSettings as any) || { enableTax: false, pricesIncludeTax: false },
            currencyOptions: {
                currency: s.currency || "AUD",
                currencyPosition: co.currencyPosition || "left",
                thousandSeparator: co.thousandSeparator || ",",
                decimalSeparator: co.decimalSeparator || ".",
                numDecimals: co.numDecimals !== undefined ? co.numDecimals : 2
            }
        });
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const updateNestedData = (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => {
    if (section === 'maintenance') {
        setData(prev => ({ ...prev, maintenance: value }));
    } else {
        setData(prev => ({
            ...prev,
            [section]: { ...(prev[section] as object), [field]: value }
        }));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const formData = new FormData();
    
    formData.append("storeName", data.storeName);
    formData.append("storeEmail", data.storeEmail);
    formData.append("storePhone", data.storePhone);
    formData.append("weightUnit", data.weightUnit);
    formData.append("dimensionUnit", data.dimensionUnit);
    formData.append("maintenance", String(data.maintenance));

    Object.keys(data.socialLinks).forEach(k => formData.append(`social_${k}`, (data.socialLinks as any)[k]));
    Object.keys(data.storeAddress).forEach(k => formData.append(`addr_${k}`, (data.storeAddress as any)[k]));

    formData.append("conf_selling_location", data.generalConfig.sellingLocation);
    formData.append("conf_selling_countries", JSON.stringify(data.generalConfig.sellingCountries));
    formData.append("conf_shipping_location", data.generalConfig.shippingLocation);
    formData.append("conf_shipping_countries", JSON.stringify(data.generalConfig.shippingCountries));
    formData.append("conf_customer_location", data.generalConfig.defaultCustomerLocation);
    formData.append("enable_coupons", String(data.generalConfig.enableCoupons));
    formData.append("calc_coupons_seq", String(data.generalConfig.calcCouponsSequentially));
    
    formData.append("enable_reviews", String(data.generalConfig.enableReviews));
    formData.append("enable_guest_checkout", String(data.generalConfig.enableGuestCheckout));

    formData.append("enable_tax", String(data.taxSettings.enableTax));
    formData.append("prices_include_tax", String(data.taxSettings.pricesIncludeTax));

    formData.append("curr_currency", data.currencyOptions.currency);
    formData.append("curr_position", data.currencyOptions.currencyPosition);
    formData.append("curr_thousand", data.currencyOptions.thousandSeparator);
    formData.append("curr_decimal", data.currencyOptions.decimalSeparator);
    formData.append("curr_decimals", String(data.currencyOptions.numDecimals));

    const res = await updateGeneralSettings(formData);
    if(res.success) toast.success("Settings saved successfully!");
    else toast.error("Failed to save settings.");
    setSaving(false);
  };

  if (loading) {
      return (
          <div className="w-full h-[200px] flex items-center justify-center">
              <Loader2 className="animate-spin text-[#2271b1]" size={28} />
          </div>
      );
  }

  const subTabs = [
    { id: "general", label: "General & Store", icon: Store },
    { id: "regional", label: "Regional & Currency", icon: Globe },
    { id: "social", label: "Social & Links", icon: Share2 },
  ];

  return (
    <div className="w-full text-[13px] text-[#3c434a] animate-in fade-in">
        <h2 className="text-xl font-bold text-slate-800">General & Store Settings</h2>
        {/* WP subsubsub style tabs */}
        <ul className="list-none pt-3 m-0 mb-[20px] text-[13px] text-[#646970] flex flex-wrap items-center">
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

        {/* Form Container */}
        <div >
            <div className="space-y-[30px]">
                {activeSubTab === "general" && (
                    <>
                        <Store_Info data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
                        <Store_Address data={data} updateNestedData={updateNestedData} />
                        <Measurement_Maintenance data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
                    </>
                )}
                {activeSubTab === "regional" && (
                    <>
                        <General_Options data={data} updateNestedData={updateNestedData} />
                        <Currency_options data={data} updateNestedData={updateNestedData} />
                        <Taxes_and_coupons data={data} updateNestedData={updateNestedData} />
                    </>
                )}
                {activeSubTab === "social" && (
                    <Social_Links data={data} updateNestedData={updateNestedData} />
                )}
            </div>

            {/* WP Style Submit Button (At the bottom) */}
            <div className="mt-[30px] pt-[20px] border-t border-[#f0f0f1]">
                <button 
                    onClick={handleSubmit} 
                    disabled={saving} 
                    className="bg-[#2271b1] text-white border border-[#2271b1] hover:bg-[#135e96] hover:border-[#135e96] rounded-[3px] px-[12px] py-[4px] text-[13px] font-semibold cursor-pointer shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 min-h-[30px] w-fit"
                >
                    {saving && <Loader2 size={14} className="animate-spin"/>}
                    {saving ? "Saving Changes..." : "Save changes"}
                </button>
            </div>
        </div>
    </div>
  );
}