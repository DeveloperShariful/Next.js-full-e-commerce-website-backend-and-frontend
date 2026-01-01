// File: app/(storefront)/checkout/_components/summary/Order_Summary.tsx

"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Loader2 } from "lucide-react";
import Image from "next/image";

// টাইপ (প্রয়োজনীয় অংশ)
interface OrderSummaryProps {
  cart: any; // getCheckoutData থেকে আসা কার্ট অবজেক্ট
}

export const Order_Summary = ({ cart }: OrderSummaryProps) => {
  const { formatPrice } = useGlobalStore();
  const { register, formState: { isSubmitting } } = useFormContext();

  // শিপিং কস্ট লাইভ ওয়াচ করা
  const shippingCost = useWatch({ name: "shippingCost" }) || 0;
  
  // কার্ট টোটাল ক্যালকুলেশন
  const subtotal = cart?.items.reduce((acc: number, item: any) => {
    const price = item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price);
    return acc + (price * item.quantity);
  }, 0) || 0;

  // TODO: কুপন ডিসকাউন্ট লজিক পরে ইন্টিগ্রেট হবে
  const discount = 0; 
  const tax = 0; // Tax logic can be added here based on address

  const total = subtotal + shippingCost - discount + tax;

  return (
    <Card className="border-gray-200 shadow-lg sticky top-24">
      <CardHeader className="bg-gray-50 border-b px-6 py-4">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Cart Items List */}
        <ScrollArea className="h-[300px] px-6 py-4">
          <div className="space-y-4">
            {cart?.items.map((item: any) => {
               // ইমেজ সিলেকশন লজিক
               const imgUrl = item.variant?.image || item.product.featuredImage || "/placeholder.png";
               const name = item.product.name;
               const variantName = item.variant?.name;
               const price = item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price);

               return (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-white">
                    <Image 
                      src={imgUrl} 
                      alt={name} 
                      fill 
                      className="object-contain p-1"
                    />
                    <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {item.quantity}
                    </Badge>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{name}</h4>
                    {variantName && <p className="text-xs text-muted-foreground">{variantName}</p>}
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <p className="text-sm font-semibold">{formatPrice(price * item.quantity)}</p>
                  </div>
                </div>
               );
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Totals Section */}
        <div className="p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-gray-900">
              {shippingCost === 0 ? "Calculated at next step" : formatPrice(shippingCost)}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-primary">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* Coupon Input */}
        <div className="px-6 pb-6">
            <div className="flex gap-2">
                <Input placeholder="Discount code" className="bg-gray-50" />
                <Button variant="outline">Apply</Button>
            </div>
        </div>

        {/* Submit Button (Only for Offline, Online methods have their own buttons) */}
        <div className="px-6 pb-6">
            <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all" 
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                ) : (
                    "Place Order"
                )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4">
                Secure Checkout - SSL Encrypted
            </p>
        </div>

      </CardContent>
    </Card>
  );
};