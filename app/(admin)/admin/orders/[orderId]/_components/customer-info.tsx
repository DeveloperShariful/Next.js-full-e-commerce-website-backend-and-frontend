// File: app/admin/orders/[orderId]/_components/customer-info.tsx

"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Mail, Phone, ExternalLink, CreditCard, Edit, Save, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Server Actions
import { searchTransdirectLocations } from "@/app/actions/admin/order/transdirect-locations";
import { updateOrderCustomerDetails } from "@/app/actions/admin/order/update-order-customer";

export const CustomerInfo = ({ order }: { order: any }) => {
  // Parsing Address
  const shipping = typeof order.shippingAddress === 'object' ? order.shippingAddress : {};
  const billing = typeof order.billingAddress === 'object' ? order.billingAddress : {};

  // --- STATE FOR EDIT MODAL ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: order.user?.name || `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim() || "Guest",
    email: order.user?.email || order.guestEmail || "",
    phone: order.user?.phone || shipping.phone || "",
    address1: shipping.address1 || "",
    city: shipping.city || "",
    state: shipping.state || "",
    postcode: shipping.postcode || "",
    country: shipping.country || "Australia"
  });

  // --- ADDRESS SUGGESTION STATES ---
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  // Helper to get initials
  const getInitials = (name: string) => {
     return name ? name.substring(0, 2).toUpperCase() : "GU";
  };

  // --- HANDLER: CITY INPUT CHANGE (Auto-Suggest) ---
  const handleCityChange = async (val: string) => {
    setFormData(prev => ({ ...prev, city: val }));
    
    if (val.length > 1) {
        setSearching(true);
        // Call Server Action
        const results = await searchTransdirectLocations(val);
        setSuggestions(results);
        setShowSuggestions(true);
        setSearching(false);
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  // --- HANDLER: SELECT SUGGESTION ---
  const selectLocation = (loc: any) => {
      setFormData(prev => ({
          ...prev,
          city: loc.city,
          state: loc.state,
          postcode: loc.postcode,
          country: "Australia" // Transdirect is AU based mainly
      }));
      setShowSuggestions(false);
  };

  // --- HANDLER: SAVE CHANGES ---
  const handleSave = async () => {
      setLoading(true);
      const data = new FormData();
      data.append("orderId", order.id);
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("ship_address1", formData.address1);
      data.append("ship_city", formData.city);
      data.append("ship_state", formData.state);
      data.append("ship_postcode", formData.postcode);
      data.append("ship_country", formData.country);

      const res = await updateOrderCustomerDetails(data);
      
      if (res.success) {
          toast.success(res.message);
          setIsEditOpen(false);
      } else {
          toast.error(res.error);
      }
      setLoading(false);
  };

  return (
    <>
        <Card className="border-slate-200 shadow-sm h-fit relative group">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-center">
                <CardTitle className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2 tracking-wider">
                    <User size={14}/> Customer Details
                </CardTitle>
                
                {/* EDIT BUTTON */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-400 hover:text-blue-600"
                    onClick={() => setIsEditOpen(true)}
                >
                    <Edit size={14} />
                </Button>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
                
                {/* 1. Basic Contact Info */}
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border border-slate-200">
                        <AvatarImage src={order.user?.image} />
                        <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">
                            {getInitials(order.user?.name || "Guest")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <p className="font-semibold text-slate-900 text-sm">
                            {order.user?.name || shipping.firstName ? `${shipping.firstName} ${shipping.lastName}` : "Guest Customer"}
                        </p>
                        {order.user?.id && (
                            <p className="text-xs text-blue-600 cursor-pointer hover:underline flex items-center gap-1">
                                View Profile <ExternalLink size={10}/>
                            </p>
                        )}
                        <div className="pt-1 space-y-1.5">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Mail size={12} className="text-slate-400"/> 
                                <span className="truncate max-w-[200px]">{order.user?.email || order.guestEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Phone size={12} className="text-slate-400"/> 
                                <span>{order.user?.phone || shipping.phone || "No phone provided"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* 2. Addresses Grid */}
                <div className="grid grid-cols-1 gap-6">
                    
                    {/* Shipping Address */}
                    <div className="relative pl-3 border-l-2 border-blue-500">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <MapPin size={12}/> Shipping Address
                        </p>
                        <div className="text-sm text-slate-700 space-y-0.5 leading-tight">
                            <p className="font-medium text-slate-900">{shipping.firstName} {shipping.lastName}</p>
                            <p>{shipping.address1}</p>
                            {shipping.address2 && <p>{shipping.address2}</p>}
                            <p>{shipping.city}, {shipping.state} {shipping.postcode}</p>
                            <p className="font-medium mt-1">{shipping.country}</p>
                        </div>
                    </div>

                    {/* Billing Address */}
                    <div className="relative pl-3 border-l-2 border-slate-300">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <CreditCard size={12}/> Billing Address
                        </p>
                        <div className="text-sm text-slate-600 space-y-0.5 leading-tight">
                            <p className="font-medium text-slate-800">{billing.firstName} {billing.lastName}</p>
                            <p>{billing.address1}</p>
                            <p>{billing.city}, {billing.state} {billing.postcode}</p>
                            <p>{billing.country}</p>
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>

        {/* --- EDIT MODAL --- */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Customer Details</DialogTitle>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    {/* Contact Info */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-2"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Shipping Address</p>

                    <div className="grid gap-2">
                        <Label htmlFor="address1">Address Line 1</Label>
                        <Input id="address1" value={formData.address1} onChange={(e) => setFormData({...formData, address1: e.target.value})} />
                    </div>

                    {/* CITY / SUBURB AUTO COMPLETE */}
                    <div className="grid gap-2 relative">
                        <Label htmlFor="city">Suburb / City (Start Typing)</Label>
                        <div className="relative">
                            <Input 
                                id="city" 
                                value={formData.city} 
                                onChange={(e) => handleCityChange(e.target.value)} 
                                autoComplete="off"
                                className={showSuggestions ? "rounded-b-none border-blue-500 ring-1 ring-blue-500" : ""}
                            />
                            {searching && <Loader2 size={16} className="absolute right-3 top-2.5 animate-spin text-slate-400"/>}
                        </div>
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-[70px] left-0 w-full bg-white border border-t-0 border-blue-500 rounded-b-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                {suggestions.map((item, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => selectLocation(item)}
                                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
                                    >
                                        <span className="font-bold text-slate-700">{item.city}</span>, 
                                        <span className="text-slate-500 ml-1">{item.state} {item.postcode}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="state">State</Label>
                            <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="postcode">Postcode</Label>
                            <Input id="postcode" value={formData.postcode} onChange={(e) => setFormData({...formData, postcode: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
  )
}