// File: app/(storefront)/checkout/_components/forms/Address_Form.tsx

"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { searchTransdirectLocations } from "@/app/actions/storefront/checkout/transdirect-locations"; // আপনার সার্ভার অ্যাকশন
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";

interface AddressFormProps {
  type: "shipping" | "billing";
}

export const Address_Form = ({ type }: AddressFormProps) => {
  const { control, setValue } = useFormContext();
  const prefix = type === "shipping" ? "shippingAddress" : "billingAddress";

  // অটো-সাজেশন স্টেট
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // পোস্টকোড সার্চ হ্যান্ডলার
  const handlePostcodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
    // ফর্মের ভ্যালু আপডেট করা
    setValue(`${prefix}.postcode`, query);

    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingLoc(true);
    setShowSuggestions(true);

    try {
      // সার্ভার অ্যাকশন কল
      const results = await searchTransdirectLocations(query);
      setSuggestions(results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLoc(false);
    }
  };

  // লোকেশন সিলেক্ট হ্যান্ডলার
  const selectLocation = (loc: any) => {
    setValue(`${prefix}.postcode`, loc.postcode);
    setValue(`${prefix}.city`, loc.city);
    setValue(`${prefix}.state`, loc.state); // State Select হলে ভ্যালু ম্যাচ করতে হবে (e.g., NSW)
    
    setShowSuggestions(false); // লিস্ট বন্ধ করা
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-6 grid gap-6">
        
        {/* Country (Default AU) */}
        <FormField
          control={control}
          name={`${prefix}.country`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country / Region</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* First & Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name={`${prefix}.firstName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${prefix}.lastName`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Lines */}
        <FormField
          control={control}
          name={`${prefix}.address1`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl><Input placeholder="House number and street name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Postcode Search Field (UPDATED) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          
          {/* Postcode Input with Search */}
          <FormField
            control={control}
            name={`${prefix}.postcode`}
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Postcode (Type to search)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                        {...field} 
                        onChange={handlePostcodeChange} 
                        placeholder="e.g. 2000"
                        autoComplete="off"
                    />
                    {loadingLoc && (
                        <div className="absolute right-3 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />

                {/* Suggestion Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {suggestions.map((loc, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => selectLocation(loc)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                            >
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>{loc.postcode} - {loc.city}, {loc.state}</span>
                            </button>
                        ))}
                    </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${prefix}.city`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suburb / City</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`${prefix}.state`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NSW">New South Wales</SelectItem>
                    <SelectItem value="VIC">Victoria</SelectItem>
                    <SelectItem value="QLD">Queensland</SelectItem>
                    <SelectItem value="WA">Western Australia</SelectItem>
                    <SelectItem value="SA">South Australia</SelectItem>
                    <SelectItem value="TAS">Tasmania</SelectItem>
                    <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                    <SelectItem value="NT">Northern Territory</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name={`${prefix}.phone`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input type="tel" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </CardContent>
    </Card>
  );
};