// File: app/(storefront)/checkout/_components/forms/Billing_Address.tsx

"use client";

import { useCheckoutStore } from "../../useCheckoutStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Billing_Address = () => {
  const { isSameBilling, toggleSameBilling, setBillingAddress, billingAddress } = useCheckoutStore();

  const handleInputChange = (field: string, value: string) => {
    setBillingAddress({ ...billingAddress, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Toggle Checkbox Card */}
      <div 
        className={`flex items-center space-x-3 border p-5 rounded-lg transition-colors cursor-pointer ${isSameBilling ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
        onClick={() => toggleSameBilling(!isSameBilling)}
      >
        <Checkbox 
            id="same_billing" 
            checked={isSameBilling}
            onCheckedChange={(checked) => toggleSameBilling(checked === true)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
        <div className="space-y-0.5">
            <Label htmlFor="same_billing" className="text-base font-medium cursor-pointer text-gray-900">
                Same as shipping address
            </Label>
            <p className="text-xs text-gray-500">
                The bill will be sent to your shipping address.
            </p>
        </div>
      </div>

      {/* Form (Only shows if NOT same as shipping) */}
      {!isSameBilling && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-2 border-l-2 border-gray-200 pl-4 ml-2">
            
            <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">Country / Region</Label>
                <Select onValueChange={(val) => handleInputChange("country", val)} defaultValue="AU">
                    <SelectTrigger className="bg-white border-gray-300 h-11">
                        <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">First name</Label>
                <Input onChange={(e) => handleInputChange("firstName", e.target.value)} className="bg-white border-gray-300 h-11" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">Last name</Label>
                <Input onChange={(e) => handleInputChange("lastName", e.target.value)} className="bg-white border-gray-300 h-11" />
            </div>

            <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">Address</Label>
                <Input onChange={(e) => handleInputChange("address1", e.target.value)} placeholder="123 Main St" className="bg-white border-gray-300 h-11" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">Apartment, suite, etc.</Label>
                <Input onChange={(e) => handleInputChange("address2", e.target.value)} className="bg-white border-gray-300 h-11" />
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">Suburb</Label>
                <Input onChange={(e) => handleInputChange("suburb", e.target.value)} className="bg-white border-gray-300 h-11" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">State</Label>
                <Input onChange={(e) => handleInputChange("state", e.target.value)} className="bg-white border-gray-300 h-11" />
            </div>
            <div className="space-y-1.5">
                <Label className="text-xs uppercase text-gray-500 font-bold">Postcode</Label>
                <Input onChange={(e) => handleInputChange("postcode", e.target.value)} className="bg-white border-gray-300 h-11" />
            </div>
        </div>
      )}
    </div>
  );
};