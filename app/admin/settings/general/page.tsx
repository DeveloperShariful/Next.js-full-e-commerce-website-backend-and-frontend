// File: app/admin/settings/general/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getGeneralSettings, updateGeneralSettings } from "@/app/actions/settings/general";
import { toast } from "react-hot-toast";
import { GeneralSettingsData } from "./types";
import { Loader2, Save } from "lucide-react";

import Store_Address from "./_components/Store_Address";
import General_Options from "./_components/General_Options";
import Taxes_and_coupons from "./_components/Taxes_and_coupons";
import Currency_options from "./_components/Currency_options";

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<GeneralSettingsData>({
    storeName: "", storeEmail: "", storePhone: "",
    storeAddress: { address1: "", address2: "", city: "", country: "AU:NSW", postcode: "" },
    generalConfig: { 
        sellingLocation: "all", 
        sellingCountries: [],
        shippingLocation: "all", 
        shippingCountries: [],
        defaultCustomerLocation: "shop_base",
        enableCoupons: true,
        calcCouponsSequentially: false 
    },
    taxSettings: { enableTax: false, pricesIncludeTax: false },
    currencyOptions: {
        currency: "AUD",
        currencyPosition: "left",
        thousandSeparator: ",",
        decimalSeparator: ".",
        numDecimals: 2
    }
  });

  useEffect(() => {
    getGeneralSettings().then(res => {
      if(res.success && res.data) {
        const s = res.data;
        
        // ✅ FIX 1: Prisma Json টাইপ হ্যান্ডেল করার জন্য 'any' কাস্ট করা হয়েছে
        const gc = (s.generalConfig as any) || {};
        const co = gc.currencyOptions || {}; 

        setData({
            storeName: s.storeName || "",
            storeEmail: s.storeEmail || "",
            storePhone: s.storePhone || "",
            storeAddress: (s.storeAddress as any) || { address1: "", address2: "", city: "", country: "AU:NSW", postcode: "" },
            generalConfig: {
                sellingLocation: gc.sellingLocation || "all",
                // ✅ Ensure array format
                sellingCountries: Array.isArray(gc.sellingCountries) ? gc.sellingCountries : [],
                shippingLocation: gc.shippingLocation || "all",
                // ✅ Ensure array format
                shippingCountries: Array.isArray(gc.shippingCountries) ? gc.shippingCountries : [],
                defaultCustomerLocation: gc.defaultCustomerLocation || "shop_base",
                enableCoupons: gc.enableCoupons ?? true,
                calcCouponsSequentially: gc.calcCouponsSequentially ?? false
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const updateNestedData = (section: keyof GeneralSettingsData, field: string, value: any) => {
    setData(prev => ({
        ...prev,
        [section]: {
            ...(prev[section] as object),
            [field]: value
        }
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const formData = new FormData();
    
    formData.append("storeName", data.storeName);
    formData.append("storeEmail", data.storeEmail);
    formData.append("storePhone", data.storePhone);

    // Address
    Object.keys(data.storeAddress).forEach(k => {
        formData.append(`addr_${k}`, (data.storeAddress as any)[k]);
    });

    // Configs
    formData.append("conf_selling_location", data.generalConfig.sellingLocation);
    // ✅ FIX 2: অ্যারে ডাটা স্ট্রিং করে পাঠানো হচ্ছে
    formData.append("conf_selling_countries", JSON.stringify(data.generalConfig.sellingCountries));
    formData.append("conf_shipping_location", data.generalConfig.shippingLocation);
    // ✅ FIX 2: অ্যারে ডাটা স্ট্রিং করে পাঠানো হচ্ছে
    formData.append("conf_shipping_countries", JSON.stringify(data.generalConfig.shippingCountries));
    
    formData.append("conf_customer_location", data.generalConfig.defaultCustomerLocation);
    formData.append("enable_coupons", String(data.generalConfig.enableCoupons));
    formData.append("calc_coupons_seq", String(data.generalConfig.calcCouponsSequentially));
    formData.append("enable_tax", String(data.taxSettings.enableTax));

    // Currency Options
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

  if (loading) return <div className="h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto pb-20">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">General Settings</h1>
            <button 
                onClick={handleSubmit} 
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#2271b1] text-white font-bold rounded shadow-sm hover:bg-[#135e96] disabled:opacity-50 text-sm"
            >
                {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                {saving ? "Saving..." : "Save changes"}
            </button>
        </div>

        <Store_Address data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
        <General_Options data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
        <Taxes_and_coupons data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
        <Currency_options data={data} handleChange={handleChange} updateNestedData={updateNestedData} />
    </div>
  );
}