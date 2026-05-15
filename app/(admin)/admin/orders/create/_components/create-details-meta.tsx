// File Location: app/admin/orders/create/_components/create-details-meta.tsx

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Edit2, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner"; 
import { searchCustomers } from "@/app/actions/admin/order/create_order/search-resources";
import { searchTransdirectLocations } from "@/app/actions/admin/order/transdirect-locations"; 
import { OrderDataType, CustomerType } from "../types"; 

interface CreateDetailsMetaProps {
  orderData: OrderDataType;
  setOrderData: React.Dispatch<React.SetStateAction<OrderDataType>>;
}

export const CreateDetailsMeta = ({ orderData, setOrderData }: CreateDetailsMetaProps) => {
  const [editBilling, setEditBilling] = useState(true); 
  const [editShipping, setEditShipping] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerType[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);

  type LocationSuggestion = { city: string; state: string; postcode: string | number };
  
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<"bill" | "ship" | null>(null);
  const [searchingLoc, setSearchingLoc] = useState(false);

  // 🔥 FIXED: Separate search states for Billing and Shipping
  const [billSearch, setBillSearch] = useState(orderData.billing.city || orderData.billing.postcode || "");
  const [shipSearch, setShipSearch] = useState(orderData.shipping.city || orderData.shipping.postcode || "");

  const updateGeneral = (field: keyof OrderDataType, value: string | Date | CustomerType | null) => {
      setOrderData((prev) => ({ ...prev, [field]: value }));
  };
  
  const updateBilling = (field: keyof OrderDataType['billing'], value: string) => {
      setOrderData((prev) => ({ ...prev, billing: { ...prev.billing, [field]: value } }));
  };

  const updateShipping = (field: keyof OrderDataType['shipping'], value: string) => {
      setOrderData((prev) => ({ ...prev, shipping: { ...prev.shipping, [field]: value } }));
  };

  const selectCustomer = (cust: CustomerType) => {
      setSearchQuery("");
      setSearchResults([]);
      const addr = cust.addresses?.[0] || {};
      
      setOrderData((prev) => ({
          ...prev,
          customer: cust,
          guestEmail: cust.email,
          guestPhone: cust.phone || "",
          billing: {
              ...prev.billing,
              firstName: cust.name.split(" ")[0] || "",
              lastName: cust.name.split(" ").slice(1).join(" ") || "",
              city: addr.city || "",
              postcode: addr.postcode ? String(addr.postcode) : "",
          },
          shipping: {
              ...prev.shipping,
              firstName: cust.name.split(" ")[0] || "",
              lastName: cust.name.split(" ").slice(1).join(" ") || "",
              city: addr.city || "",
              postcode: addr.postcode ? String(addr.postcode) : "",
          }
      }));
      setEditBilling(false);
      setEditShipping(false);
      toast.success("Customer loaded.");
  };

  const removeCustomer = () => {
      setOrderData((prev) => ({ ...prev, customer: null }));
  };

  // 🔥 RESTORED: Dynamic Suburb/Postcode Search for BOTH inputs
  const handleLocationSearch = async (val: string, type: "bill" | "ship") => {
      if (type === "bill") setBillSearch(val);
      else setShipSearch(val);
      
      if (val.length > 2) {
          setSearchingLoc(true);
          setShowSuggestions(type);
          const results = await searchTransdirectLocations(val);
          setSuggestions(results as LocationSuggestion[]);
          setSearchingLoc(false);
      } else {
          setSuggestions([]);
          setShowSuggestions(null);
      }
  };

  const selectLocation = (loc: LocationSuggestion, type: "bill" | "ship") => {
      if (type === "bill") {
          setBillSearch(loc.city);
          updateBilling("city", loc.city);
          updateBilling("state", loc.state);
          updateBilling("postcode", String(loc.postcode));
      } else {
          setShipSearch(loc.city);
          updateShipping("city", loc.city);
          updateShipping("state", loc.state);
          updateShipping("postcode", String(loc.postcode));
      }
      setShowSuggestions(null);
  };

  return (
    <div className="bg-white border border-[#c3c4c7] shadow-[0_1px_1px_rgba(0,0,0,0.04)] mb-5 rounded-[3px] relative z-20">
      
      <div className="px-4 py-3 border-b border-[#c3c4c7]">
        <h2 className="text-[14px] font-semibold text-[#1d2327] m-0">Order details</h2>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* GENERAL COLUMN */}
        <div>
            <h3 className="text-[14px] font-semibold text-[#1d2327] mb-3">General</h3>
            <div className="space-y-4">
                <div className="space-y-1 text-[13px] text-[#3c434a]">
                    <label className="block mb-1 text-[#646970]">Date created:</label>
                    <div className="flex items-center gap-1">
                        <input type="text" readOnly value={format(orderData.createdAt, "yyyy-MM-dd")} className="w-[100px] h-[28px] px-2 border border-[#8c8f94] bg-[#f6f7f7] rounded-[3px] text-center text-[#646970]" />
                    </div>
                </div>

                <div className="space-y-1 text-[13px]">
                    <label className="block mb-1 text-[#646970]">Status:</label>
                    <select 
                        value={orderData.status}
                        onChange={(e) => updateGeneral("status", e.target.value)}
                        className="w-full max-w-[250px] h-[28px] px-2 border border-[#8c8f94] bg-white text-[#32373c] rounded-[3px] outline-none focus:border-[#2271b1] shadow-sm cursor-pointer"
                    >
                        <option value="PENDING">Pending payment</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="DELIVERED">Completed</option>
                    </select>
                </div>

                <div className="space-y-1 text-[13px] relative">
                    <label className="block mb-1 text-[#646970]">Customer:</label>
                    
                    {orderData.customer ? (
                        <div className="w-full max-w-[250px] h-[28px] px-2 border border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] flex justify-between items-center shadow-sm">
                            <span className="truncate">{orderData.customer.name} ({orderData.customer.email})</span>
                            <button onClick={removeCustomer} className="text-[#d63638] hover:text-red-800"><X size={14}/></button>
                        </div>
                    ) : (
                        <div className="relative w-full max-w-[250px]">
                            <div className="absolute left-2 top-[6px] text-[#8c8f94]"><Search size={14}/></div>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.length > 2) {
                                        setSearchingCustomer(true);
                                        searchCustomers(e.target.value).then(res => {
                                            setSearchResults(res as CustomerType[]);
                                            setSearchingCustomer(false);
                                        });
                                    } else setSearchResults([]);
                                }}
                                placeholder="Guest (Type to search registered...)"
                                className="w-full h-[28px] pl-7 pr-2 border border-[#8c8f94] bg-white text-[#32373c] rounded-[3px] outline-none focus:border-[#2271b1] shadow-sm"
                            />
                            {searchingCustomer && <Loader2 size={12} className="absolute right-2 top-[8px] animate-spin text-[#2271b1]"/>}

                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-white border border-[#2271b1] shadow-xl rounded-[3px] mt-1 max-h-48 overflow-y-auto z-[999]">
                                    {searchResults.map((cust) => (
                                        <div 
                                            key={cust.id}
                                            onClick={() => selectCustomer(cust)}
                                            className="px-3 py-2 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0"
                                        >
                                            <div className="font-semibold">{cust.name}</div>
                                            <div className="opacity-80">{cust.email}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* BILLING COLUMN */}
        <div>
            <div className="flex justify-between items-center mb-3 group">
                <h3 className="text-[14px] font-semibold text-[#1d2327]">Billing</h3>
                {!editBilling && <button onClick={() => setEditBilling(true)} className="text-[#a7aaad] hover:text-[#2271b1]"><Edit2 size={14} /></button>}
            </div>
            
            {editBilling ? (
                <div className="space-y-2 text-[12px] bg-[#f6f7f7] p-3 border border-[#e2e4e7] rounded-[3px] shadow-inner">
                    <input placeholder="First Name" value={orderData.billing.firstName} onChange={e => updateBilling("firstName", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Last Name" value={orderData.billing.lastName} onChange={e => updateBilling("lastName", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Company" value={orderData.billing.company} onChange={e => updateBilling("company", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Address Line 1" value={orderData.billing.address1} onChange={e => updateBilling("address1", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Address Line 2" value={orderData.billing.address2} onChange={e => updateBilling("address2", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    
                    {/* 🔥 SUBURB / POSTCODE SEARCH */}
                    <div className="relative">
                        <input placeholder="Suburb / Postcode (Type to search)" value={billSearch} onChange={e => handleLocationSearch(e.target.value, "bill")} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        {searchingLoc && showSuggestions === "bill" && <Loader2 size={12} className="absolute right-2 top-2 animate-spin text-[#2271b1]"/>}
                        {showSuggestions === "bill" && suggestions.length > 0 && (
                            <div className="absolute z-[999] w-full bg-white border border-[#2271b1] shadow-xl max-h-40 overflow-y-auto mt-1 rounded-[3px]">
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => selectLocation(s, "bill")} className="px-2 py-1.5 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0">
                                        <span className="font-semibold">{s.city}</span>, {s.state} {s.postcode}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <input placeholder="State" value={orderData.billing.state} onChange={e => updateBilling("state", e.target.value)} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        <input placeholder="Postcode" value={orderData.billing.postcode} onChange={e => updateBilling("postcode", e.target.value)} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    </div>

                    <input placeholder="Email address" value={orderData.guestEmail} onChange={e => updateGeneral("guestEmail", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] mt-2 outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Phone" value={orderData.guestPhone} onChange={e => updateGeneral("guestPhone", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    
                    <button onClick={(e) => { e.preventDefault(); setEditBilling(false); }} className="bg-[#f0f0f1] text-[#3c434a] border border-[#8c8f94] hover:bg-[#e2e4e7] px-3 py-1 mt-1 rounded-[3px] transition-colors w-full font-medium">Close</button>
                </div>
            ) : (
                <div className="text-[13px] text-[#3c434a] leading-relaxed">
                    <p className="m-0">{orderData.billing.firstName} {orderData.billing.lastName}</p>
                    <p className="m-0">{orderData.billing.address1}</p>
                    <p className="m-0">{orderData.billing.city} {orderData.billing.state} {orderData.billing.postcode}</p>
                    <p className="m-0 mt-2 text-[#2271b1]">{orderData.guestEmail}</p>
                    <p className="m-0 text-[#2271b1]">{orderData.guestPhone}</p>
                </div>
            )}
        </div>

        {/* SHIPPING COLUMN */}
        <div>
            <div className="flex justify-between items-center mb-3 group">
                <h3 className="text-[14px] font-semibold text-[#1d2327]">Shipping</h3>
                {!editShipping && <button onClick={() => setEditShipping(true)} className="text-[#a7aaad] hover:text-[#2271b1]"><Edit2 size={14} /></button>}
            </div>
            
            {editShipping ? (
                <div className="space-y-2 text-[12px] bg-[#f6f7f7] p-3 border border-[#e2e4e7] rounded-[3px] shadow-inner">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            setOrderData((prev) => ({ ...prev, shipping: { ...prev.billing } }));
                            setShipSearch(orderData.billing.city); // Sync search field too
                            setEditShipping(false);
                        }}
                        className="w-full bg-white border border-[#2271b1] text-[#2271b1] hover:bg-[#f0f0f1] px-2 py-1 mb-2 rounded-[3px] font-medium"
                    >
                        Copy from Billing
                    </button>

                    <input placeholder="First Name" value={orderData.shipping.firstName} onChange={e => updateShipping("firstName", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Last Name" value={orderData.shipping.lastName} onChange={e => updateShipping("lastName", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Company" value={orderData.shipping.company} onChange={e => updateShipping("company", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Address Line 1" value={orderData.shipping.address1} onChange={e => updateShipping("address1", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    <input placeholder="Address Line 2" value={orderData.shipping.address2} onChange={e => updateShipping("address2", e.target.value)} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    
                    {/* 🔥 SUBURB / POSTCODE SEARCH */}
                    <div className="relative">
                        <input placeholder="Suburb / Postcode (Type to search)" value={shipSearch} onChange={e => handleLocationSearch(e.target.value, "ship")} className="w-full h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        {searchingLoc && showSuggestions === "ship" && <Loader2 size={12} className="absolute right-2 top-2 animate-spin text-[#2271b1]"/>}
                        {showSuggestions === "ship" && suggestions.length > 0 && (
                            <div className="absolute z-[999] w-full bg-white border border-[#2271b1] shadow-xl max-h-40 overflow-y-auto mt-1 rounded-[3px]">
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => selectLocation(s, "ship")} className="px-2 py-1.5 text-[12px] hover:bg-[#2271b1] hover:text-white cursor-pointer border-b border-[#f0f0f1] last:border-0">
                                        <span className="font-semibold">{s.city}</span>, {s.state} {s.postcode}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        <input placeholder="State" value={orderData.shipping.state} onChange={e => updateShipping("state", e.target.value)} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                        <input placeholder="Postcode" value={orderData.shipping.postcode} onChange={e => updateShipping("postcode", e.target.value)} className="w-1/2 h-[26px] px-2 border border-[#8c8f94] rounded-[3px] outline-none focus:border-[#2271b1]"/>
                    </div>
                    
                    <button onClick={(e) => { e.preventDefault(); setEditShipping(false); }} className="bg-[#f0f0f1] text-[#3c434a] border border-[#8c8f94] hover:bg-[#e2e4e7] px-3 py-1 mt-1 rounded-[3px] transition-colors w-full font-medium">Close</button>
                </div>
            ) : (
                <div className="text-[13px] text-[#3c434a] leading-relaxed">
                    <p className="m-0">{orderData.shipping.firstName} {orderData.shipping.lastName}</p>
                    <p className="m-0">{orderData.shipping.address1}</p>
                    <p className="m-0">{orderData.shipping.city} {orderData.shipping.state} {orderData.shipping.postcode}</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};