// File: app/(storefront)/checkout/_components/forms/Shipping_Method.tsx
"use client";

import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { calculateShippingRates } from "@/app/actions/storefront/checkout/calculate-shipping";

export const Shipping_Method = () => {
  const { 
    cartId, 
    shippingAddress, 
    selectedShippingMethod, 
    setShippingMethod 
    // ❌ useStore এখান থেকে সরিয়ে ফেলা হয়েছে
  } = useCheckoutStore();

  // লোকাল স্টেট
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // এড্রেস চেক: কান্ট্রি এবং পোস্টকোড থাকলেই কেবল রেট খুঁজবে
  const hasAddress = Boolean(shippingAddress?.country && shippingAddress?.postcode);

  useEffect(() => {
    let isMounted = true;

    const fetchRates = async () => {
        if (!cartId || !hasAddress) return;
        
        setLoading(true);
        const res = await calculateShippingRates({ cartId, address: shippingAddress });
        
        if (isMounted) {
            if (res.success) {
                setRates(res.rates);
                // অটো-সিলেক্ট লজিক
                if (!selectedShippingMethod && res.rates.length > 0) {
                    setShippingMethod(res.rates[0]);
                }
            }
            setLoading(false);
        }
    };

    const timer = setTimeout(() => {
        fetchRates();
    }, 500);

    return () => {
        isMounted = false;
        clearTimeout(timer);
    };
  }, [cartId, shippingAddress.postcode, shippingAddress.suburb, hasAddress, selectedShippingMethod, setShippingMethod]);

  // 1. No Address State
  if (!hasAddress) {
    return (
        <div className="p-6 border rounded-lg text-center text-gray-500 bg-gray-50 text-sm border-dashed border-gray-300">
            <Truck className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Please enter a shipping address to view rates.
        </div>
    );
  }

  // 2. Loading State
  if (loading) {
    return (
        <div className="p-6 border rounded-lg flex items-center justify-center text-gray-500 bg-gray-50 border-gray-200">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Calculating shipping rates...
        </div>
    );
  }

  // 3. No Rates Found
  if (rates.length === 0) {
    return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 text-sm">
            No shipping methods available for this location. Please verify your address.
        </div>
    );
  }

  // 4. Rates List
  return (
    <RadioGroup 
        value={selectedShippingMethod?.id} 
        onValueChange={(val) => {
            const method = rates.find(r => r.id === val);
            if (method) setShippingMethod(method);
        }}
        className="gap-3"
    >
      {rates.map((rate) => (
        <div key={rate.id} className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${selectedShippingMethod?.id === rate.id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "hover:border-gray-300 bg-white border-gray-200"}`}>
            <div className="flex items-center space-x-3">
                <RadioGroupItem value={rate.id} id={rate.id} className="text-blue-600" />
                <div className="space-y-0.5">
                    <Label htmlFor={rate.id} className="text-sm font-medium cursor-pointer text-gray-900 block">
                        {rate.name}
                    </Label>
                    <p className="text-xs text-gray-500">
                        {rate.description || (rate.type === 'transdirect' ? `Via ${rate.service_code}` : 'Standard delivery')}
                    </p>
                </div>
            </div>
            <div className="font-semibold text-gray-900 text-sm">
                {rate.price === 0 ? "Free" : `$${rate.price.toFixed(2)}`}
            </div>
        </div>
      ))}
    </RadioGroup>
  );
};