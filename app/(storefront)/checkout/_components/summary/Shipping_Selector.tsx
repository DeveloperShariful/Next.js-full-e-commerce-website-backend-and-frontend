// File: app/(storefront)/checkout/_components/summary/Shipping_Selector.tsx

"use client";

import { useCheckoutStore } from "../../useCheckoutStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle, Truck } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { calculateShippingRates } from "@/app/actions/storefront/checkout/calculate-shipping";

export const Shipping_Selector = () => {
  const { 
    cartId, 
    shippingAddress, 
    selectedShippingMethod, 
    setShippingMethod 
  } = useCheckoutStore();

  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const lastFetchedSignature = useRef<string>("");

  const hasAddress = Boolean(
      shippingAddress?.country && 
      shippingAddress?.postcode && 
      shippingAddress?.state && 
      (shippingAddress?.suburb || shippingAddress?.city)
  );

  const addressSignature = hasAddress 
    ? `${cartId}-${shippingAddress.postcode}-${shippingAddress.state}-${shippingAddress.suburb || shippingAddress.city}`
    : "";

  useEffect(() => {
    let isMounted = true;

    const fetchRates = async () => {
        if (!cartId || !hasAddress || addressSignature === lastFetchedSignature.current) return;
        
        lastFetchedSignature.current = addressSignature;

        setLoading(true);
        setError("");
        
        const addressPayload = {
            country: shippingAddress.country || "AU",
            state: shippingAddress.state,
            postcode: shippingAddress.postcode,
            suburb: shippingAddress.suburb || shippingAddress.city 
        };

        try {
            const res = await calculateShippingRates({ 
                cartId, 
                address: addressPayload 
            });
            
            if (isMounted) {
                if (res.success && res.rates.length > 0) {
                    setRates(res.rates);
                    
                    // Auto-select logic (Only if selection is invalid or empty)
                    // We use the functional update form or check ref to avoid dependency loop
                    const currentMethodId = useCheckoutStore.getState().selectedShippingMethod?.id;
                    const isValidSelection = res.rates.find((r: any) => r.id === currentMethodId);
                    
                    if (!isValidSelection) {
                        setShippingMethod(res.rates[0]);
                    }
                } else {
                    setRates([]);
                    setError("No shipping quotes found for this address.");
                }
            }
        } catch (err) {
            console.error(err);
            if (isMounted) setError("Failed to load shipping rates.");
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    const timer = setTimeout(() => {
        fetchRates();
    }, 500);

    return () => {
        isMounted = false;
        clearTimeout(timer);
    };
    
  // ✅ FIX: Removed 'selectedShippingMethod' and 'setShippingMethod' to stop loop
  // Only re-run if address signature changes
  }, [addressSignature, cartId, hasAddress]); 

  // --- UI RENDER ---

  if (!hasAddress) {
    return (
        <div className="p-4 border rounded-md text-center bg-gray-50 border-dashed border-gray-200">
            <Truck className="h-5 w-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Please enter your shipping address to calculate rates.</p>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="p-4 border rounded-md flex items-center justify-center text-xs text-gray-500 bg-gray-50">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculating shipping rates...
        </div>
    );
  }

  if (!loading && (rates.length === 0 || error)) {
    return (
        <div className="p-4 border border-red-100 bg-red-50 rounded-md text-red-600 text-xs flex flex-col items-center text-center gap-1">
            <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                {error || "No delivery options available."}
            </div>
            <p className="opacity-80">Please check your postcode and suburb.</p>
        </div>
    );
  }

  return (
    <RadioGroup 
        value={selectedShippingMethod?.id} 
        onValueChange={(val) => {
            const method = rates.find(r => r.id === val);
            if (method) setShippingMethod(method);
        }}
        className="space-y-2"
    >
      {rates.map((rate) => (
        <label 
            key={rate.id} 
            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-all ${
                selectedShippingMethod?.id === rate.id 
                ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600" 
                : "hover:border-gray-300 bg-white border-gray-200"
            }`}
        >
            <div className="flex items-center space-x-3">
                <RadioGroupItem value={rate.id} id={rate.id} className="text-blue-600 h-4 w-4 mt-0.5" />
                <div className="space-y-0.5">
                    <span className="text-sm font-medium text-gray-900 block leading-none">
                        {rate.name}
                    </span>
                    {rate.transit_time && (
                        <span className="text-[10px] text-gray-500 block">
                            Est. Delivery: {rate.transit_time}
                        </span>
                    )}
                </div>
            </div>
            <div className="font-bold text-gray-900 text-sm">
                {rate.price === 0 ? "Free" : `$${rate.price.toFixed(2)}`}
            </div>
        </label>
      ))}
    </RadioGroup>
  );
};