// File: app/(storefront)/cart/_components/Cart_Summary.tsx

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface SummaryProps {
  cart: any; // Full cart object
}

export const Cart_Summary = ({ cart }: SummaryProps) => {
  const { formatPrice } = useGlobalStore();

  // সাবটোটাল ক্যালকুলেশন
  const subtotal = cart.items.reduce((acc: number, item: any) => {
    const price = item.variant 
      ? (item.variant.salePrice || item.variant.price) 
      : (item.product.salePrice || item.product.price);
    
    return acc + (price * item.quantity);
  }, 0);

  // ডিসকাউন্ট বা শিপিং এখানে ক্যালকুলেট হবে না, চেকআউটে হবে।
  // তবে আমরা ইউজারকে সেটা মেসেজ দিয়ে জানিয়ে দিব।

  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-gray-50 border-b px-6 py-4">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between text-base">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Shipping</span>
            <span className="text-xs italic">Calculated at checkout</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax</span>
            <span className="text-xs italic">Calculated at checkout</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <div className="text-right">
            <span className="text-xl font-bold text-primary block">{formatPrice(subtotal)}</span>
            <span className="text-xs text-muted-foreground font-normal">+ Shipping</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-4">
        <Button asChild className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all">
          <Link href="/checkout">
            Proceed to Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-gray-50 py-2 px-3 rounded-full mx-auto">
          <ShieldCheck className="h-3 w-3 text-green-600" />
          <span>Secure Checkout Guaranteed</span>
        </div>
      </CardFooter>
    </Card>
  );
};