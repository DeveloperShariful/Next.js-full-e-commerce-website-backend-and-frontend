// File: app/(storefront)/checkout/_components/summary/Discount_Form.tsx
"use client";

import { useState } from "react";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, Loader2 } from "lucide-react";
import { validateCoupon } from "@/app/actions/storefront/checkout/validate-coupon";
import { toast } from "sonner";

export const Discount_Form = () => {
  const { cartId, applyCoupon, removeCoupon, couponCode, totals, isProcessing } = useCheckoutStore();
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);

  // কুপন সাবমিট হ্যান্ডলার
  const handleApply = async () => {
    if (!inputCode) return;
    setLoading(true);

    // ১. সার্ভারে চেক করা কুপন ভ্যালিড কি না
    const res = await validateCoupon(inputCode, cartId as string);

    if (res.success) {
      // ২. স্টোরে অ্যাপ্লাই করা (যা ক্যালকুলেশন ট্রিগার করবে)
      await applyCoupon(res.code!); 
      toast.success(res.message || "Coupon applied successfully!");
      setInputCode("");
    } else {
      toast.error(res.error || "Invalid coupon code");
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    await removeCoupon();
    toast.success("Coupon removed");
    setLoading(false);
  };

  // যদি কুপন অলরেডি অ্যাপ্লাই করা থাকে
  if (couponCode) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in">
        <div className="flex items-center gap-2 text-green-700">
          <Tag className="h-4 w-4" />
          <div>
            <p className="font-medium text-sm">{couponCode}</p>
            <p className="text-xs opacity-80">Discount applied</p>
          </div>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRemove} 
            disabled={loading || isProcessing} 
            className="h-8 w-8 hover:bg-green-100 text-green-700"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input 
        placeholder="Gift card or discount code" 
        value={inputCode} 
        onChange={(e) => setInputCode(e.target.value)}
        className="bg-white border-gray-300"
        onKeyDown={(e) => e.key === "Enter" && handleApply()}
      />
      <Button 
        onClick={handleApply} 
        disabled={!inputCode || loading || isProcessing}
        variant="outline"
        className="shrink-0 border-gray-300 hover:bg-gray-50 text-gray-700"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
      </Button>
    </div>
  );
};