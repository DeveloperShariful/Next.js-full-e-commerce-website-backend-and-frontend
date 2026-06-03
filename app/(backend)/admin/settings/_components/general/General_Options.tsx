// File: app/(backend)/admin/settings/_components/general/General_Options.tsx

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X, Check, Star, User } from "lucide-react";
import { getAllCountries } from "@/app/actions/backend/settings/general/location-helpers";
import { GeneralSettingsData } from "../GeneralTab";

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

    // WP Responsive Form Classes
    const wpInputClass = "border border-[#8c8f94] rounded-[3px] px-[8px] py-[3px] text-[13px] text-[#2c3338] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] focus:border-[#2271b1] focus:shadow-[0_0_0_1px_#2271b1] focus:outline-none w-full md:w-[25em] max-w-full box-border bg-white";
    const wpMultiSelectWrapper = "border border-[#8c8f94] rounded-[3px] px-[4px] py-[2px] text-[13px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.07)] min-h-[30px] w-full md:w-[25em] max-w-full box-border bg-white flex flex-wrap gap-[4px] cursor-text focus-within:border-[#2271b1] focus-within:shadow-[0_0_0_1px_#2271b1]";
    const wpTagClass = "bg-[#f0f0f1] border border-[#c3c4c7] text-[#3c434a] text-[12px] px-[6px] py-[2px] rounded-[3px] flex items-center gap-1 leading-tight";
    
    const trResponsiveClass = "block md:table-row border-b border-[#f0f0f1] md:border-none pb-4 md:pb-0 mb-4 md:mb-0 align-top";
    const thResponsiveClass = "block md:table-cell w-full md:w-[250px] pt-[5px] md:py-[15px] pr-[10px] text-[13px] font-medium text-[#1d2327] mb-1 md:mb-0 align-top";
    const tdResponsiveClass = "block md:table-cell py-[5px] md:py-[15px] align-top";

    return (
        <div className="w-full mb-[30px]">
            <h2 className="text-[14px] font-semibold text-[#1d2327] mb-0 pb-0 border-none">General options</h2>
            
            <table className="w-full text-left border-collapse block md:table mt-[10px]">
                <tbody className="block md:table-row-group">
                    
                    {/* 1. SELLING LOCATIONS */}
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="flex items-center gap-1 cursor-pointer">
                                Selling location(s) <HelpCircle size={14} className="text-[#a7aaad]"/>
                            </label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                value={data.generalConfig.sellingLocation}
                                onChange={(e) => updateNestedData('generalConfig', 'sellingLocation', e.target.value)}
                                className={wpInputClass}
                            >
                                <option value="all">Sell to all countries</option>
                                <option value="all_except">Sell to all countries, except for...</option>
                                <option value="specific">Sell to specific countries</option>
                            </select>
                        </td>
                    </tr>

                    {(data.generalConfig.sellingLocation === 'specific' || data.generalConfig.sellingLocation === 'all_except') && (
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">
                                    {data.generalConfig.sellingLocation === 'specific' ? 'Sell to specific countries' : 'Exclude countries'}
                                </label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <div className="relative w-full md:w-[25em] max-w-full" ref={sellWrapperRef}>
                                    <div onClick={() => setSellDropdownOpen(true)} className={wpMultiSelectWrapper}>
                                        {data.generalConfig.sellingCountries.map(code => {
                                            const country = allCountries.find(c => c.value === code);
                                            return (
                                                <span key={code} className={wpTagClass}>
                                                    {country?.label} <X size={12} className="cursor-pointer text-[#a7aaad] hover:text-[#d63638]" onClick={(e) => removeTag('selling', code, e)}/>
                                                </span>
                                            );
                                        })}
                                        <input 
                                            value={searchSell}
                                            onChange={(e) => setSearchSell(e.target.value)}
                                            placeholder={data.generalConfig.sellingCountries.length === 0 ? "Select countries..." : ""}
                                            className="flex-1 outline-none text-[13px] min-w-[100px] bg-transparent py-0.5 border-none shadow-none"
                                            onFocus={() => setSellDropdownOpen(true)}
                                        />
                                    </div>
                                    
                                    {sellDropdownOpen && (
                                        <div className="absolute z-50 top-full left-0 w-full bg-white border border-[#8c8f94] mt-[1px] max-h-[200px] overflow-y-auto shadow-md rounded-[3px]">
                                            {allCountries.filter(c => c.label.toLowerCase().includes(searchSell.toLowerCase())).map(c => (
                                                <div 
                                                    key={c.value} 
                                                    onClick={() => { toggleCountry('selling', c.value); setSearchSell(""); }}
                                                    className={`px-[12px] py-[6px] text-[13px] cursor-pointer hover:bg-[#2271b1] hover:text-white flex justify-between items-center ${data.generalConfig.sellingCountries.includes(c.value) ? 'bg-[#f0f0f1]' : ''}`}
                                                >
                                                    {c.label}
                                                    {data.generalConfig.sellingCountries.includes(c.value) && <Check size={14}/>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}

                    {/* 2. SHIPPING LOCATIONS */}
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="flex items-center gap-1 cursor-pointer">
                                Shipping location(s) <HelpCircle size={14} className="text-[#a7aaad]"/>
                            </label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                value={data.generalConfig.shippingLocation}
                                onChange={(e) => updateNestedData('generalConfig', 'shippingLocation', e.target.value)}
                                className={wpInputClass}
                            >
                                <option value="all_selling">Ship to all countries you sell to</option>
                                <option value="all">Ship to all countries</option>
                                <option value="specific">Ship to specific countries only</option>
                                <option value="disabled">Disable shipping & shipping calculations</option>
                            </select>
                        </td>
                    </tr>

                    {data.generalConfig.shippingLocation === 'specific' && (
                        <tr className={trResponsiveClass}>
                            <th scope="row" className={thResponsiveClass}>
                                <label className="cursor-pointer">Ship to specific countries</label>
                            </th>
                            <td className={tdResponsiveClass}>
                                <div className="relative w-full md:w-[25em] max-w-full" ref={shipWrapperRef}>
                                    <div onClick={() => setShipDropdownOpen(true)} className={wpMultiSelectWrapper}>
                                        {data.generalConfig.shippingCountries.map(code => {
                                            const country = allCountries.find(c => c.value === code);
                                            return (
                                                <span key={code} className={wpTagClass}>
                                                    {country?.label} <X size={12} className="cursor-pointer text-[#a7aaad] hover:text-[#d63638]" onClick={(e) => removeTag('shipping', code, e)}/>
                                                </span>
                                            );
                                        })}
                                        <input 
                                            value={searchShip}
                                            onChange={(e) => setSearchShip(e.target.value)}
                                            placeholder={data.generalConfig.shippingCountries.length === 0 ? "Select countries..." : ""}
                                            className="flex-1 outline-none text-[13px] min-w-[100px] bg-transparent py-0.5 border-none shadow-none"
                                            onFocus={() => setShipDropdownOpen(true)}
                                        />
                                    </div>
                                    
                                    {shipDropdownOpen && (
                                        <div className="absolute z-50 top-full left-0 w-full bg-white border border-[#8c8f94] mt-[1px] max-h-[200px] overflow-y-auto shadow-md rounded-[3px]">
                                            {allCountries.filter(c => c.label.toLowerCase().includes(searchShip.toLowerCase())).map(c => (
                                                <div 
                                                    key={c.value} 
                                                    onClick={() => { toggleCountry('shipping', c.value); setSearchShip(""); }}
                                                    className={`px-[12px] py-[6px] text-[13px] cursor-pointer hover:bg-[#2271b1] hover:text-white flex justify-between items-center ${data.generalConfig.shippingCountries.includes(c.value) ? 'bg-[#f0f0f1]' : ''}`}
                                                >
                                                    {c.label}
                                                    {data.generalConfig.shippingCountries.includes(c.value) && <Check size={14}/>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}

                    {/* 3. DEFAULT CUSTOMER LOCATION */}
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="flex items-center gap-1 cursor-pointer">
                                Default customer location <HelpCircle size={14} className="text-[#a7aaad]"/>
                            </label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <select 
                                value={data.generalConfig.defaultCustomerLocation}
                                onChange={(e) => updateNestedData('generalConfig', 'defaultCustomerLocation', e.target.value)}
                                className={wpInputClass}
                            >
                                <option value="no_address">No location by default</option>
                                <option value="shop_base">Shop country/region</option>
                                <option value="geoip">Geolocate</option>
                                <option value="geoip_address">Geolocate (with page caching support)</option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 4. REVIEWS & CHECKOUT */}
            <h2 className="text-[14px] font-semibold text-[#1d2327] mt-[30px] mb-0 pb-0 border-none">Reviews & Checkout</h2>
            <table className="w-full text-left border-collapse block md:table mt-[10px]">
                <tbody className="block md:table-row-group">
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Product reviews</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <label className="flex items-start gap-2 cursor-pointer w-fit">
                                <input 
                                    type="checkbox" 
                                    checked={data.generalConfig.enableReviews} 
                                    onChange={(e) => updateNestedData('generalConfig', 'enableReviews', e.target.checked)} 
                                    className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                />
                                <div>
                                    <span className="text-[13px] text-[#3c434a] block">Enable product reviews</span>
                                </div>
                            </label>
                        </td>
                    </tr>
                    
                    <tr className={trResponsiveClass}>
                        <th scope="row" className={thResponsiveClass}>
                            <label className="cursor-pointer">Guest checkout</label>
                        </th>
                        <td className={tdResponsiveClass}>
                            <label className="flex items-start gap-2 cursor-pointer w-fit">
                                <input 
                                    type="checkbox" 
                                    checked={data.generalConfig.enableGuestCheckout} 
                                    onChange={(e) => updateNestedData('generalConfig', 'enableGuestCheckout', e.target.checked)} 
                                    className="border-[#8c8f94] rounded-[3px] focus:ring-[#2271b1] text-[#2271b1] w-4 h-4 mt-[1px]"
                                />
                                <div>
                                    <span className="text-[13px] text-[#3c434a] block">Allow customers to place orders without an account</span>
                                </div>
                            </label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}