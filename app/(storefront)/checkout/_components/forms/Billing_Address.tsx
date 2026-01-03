// File: app/(storefront)/checkout/_components/forms/Billing_Address.tsx
"use client";

import { useCheckoutStore } from "../../_store/useCheckoutStore";
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
      {/* Toggle Checkbox */}
      <div className="flex items-center space-x-2 border p-4 rounded-lg bg-gray-50/50 border-gray-200">
        <Checkbox 
            id="same_billing" 
            checked={isSameBilling}
            onCheckedChange={(checked) => toggleSameBilling(checked === true)}
        />
        <Label htmlFor="same_billing" className="text-sm font-medium cursor-pointer text-gray-700">
            Same as shipping address
        </Label>
      </div>

      {/* Form (Only shows if NOT same as shipping) */}
      {!isSameBilling && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
            
            <div className="md:col-span-2 space-y-2">
                <Label>Country/Region</Label>
                <Select onValueChange={(val) => handleInputChange("country", val)} defaultValue="AU">
                    <SelectTrigger className="bg-white border-gray-300">
                        <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label>First name</Label>
                <Input onChange={(e) => handleInputChange("firstName", e.target.value)} className="bg-white border-gray-300" />
            </div>
            <div className="space-y-2">
                <Label>Last name</Label>
                <Input onChange={(e) => handleInputChange("lastName", e.target.value)} className="bg-white border-gray-300" />
            </div>

            <div className="md:col-span-2 space-y-2">
                <Label>Address</Label>
                <Input onChange={(e) => handleInputChange("address1", e.target.value)} placeholder="123 Main St" className="bg-white border-gray-300" />
            </div>
            <div className="md:col-span-2 space-y-2">
                <Label>Apartment, suite, etc.</Label>
                <Input onChange={(e) => handleInputChange("address2", e.target.value)} className="bg-white border-gray-300" />
            </div>

            <div className="space-y-2">
                <Label>Suburb</Label>
                <Input onChange={(e) => handleInputChange("suburb", e.target.value)} className="bg-white border-gray-300" />
            </div>
            <div className="space-y-2">
                <Label>State</Label>
                <Input onChange={(e) => handleInputChange("state", e.target.value)} className="bg-white border-gray-300" />
            </div>
            <div className="space-y-2">
                <Label>Postcode</Label>
                <Input onChange={(e) => handleInputChange("postcode", e.target.value)} className="bg-white border-gray-300" />
            </div>
        </div>
      )}
    </div>
  );
};