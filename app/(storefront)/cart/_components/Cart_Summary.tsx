// File: app/(storefront)/cart/_components/Cart_Summary.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShieldCheck, Tag, Loader2, X } from "lucide-react";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { validateCoupon } from "@/app/actions/storefront/checkout/validate-coupon";
import { toast } from "sonner";

interface SummaryProps {
  cart: any; 
}

export const Cart_Summary = ({ cart }: SummaryProps) => {
  const { formatPrice } = useGlobalStore();
  
  // State for Coupon
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number } | null>(null);

  // ১. সাবটোটাল ক্যালকুলেশন
  const subtotal = cart.items.reduce((acc: number, item: any) => {
    const price = item.variant 
      ? (item.variant.salePrice || item.variant.price) 
      : (item.product.salePrice || item.product.price);
    
    return acc + (price * item.quantity);
  }, 0);

  // ২. কুপন অ্যাপ্লাই হ্যান্ডলার
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setLoading(true);

    const res = await validateCoupon(couponCode, cart.id);

    if (res.success) {
      setAppliedCoupon({ code: res.code!, amount: res.discountAmount! });
      toast.success(res.message);
      setCouponCode(""); // ইনপুট ক্লিয়ার
    } else {
      toast.error(res.error);
      setAppliedCoupon(null);
    }
    setLoading(false);
  };

  // ৩. কুপন রিমুভ হ্যান্ডলার
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info("Coupon removed");
  };

  // ৪. ফাইনাল টোটাল
  const total = subtotal - (appliedCoupon?.amount || 0);

  // ৫. চেকআউট লিংক (কুপন কোড পাস করা হচ্ছে)
  const checkoutUrl = appliedCoupon 
    ? `/checkout?coupon=${appliedCoupon.code}` 
    : "/checkout";

  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden sticky top-24">
      <CardHeader className="bg-gray-50 border-b px-6 py-4">
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between text-base">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        
        {/* Shipping & Tax Info */}
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

        {/* ✅ COUPON INPUT SECTION */}
        {!appliedCoupon ? (
            <div className="flex gap-2 pt-2">
                <Input 
                    placeholder="Coupon code" 
                    className="bg-white" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                />
                <Button 
                    variant="outline" 
                    onClick={handleApplyCoupon} 
                    disabled={loading || !couponCode}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
            </div>
        ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 p-2 rounded-md text-sm text-green-700 animate-in fade-in">
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> applied</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-green-800 hover:text-red-600 transition">
                    <X className="h-4 w-4" />
                </button>
            </div>
        )}

        {/* Discount Row (Only visible if coupon applied) */}
        {appliedCoupon && (
            <div className="flex justify-between text-sm font-medium text-green-600 animate-in slide-in-from-left-2">
                <span>Discount</span>
                <span>-{formatPrice(appliedCoupon.amount)}</span>
            </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <div className="text-right">
            <span className="text-xl font-bold text-primary block">{formatPrice(total)}</span>
            <span className="text-xs text-muted-foreground font-normal">+ Shipping</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex flex-col gap-4">
        <Button asChild className="w-full h-12 text-base font-bold shadow-md hover:shadow-lg transition-all">
          <Link href={checkoutUrl}>
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