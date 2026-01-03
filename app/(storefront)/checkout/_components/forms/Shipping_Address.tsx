// File: app/(storefront)/checkout/_components/forms/Shipping_Address.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AsyncSelect from "react-select/async"; // 📦 npm install react-select
import { searchTransdirectLocations } from "@/app/actions/storefront/checkout/transdirect-locations"; // ✅ Server Action Import

type ShippingFormValues = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string; // Suburb/City
  state: string;
  postcode: string;
  country: string;
  phone: string;
};

// React Select Styles (Tailwind Match)
const customStyles = {
    control: (base: any) => ({
        ...base,
        minHeight: '40px',
        borderRadius: '0.375rem',
        borderColor: '#e2e8f0',
        boxShadow: 'none',
        '&:hover': { borderColor: '#cbd5e1' }
    }),
    input: (base: any) => ({ ...base, 'input:focus': { boxShadow: 'none' } }),
};

export const Shipping_Address = () => {
  const { user, setShippingAddress, shippingAddress } = useCheckoutStore();
  
  const { register, control, setValue, watch, formState: { errors } } = useForm<ShippingFormValues>({
    defaultValues: {
      firstName: user?.name?.split(" ")[0] || "",
      lastName: user?.name?.split(" ")[1] || "",
      country: "AU",
      address1: shippingAddress?.address1 || "",
      city: shippingAddress?.city || "", // Suburb
      state: shippingAddress?.state || "",
      postcode: shippingAddress?.postcode || "",
      phone: shippingAddress?.phone || ""
    },
    mode: "onBlur"
  });

  const watchedValues = watch();

  // Update Global Store on Change
  useEffect(() => {
    const timer = setTimeout(() => {
        setShippingAddress(watchedValues);
    }, 600); // Debounce
    return () => clearTimeout(timer);
  }, [JSON.stringify(watchedValues), setShippingAddress]);

  // ✅ Server Action Caller for Autocomplete
  const loadAddressOptions = (inputValue: string) => {
      return searchTransdirectLocations(inputValue).then(result => {
          return result; 
      });
  };

  // Handle Autocomplete Selection
  const handleAddressSelect = (selectedOption: any) => {
      if (selectedOption) {
          setValue("city", selectedOption.suburb);
          setValue("state", selectedOption.state);
          setValue("postcode", selectedOption.postcode);
          
          // Force update store immediately
          setShippingAddress({
              ...watchedValues,
              city: selectedOption.suburb,
              state: selectedOption.state,
              postcode: selectedOption.postcode
          });
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* Country */}
      <div className="md:col-span-2 space-y-2">
        <Label>Country/Region</Label>
        <Select defaultValue="AU" onValueChange={(val) => setValue("country", val)}>
            <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="AU">Australia</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* Names */}
      <div className="space-y-2">
        <Label>First name</Label>
        <Input {...register("firstName", { required: true })} className="bg-white border-gray-300" />
        {errors.firstName && <span className="text-xs text-red-500">Required</span>}
      </div>
      <div className="space-y-2">
        <Label>Last name</Label>
        <Input {...register("lastName", { required: true })} className="bg-white border-gray-300" />
        {errors.lastName && <span className="text-xs text-red-500">Required</span>}
      </div>

      {/* Address */}
      <div className="md:col-span-2 space-y-2">
        <Label>Address</Label>
        <Input {...register("address1", { required: true })} placeholder="123 Main St" className="bg-white border-gray-300" />
        {errors.address1 && <span className="text-xs text-red-500">Required</span>}
      </div>
      <div className="md:col-span-2 space-y-2">
        <Label>Apartment, suite, etc. (optional)</Label>
        <Input {...register("address2")} className="bg-white border-gray-300" />
      </div>

      {/* 🔥 Suburb / Postcode Autocomplete */}
      <div className="md:col-span-2 space-y-2">
        <Label>Suburb / Postcode</Label>
        <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadAddressOptions}
            onChange={handleAddressSelect}
            placeholder="Type suburb or postcode..."
            styles={customStyles}
            classNames={{
                control: () => "text-sm",
            }}
            // If value exists in form, show it as selected label
            value={watchedValues.city ? { 
                label: `${watchedValues.city}, ${watchedValues.state} ${watchedValues.postcode}`, 
                value: watchedValues.city 
            } : null}
        />
        <input type="hidden" {...register("city", { required: true })} />
        {(errors.city || errors.postcode) && <span className="text-xs text-red-500">Please select a valid location</span>}
      </div>

      {/* State (Readonly as it comes from autocomplete) */}
      <div className="space-y-2">
        <Label>State</Label>
        <Input {...register("state", { required: true })} readOnly className="bg-gray-100 cursor-not-allowed border-gray-300" />
      </div>

      {/* Postcode (Readonly) */}
      <div className="space-y-2">
        <Label>Postcode</Label>
        <Input {...register("postcode", { required: true })} readOnly className="bg-gray-100 cursor-not-allowed border-gray-300" />
      </div>

      {/* Phone */}
      <div className="md:col-span-2 space-y-2">
        <Label>Phone</Label>
        <Input {...register("phone", { required: true })} type="tel" className="bg-white border-gray-300" />
        {errors.phone && <span className="text-xs text-red-500">Required</span>}
      </div>

    </div>
  );
};