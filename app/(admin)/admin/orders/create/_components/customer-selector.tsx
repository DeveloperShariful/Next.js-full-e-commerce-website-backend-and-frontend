// File: app/admin/orders/create/_components/customer-selector.tsx

"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, Trash2, UserPlus, MapPin, Loader2 } from "lucide-react"; 
import { searchCustomers } from "@/app/actions/admin/create_order/search-resources";
import { searchTransdirectLocations } from "@/app/actions/admin/order/transdirect-locations"; 
import { toast } from "sonner";

// ✅ FIX: Added onAddressChange to interface
interface CustomerSelectorProps {
    onSelect: (customer: any, type: 'registered' | 'guest') => void;
    selectedCustomer: any;
    onRemove: () => void;
    onAddressChange?: (address: { city: string; postcode: string; state: string; country: string } | null) => void;
}

export const CustomerSelector = ({ onSelect, selectedCustomer, onRemove, onAddressChange }: CustomerSelectorProps) => {
    const [activeTab, setActiveTab] = useState("search");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    
    // Guest States
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    
    const [guestAddress, setGuestAddress] = useState("");
    const [guestCity, setGuestCity] = useState("");
    const [guestState, setGuestState] = useState("");
    const [guestPostcode, setGuestPostcode] = useState("");
    const [guestCountry, setGuestCountry] = useState("Australia");

    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchingLoc, setSearchingLoc] = useState(false);

    // Helper to notify parent
    const notifyAddressChange = (city: string, postcode: string, state: string) => {
        if (onAddressChange) {
            onAddressChange({
                city,
                postcode,
                state,
                country: "Australia"
            });
        }
    };

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length > 0) {
            const res = await searchCustomers(val);
            setResults(res);
        } else {
            setResults([]);
        }
    };

    const handleCityChange = async (val: string) => {
        setGuestCity(val);
        
        if (val.length > 1) {
            setSearchingLoc(true);
            const locs = await searchTransdirectLocations(val);
            setSuggestions(locs);
            setShowSuggestions(true);
            setSearchingLoc(false);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectLocation = (loc: any) => {
        setGuestCity(loc.city);
        setGuestState(loc.state);
        setGuestPostcode(loc.postcode);
        setGuestCountry("Australia");
        setShowSuggestions(false);
        notifyAddressChange(loc.city, loc.postcode, loc.state);
    };

    const handlePostcodeChange = (val: string) => {
        setGuestPostcode(val);
        if (guestCity && guestState) {
            notifyAddressChange(guestCity, val, guestState);
        }
    };

    const handleGuestSubmit = () => {
        if(!guestName || !guestEmail || !guestPhone) {
            toast.error("Name, Email and Phone are required.");
            return;
        }
        if(!guestAddress || !guestCity || !guestPostcode) {
            toast.error("Address, City and Postcode are required.");
            return;
        }

        const guestData = {
            id: null,
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            addresses: [{
                firstName: guestName.split(" ")[0],
                lastName: guestName.split(" ").slice(1).join(" ") || "",
                address1: guestAddress,
                city: guestCity,
                state: guestState,
                postcode: guestPostcode,
                country: guestCountry
            }]
        };
        onSelect(guestData, 'guest');
        toast.success("Guest customer set.");
    };

    return (
        <Card className="overflow-visible z-20 relative h-fit shadow-md border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                    <User size={14} /> Customer Details
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                {selectedCustomer ? (
                    <div className="relative bg-blue-50 border border-blue-100 rounded-lg p-5">
                        <Button
                            size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                            onClick={onRemove}
                        >
                            <Trash2 size={15} />
                        </Button>
                        
                        <div className="flex items-center gap-2 mb-2">
                            <User size={16} className="text-blue-600"/>
                            <span className="font-bold text-slate-800 text-sm">
                                {selectedCustomer.name} {selectedCustomer.id ? "(Registered)" : "(Guest)"}
                            </span>
                        </div>
                        
                        <div className="space-y-1 pl-6 text-xs text-slate-600">
                            <p>{selectedCustomer.email}</p>
                            <p>{selectedCustomer.phone}</p>
                            
                            {selectedCustomer.addresses?.[0] && (
                                <div className="flex items-start gap-1 mt-2 text-slate-500 bg-white/50 p-2 rounded border border-blue-100">
                                    <MapPin size={12} className="mt-0.5 shrink-0"/>
                                    <span>
                                        {selectedCustomer.addresses[0].address1}, <br/>
                                        {selectedCustomer.addresses[0].city} {selectedCustomer.addresses[0].postcode}, <br/>
                                        {selectedCustomer.addresses[0].state}, {selectedCustomer.addresses[0].country}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <Tabs defaultValue="search" onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1 rounded-lg">
                            <TabsTrigger value="search" className="text-xs font-medium">Search Existing</TabsTrigger>
                            <TabsTrigger value="guest" className="text-xs font-medium">New / Guest</TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="relative space-y-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search name, email or phone..."
                                    className="pl-9 bg-slate-50 border-slate-200"
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                                {results.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-lg mt-1 max-h-60 overflow-y-auto z-50">
                                        {results.map((cust) => (
                                            <div
                                                key={cust.id}
                                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 group"
                                                onClick={() => {
                                                    onSelect(cust, 'registered');
                                                    setQuery("");
                                                    setResults([]);
                                                }}
                                            >
                                                <p className="font-medium text-sm text-slate-800 group-hover:text-blue-700">{cust.name}</p>
                                                <p className="text-xs text-slate-500">{cust.email}</p>
                                                <p className="text-xs text-slate-400">{cust.phone}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="guest" className="space-y-4">
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personal Info</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input placeholder="Full Name *" className="h-8 text-xs" value={guestName} onChange={e=>setGuestName(e.target.value)} />
                                    <Input placeholder="Email *" className="h-8 text-xs" value={guestEmail} onChange={e=>setGuestEmail(e.target.value)} />
                                </div>
                                <Input placeholder="Phone Number *" className="h-8 text-xs" value={guestPhone} onChange={e=>setGuestPhone(e.target.value)} />
                            </div>

                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipping Address</p>
                                <Input placeholder="Address Line 1 *" className="h-8 text-xs" value={guestAddress} onChange={e=>setGuestAddress(e.target.value)} />
                                
                                <div className="grid grid-cols-2 gap-3 relative">
                                    <div className="relative">
                                        <Input 
                                            placeholder="City / Suburb *" 
                                            className="h-8 text-xs" 
                                            value={guestCity} 
                                            onChange={e=>handleCityChange(e.target.value)} 
                                            autoComplete="off"
                                        />
                                        {searchingLoc && (
                                            <Loader2 size={12} className="absolute right-2 top-2.5 animate-spin text-slate-400"/>
                                        )}

                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute top-full left-0 w-[200%] bg-white border border-slate-200 shadow-xl rounded-md z-50 max-h-48 overflow-y-auto mt-1">
                                                {suggestions.map((item, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => selectLocation(item)}
                                                        className="p-2 hover:bg-blue-50 cursor-pointer text-xs border-b border-slate-50 last:border-0"
                                                    >
                                                        <span className="font-bold text-slate-700">{item.city}</span>, 
                                                        <span className="text-slate-500 ml-1">{item.state} {item.postcode}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Input placeholder="Postcode *" className="h-8 text-xs" value={guestPostcode} onChange={e=>handlePostcodeChange(e.target.value)} />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input placeholder="State" className="h-8 text-xs" value={guestState} onChange={e=>setGuestState(e.target.value)} />
                                    <Input placeholder="Country" className="h-8 text-xs" value={guestCountry} onChange={e=>setGuestCountry(e.target.value)} />
                                </div>
                            </div>

                            <Button onClick={handleGuestSubmit} className="w-full bg-slate-900 hover:bg-slate-800 text-white h-9 mt-2">
                                <UserPlus size={14} className="mr-2"/> Set Guest Customer
                            </Button>
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
};