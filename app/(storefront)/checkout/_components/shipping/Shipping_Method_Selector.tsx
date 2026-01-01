// File: app/(storefront)/checkout/_components/shipping/Shipping_Method_Selector.tsx

"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { calculateShippingRates } from "@/app/actions/storefront/checkout/calculate-shipping";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface ShippingProps {
  // আগের Wrappers থেকে এই প্রপ্সগুলো পাস করতে হবে, আপাতত অপশনাল রাখছি
  cartId?: string;
}

export const Shipping_Method_Selector = ({ cartId }: ShippingProps) => {
  const { control, setValue } = useFormContext();
  const { formatPrice } = useGlobalStore(); // Global store থেকে প্রাইস ফরম্যাটার
  
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Watch Address to trigger API
  const address = useWatch({
    control,
    name: "shippingAddress",
  });

  const selectedMethod = useWatch({
    control,
    name: "shippingMethod",
  });

  useEffect(() => {
    const fetchRates = async () => {
      // মিনিমাম ভ্যালিডেশন: পোস্টকোড এবং কান্ট্রি থাকতে হবে
      if (!address?.postcode || address.postcode.length < 3 || !address?.country || !cartId) {
        return;
      }

      setLoading(true);
      try {
        const res = await calculateShippingRates({
          cartId,
          address: {
            postcode: address.postcode,
            suburb: address.city || "",
            state: address.state || "",
            country: address.country,
          },
        });

        if (res.success) {
          setRates(res.rates);
          // যদি একটি মাত্র রেট থাকে, অটোমেটিক সিলেক্ট করে দেওয়া
          if (res.rates.length === 1) {
            handleValueChange(res.rates[0].id, res.rates);
          }
        } else {
          setRates([]);
        }
      } catch (error) {
        console.error(error);
        toast.error("Could not fetch shipping rates");
      } finally {
        setLoading(false);
      }
    };

    // Debounce: ইউজার টাইপ করা থামানোর ১ সেকেন্ড পর কল হবে
    const timer = setTimeout(() => {
      fetchRates();
    }, 1000);

    return () => clearTimeout(timer);
  }, [address?.postcode, address?.state, address?.country, address?.city, cartId]);

  // হেল্পার: রেট সিলেক্ট করলে একই সাথে Cost-ও আপডেট করা
  const handleValueChange = (value: string, currentRates = rates) => {
    setValue("shippingMethod", value);
    const selected = currentRates.find((r) => r.id === value);
    if (selected) {
      // RHF এ এক্সট্রা ফিল্ড সেট করছি যাতে Summary তে টোটাল দেখাতে পারি
      setValue("shippingCost", selected.price); 
    }
  };

  return (
    <Card className="border-gray-200 shadow-sm transition-all">
      <CardContent className="p-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Calculating best shipping rates...</span>
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Enter your shipping address</p>
            <p className="text-xs mt-1">We need your postcode to show delivery options.</p>
          </div>
        ) : (
          <RadioGroup
            value={selectedMethod}
            onValueChange={(val) => handleValueChange(val)}
            className="grid gap-3"
          >
            {rates.map((rate) => (
              <Label
                key={rate.id}
                htmlFor={rate.id}
                className={`
                  flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all
                  ${selectedMethod === rate.id 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                `}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={rate.id} id={rate.id} className="mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{rate.name}</p>
                    <p className="text-xs text-gray-500">{rate.description}</p>
                  </div>
                </div>
                <div className="font-bold text-gray-900">
                  {rate.price === 0 ? "Free" : formatPrice(rate.price)}
                </div>
              </Label>
            ))}
          </RadioGroup>
        )}

      </CardContent>
    </Card>
  );
};