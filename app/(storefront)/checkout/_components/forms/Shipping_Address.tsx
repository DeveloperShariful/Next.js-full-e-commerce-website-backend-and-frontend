// File: app/(storefront)/checkout/_components/forms/Shipping_Address.tsx

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCheckoutStore } from "../../useCheckoutStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AsyncSelect from "react-select/async"; 
import { searchTransdirectLocations } from "@/app/actions/storefront/checkout/transdirect-locations"; 

type ShippingFormValues = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string; // UI তে City, কিন্তু ব্যাকএন্ডে এটি Suburb হিসেবে যাবে
  state: string;
  postcode: string;
  country: string;
  phone: string;
};

// Custom Styles for React Select to match Tailwind UI
const customSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        minHeight: '44px',
        borderRadius: '0.375rem', 
        borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0', 
        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
        '&:hover': { borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1' },
        fontSize: '0.875rem',
        backgroundColor: 'white'
    }),
    input: (base: any) => ({ ...base, 'input:focus': { boxShadow: 'none' } }),
    placeholder: (base: any) => ({ ...base, color: '#9ca3af' }),
    singleValue: (base: any) => ({ ...base, color: '#111827' }),
    menu: (base: any) => ({ ...base, zIndex: 50 })
};

export const Shipping_Address = () => {
  // ✅ FIX: Selecting state individually to prevent re-render loops
  const user = useCheckoutStore((state) => state.user);
  const setShippingAddress = useCheckoutStore((state) => state.setShippingAddress);
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  
  const { register, setValue, watch, formState: { errors } } = useForm<ShippingFormValues>({
    defaultValues: {
      firstName: shippingAddress?.firstName || user?.name?.split(" ")[0] || "",
      lastName: shippingAddress?.lastName || user?.name?.split(" ")[1] || "",
      country: shippingAddress?.country || "AU",
      address1: shippingAddress?.address1 || "",
      address2: shippingAddress?.address2 || "",
      city: shippingAddress?.city || "",
      state: shippingAddress?.state || "",
      postcode: shippingAddress?.postcode || "",
      phone: shippingAddress?.phone || user?.phone || ""
    },
    mode: "onBlur"
  });

  const watchedValues = watch();

  // Sync Form with Global Store (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
        // ✅ FIX: Explicitly mapping 'city' to 'suburb' for the store/backend logic
        setShippingAddress({
            ...watchedValues,
            suburb: watchedValues.city // Transdirect API এর জন্য এটি জরুরি
        });
    }, 800); 
    return () => clearTimeout(timer);
  }, [watchedValues, setShippingAddress]);

  // Autocomplete Loader (Server Action)
  const loadAddressOptions = (inputValue: string) => {
      return searchTransdirectLocations(inputValue);
  };

  // Handle Autocomplete Selection
  const handleAddressSelect = (selectedOption: any) => {
      if (selectedOption) {
          // Update Form UI
          setValue("city", selectedOption.suburb, { shouldValidate: true });
          setValue("state", selectedOption.state, { shouldValidate: true });
          setValue("postcode", selectedOption.postcode, { shouldValidate: true });
          
          // Force Immediate Store Update (Faster UI response for rates)
          setShippingAddress({
              ...watchedValues,
              city: selectedOption.suburb,
              suburb: selectedOption.suburb, // ✅ Explicitly set suburb
              state: selectedOption.state,
              postcode: selectedOption.postcode
          });
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      {/* Country */}
      <div className="md:col-span-2 space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">Country / Region</Label>
        <Select defaultValue="AU" onValueChange={(val) => setValue("country", val)}>
            <SelectTrigger className="bg-white border-gray-300 h-11 focus:ring-blue-500">
                <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="AU">Australia</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* First Name */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">First name</Label>
        <Input 
            {...register("firstName", { required: true })} 
            className={`bg-white h-11 focus-visible:ring-blue-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`} 
        />
        {errors.firstName && <span className="text-[10px] text-red-500 font-medium">First name is required</span>}
      </div>

      {/* Last Name */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">Last name</Label>
        <Input 
            {...register("lastName", { required: true })} 
            className={`bg-white h-11 focus-visible:ring-blue-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`} 
        />
        {errors.lastName && <span className="text-[10px] text-red-500 font-medium">Last name is required</span>}
      </div>

      {/* Address Line 1 */}
      <div className="md:col-span-2 space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">Address</Label>
        <Input 
            {...register("address1", { required: true })} 
            placeholder="Street address, P.O. box" 
            className={`bg-white h-11 focus-visible:ring-blue-500 ${errors.address1 ? 'border-red-500' : 'border-gray-300'}`} 
        />
        {errors.address1 && <span className="text-[10px] text-red-500 font-medium">Street address is required</span>}
      </div>

      {/* Address Line 2 */}
      <div className="md:col-span-2 space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">Apartment, suite, etc.</Label>
        <Input 
            {...register("address2")} 
            placeholder="Apartment, suite, unit, etc. (optional)" 
            className="bg-white border-gray-300 h-11 focus-visible:ring-blue-500" 
        />
      </div>

      {/* Suburb / Postcode Autocomplete */}
      <div className="md:col-span-2 space-y-1.5 relative z-20">
        <Label className="text-xs uppercase text-gray-500 font-bold">Suburb / Postcode</Label>
        <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadAddressOptions}
            onChange={handleAddressSelect}
            placeholder="Type to search suburb or postcode..."
            styles={customSelectStyles}
            // Controlled value for correct display
            value={watchedValues.city ? { 
                label: `${watchedValues.city}, ${watchedValues.state} ${watchedValues.postcode}`, 
                value: watchedValues.city 
            } : null}
            noOptionsMessage={() => "Type to search..."}
            loadingMessage={() => "Searching..."}
        />
        
        {/* Hidden inputs to validate via React Hook Form */}
        <input type="hidden" {...register("city", { required: true })} />
        <input type="hidden" {...register("postcode", { required: true })} />
        
        {(errors.city || errors.postcode) && (
            <span className="text-[10px] text-red-500 font-medium block mt-1">
                Please select a valid location from the dropdown list.
            </span>
        )}
      </div>

      {/* State (Readonly) */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">State</Label>
        <Input 
            {...register("state")} 
            readOnly 
            className="bg-gray-100 text-gray-500 border-gray-200 h-11 cursor-not-allowed focus-visible:ring-0" 
        />
      </div>

      {/* Postcode (Readonly) */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">Postcode</Label>
        <Input 
            {...register("postcode")} 
            readOnly 
            className="bg-gray-100 text-gray-500 border-gray-200 h-11 cursor-not-allowed focus-visible:ring-0" 
        />
      </div>

      {/* Phone */}
      <div className="md:col-span-2 space-y-1.5">
        <Label className="text-xs uppercase text-gray-500 font-bold">Phone</Label>
        <Input 
            {...register("phone", { required: true, minLength: 8 })} 
            type="tel" 
            placeholder="0400 000 000"
            className={`bg-white h-11 focus-visible:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} 
        />
        {errors.phone && <span className="text-[10px] text-red-500 font-medium">Valid phone number required for delivery updates.</span>}
      </div>

    </div>
  );
};