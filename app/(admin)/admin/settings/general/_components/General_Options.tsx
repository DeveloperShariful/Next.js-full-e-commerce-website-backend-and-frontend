// File: app/admin/settings/general/_components/General_Options.tsx

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X, Check, Star, User } from "lucide-react";
import { getAllCountries } from "@/app/actions/admin/settings/general/location-helpers";
import { GeneralSettingsData } from "../page";

interface Props {
    data: GeneralSettingsData;
    updateNestedData: (section: keyof GeneralSettingsData | 'maintenance', field: string, value: any) => void;
}

export default function General_Options({ data, updateNestedData }: Props) {
    const allCountries = getAllCountries();
    
    // --- MULTI SELECT STATE ---
    const [searchSell, setSearchSell] = useState("");
    const [searchShip, setSearchShip] = useState("");
    const [sellDropdownOpen, setSellDropdownOpen] = useState(false);
    const [shipDropdownOpen, setShipDropdownOpen] = useState(false);
    
    const sellWrapperRef = useRef<HTMLDivElement>(null);
    const shipWrapperRef = useRef<HTMLDivElement>(null);

    // Click outside handler to close dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (sellWrapperRef.current && !sellWrapperRef.current.contains(event.target as Node)) {
                setSellDropdownOpen(false);
            }
            if (shipWrapperRef.current && !shipWrapperRef.current.contains(event.target as Node)) {
                setShipDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Toggle logic for multi-select countries
    const toggleCountry = (type: 'selling' | 'shipping', code: string) => {
        const currentList = type === 'selling' ? data.generalConfig.sellingCountries : data.generalConfig.shippingCountries;
        let newList;
        if (currentList.includes(code)) {
            newList = currentList.filter(c => c !== code);
        } else {
            newList = [...currentList, code];
        }
        updateNestedData('generalConfig', type === 'selling' ? 'sellingCountries' : 'shippingCountries', newList);
    };

    const removeTag = (type: 'selling' | 'shipping', code: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toggleCountry(type, code);
    };

    return (
        <div className="bg-white p-6 rounded-sm border border-gray-300 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">General options</h3>
            
            <div className="space-y-6 max-w-3xl">
                
                {/* ======================= 1. SELLING LOCATIONS ======================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Selling location(s) <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <select 
                            value={data.generalConfig.sellingLocation}
                            onChange={(e) => updateNestedData('generalConfig', 'sellingLocation', e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white"
                        >
                            <option value="all">Sell to all countries</option>
                            <option value="all_except">Sell to all countries, except for...</option>
                            <option value="specific">Sell to specific countries</option>
                        </select>
                    </div>
                </div>

                {/* Selling Countries Multi-Select (Shows only if specific/except selected) */}
                {(data.generalConfig.sellingLocation === 'specific' || data.generalConfig.sellingLocation === 'all_except') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <label className="text-xs font-bold text-gray-700 pt-2">
                            {data.generalConfig.sellingLocation === 'specific' ? 'Sell to specific countries' : 'Exclude countries'}
                        </label>
                        <div className="md:col-span-2 relative" ref={sellWrapperRef}>
                            <div 
                                onClick={() => setSellDropdownOpen(true)}
                                className="w-full border border-gray-300 px-2 py-1.5 rounded-sm min-h-[38px] flex flex-wrap gap-1 cursor-text bg-white"
                            >
                                {data.generalConfig.sellingCountries.map(code => {
                                    const country = allCountries.find(c => c.value === code);
                                    return (
                                        <span key={code} className="bg-gray-100 border border-gray-300 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                            {country?.label} <X size={10} className="cursor-pointer hover:text-red-500" onClick={(e) => removeTag('selling', code, e)}/>
                                        </span>
                                    );
                                })}
                                <input 
                                    value={searchSell}
                                    onChange={(e) => setSearchSell(e.target.value)}
                                    placeholder={data.generalConfig.sellingCountries.length === 0 ? "Select countries..." : ""}
                                    className="flex-1 outline-none text-sm min-w-[100px] bg-transparent py-0.5"
                                    onFocus={() => setSellDropdownOpen(true)}
                                />
                            </div>
                            
                            {/* Dropdown List */}
                            {sellDropdownOpen && (
                                <div className="absolute z-50 top-full left-0 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto shadow-lg rounded-sm">
                                    {allCountries.filter(c => c.label.toLowerCase().includes(searchSell.toLowerCase())).map(c => (
                                        <div 
                                            key={c.value} 
                                            onClick={() => { toggleCountry('selling', c.value); setSearchSell(""); }}
                                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#2271b1] hover:text-white flex justify-between items-center ${data.generalConfig.sellingCountries.includes(c.value) ? 'bg-gray-100' : ''}`}
                                        >
                                            {c.label}
                                            {data.generalConfig.sellingCountries.includes(c.value) && <Check size={14}/>}
                                        </div>
                                    ))}
                                    {allCountries.filter(c => c.label.toLowerCase().includes(searchSell.toLowerCase())).length === 0 && (
                                        <div className="px-3 py-2 text-sm text-gray-500">No countries found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ======================= 2. SHIPPING LOCATIONS ======================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Shipping location(s) <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <select 
                            value={data.generalConfig.shippingLocation}
                            onChange={(e) => updateNestedData('generalConfig', 'shippingLocation', e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white"
                        >
                            <option value="all_selling">Ship to all countries you sell to</option>
                            <option value="all">Ship to all countries</option>
                            <option value="specific">Ship to specific countries only</option>
                            <option value="disabled">Disable shipping & shipping calculations</option>
                        </select>
                    </div>
                </div>

                {/* Shipping Countries Multi-Select (Shows only if specific selected) */}
                {data.generalConfig.shippingLocation === 'specific' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <label className="text-xs font-bold text-gray-700 pt-2">Ship to specific countries</label>
                        <div className="md:col-span-2 relative" ref={shipWrapperRef}>
                            <div 
                                onClick={() => setShipDropdownOpen(true)}
                                className="w-full border border-gray-300 px-2 py-1.5 rounded-sm min-h-[38px] flex flex-wrap gap-1 cursor-text bg-white"
                            >
                                {data.generalConfig.shippingCountries.map(code => {
                                    const country = allCountries.find(c => c.value === code);
                                    return (
                                        <span key={code} className="bg-gray-100 border border-gray-300 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                                            {country?.label} <X size={10} className="cursor-pointer hover:text-red-500" onClick={(e) => removeTag('shipping', code, e)}/>
                                        </span>
                                    );
                                })}
                                <input 
                                    value={searchShip}
                                    onChange={(e) => setSearchShip(e.target.value)}
                                    placeholder={data.generalConfig.shippingCountries.length === 0 ? "Select countries..." : ""}
                                    className="flex-1 outline-none text-sm min-w-[100px] bg-transparent py-0.5"
                                    onFocus={() => setShipDropdownOpen(true)}
                                />
                            </div>
                            
                            {/* Dropdown List */}
                            {shipDropdownOpen && (
                                <div className="absolute z-50 top-full left-0 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto shadow-lg rounded-sm">
                                    {allCountries.filter(c => c.label.toLowerCase().includes(searchShip.toLowerCase())).map(c => (
                                        <div 
                                            key={c.value} 
                                            onClick={() => { toggleCountry('shipping', c.value); setSearchShip(""); }}
                                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#2271b1] hover:text-white flex justify-between items-center ${data.generalConfig.shippingCountries.includes(c.value) ? 'bg-gray-100' : ''}`}
                                        >
                                            {c.label}
                                            {data.generalConfig.shippingCountries.includes(c.value) && <Check size={14}/>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ======================= 3. DEFAULT CUSTOMER LOCATION ======================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        Default customer location <HelpCircle size={12} className="text-gray-400"/>
                    </label>
                    <div className="md:col-span-2">
                        <select 
                            value={data.generalConfig.defaultCustomerLocation}
                            onChange={(e) => updateNestedData('generalConfig', 'defaultCustomerLocation', e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:border-[#2271b1] outline-none text-sm bg-white"
                        >
                            <option value="no_address">No location by default</option>
                            <option value="shop_base">Shop country/region</option>
                            <option value="geoip">Geolocate</option>
                            <option value="geoip_address">Geolocate (with page caching support)</option>
                        </select>
                    </div>
                </div>

                <hr className="border-gray-200 my-4"/>

                {/* ======================= 4. REVIEWS & CHECKOUT ======================= */}
                <h4 className="text-sm font-bold text-gray-800 mb-3">Reviews & Checkout</h4>
                
                {/* Enable Reviews */}
                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        id="enable_reviews"
                        checked={data.generalConfig.enableReviews} 
                        onChange={(e) => updateNestedData('generalConfig', 'enableReviews', e.target.checked)} 
                        className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-gray-300 focus:ring-[#2271b1]"
                    />
                    <div>
                        <label htmlFor="enable_reviews" className="block text-sm text-gray-700 select-none cursor-pointer flex items-center gap-1">
                            Enable product reviews <Star size={12} className="text-gray-400"/>
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">Allow customers to leave reviews on products.</p>
                    </div>
                </div>

                {/* Enable Guest Checkout */}
                <div className="flex items-start gap-3 mt-4">
                    <input 
                        type="checkbox" 
                        id="enable_guest_checkout"
                        checked={data.generalConfig.enableGuestCheckout} 
                        onChange={(e) => updateNestedData('generalConfig', 'enableGuestCheckout', e.target.checked)} 
                        className="mt-0.5 w-4 h-4 text-[#2271b1] rounded border-gray-300 focus:ring-[#2271b1]"
                    />
                    <div>
                        <label htmlFor="enable_guest_checkout" className="block text-sm text-gray-700 select-none cursor-pointer flex items-center gap-1">
                            Enable guest checkout <User size={12} className="text-gray-400"/>
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">Allow customers to place orders without an account.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}