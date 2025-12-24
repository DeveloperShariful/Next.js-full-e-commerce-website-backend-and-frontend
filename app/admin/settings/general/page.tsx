// File: app/admin/settings/general/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getGeneralSettings, updateGeneralSettings } from "@/app/actions/admin/settings/general/general";
import { toast } from "react-hot-toast";
import { Loader2, Save, Store, Globe, Share2 } from "lucide-react";

// Components
import Store_Info from "./_components/Store_Info";
import Store_Address from "./_components/Store_Address";
import General_Options from "./_components/General_Options";
import Taxes_and_coupons from "./_components/Taxes_and_coupons";
import Currency_options from "./_components/Currency_options";
import Measurement_Maintenance from "./_components/Measurement_Maintenance";
import Social_Links from "./_components/Social_Links";

// ✅ UPDATED TYPE DEFINITIONS
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
        // ✅ NEW FIELDS ADDED HERE TO FIX ERROR
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

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

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
        // ✅ Default Values
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
                // ✅ Load from DB
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
    
    // Flatten data
    formData.append("storeName", data.storeName);
    formData.append("storeEmail", data.storeEmail);
    formData.append("storePhone", data.storePhone);
    formData.append("weightUnit", data.weightUnit);
    formData.append("dimensionUnit", data.dimensionUnit);
    formData.append("maintenance", String(data.maintenance));

    Object.keys(data.socialLinks).forEach(k => formData.append(`social_${k}`, (data.socialLinks as any)[k]));
    Object.keys(data.storeAddress).forEach(k => formData.append(`addr_${k}`, (data.storeAddress as any)[k]));

    // Configs
    formData.append("conf_selling_location", data.generalConfig.sellingLocation);
    formData.append("conf_selling_countries", JSON.stringify(data.generalConfig.sellingCountries));
    formData.append("conf_shipping_location", data.generalConfig.shippingLocation);
    formData.append("conf_shipping_countries", JSON.stringify(data.generalConfig.shippingCountries));
    formData.append("conf_customer_location", data.generalConfig.defaultCustomerLocation);
    formData.append("enable_coupons", String(data.generalConfig.enableCoupons));
    formData.append("calc_coupons_seq", String(data.generalConfig.calcCouponsSequentially));
    
    // ✅ NEW FIELDS APPEND
    formData.append("enable_reviews", String(data.generalConfig.enableReviews));
    formData.append("enable_guest_checkout", String(data.generalConfig.enableGuestCheckout));

    formData.append("enable_tax", String(data.taxSettings.enableTax));
    formData.append("prices_include_tax", String(data.taxSettings.pricesIncludeTax));

    // Currency
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

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  const tabs = [
    { id: "general", label: "General & Store", icon: Store },
    { id: "regional", label: "Regional & Currency", icon: Globe },
    { id: "social", label: "Social & Links", icon: Share2 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">General Settings</h1>
                <p className="text-slate-500 text-sm">Manage store details, address, and regional settings.</p>
            </div>
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-[#2271b1] text-white font-bold rounded shadow hover:bg-[#135e96] disabled:opacity-50 text-sm transition-all">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                {saving ? "Saving Changes..." : "Save Changes"}
            </button>
        </div>

        <div className="border-b border-slate-200 flex space-x-1 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                        ? "border-[#2271b1] text-[#2271b1] bg-blue-50/50"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="animate-in fade-in space-y-6">
            {activeTab === "general" && (
                <>
                    <Store_Info data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
                    <Store_Address data={data} updateNestedData={updateNestedData} />
                    <Measurement_Maintenance data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
                </>
            )}
            {activeTab === "regional" && (
                <>
                    {/* ✅ এখানে handleChange বাদ দেওয়া হয়েছে কারণ General_Options এ এটা লাগে না */}
                    <General_Options data={data} updateNestedData={updateNestedData} />
                    <Currency_options data={data} updateNestedData={updateNestedData} />
                    <Taxes_and_coupons data={data} updateNestedData={updateNestedData} />
                </>
            )}
            {activeTab === "social" && (
                <Social_Links data={data} updateNestedData={updateNestedData} />
            )}
        </div>
    </div>
  );
}