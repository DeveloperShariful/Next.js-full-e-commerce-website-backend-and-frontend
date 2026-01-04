// File: app/(storefront)/checkout/_components/summary/Discount_Input.tsx

"use client";

import { useState } from "react";
import { useCheckoutStore } from "../../useCheckoutStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, Loader2, Check } from "lucide-react";
import { validateCoupon } from "@/app/actions/storefront/checkout/manage-coupon";
import { toast } from "sonner";

export const Discount_Input = () => {
  const { cartId, applyCoupon, removeCoupon, couponCode, isProcessing } = useCheckoutStore();
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);

    const res = await validateCoupon(inputCode, cartId as string);

    if (res.success) {
      await applyCoupon(res.code!); 
      toast.success(res.message || "Coupon applied!");
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

  // State: Coupon Applied
  if (couponCode) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-2 text-green-700">
          <Tag className="h-4 w-4" />
          <div>
            <p className="font-bold text-sm tracking-wide">{couponCode}</p>
            <p className="text-[10px] uppercase font-bold opacity-80">Applied</p>
          </div>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRemove} 
            disabled={loading || isProcessing} 
            className="h-8 w-8 hover:bg-green-100 text-green-700 rounded-full"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  // State: Default Input
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input 
            placeholder="Gift card or discount code" 
            value={inputCode} 
            onChange={(e) => setInputCode(e.target.value)}
            className="bg-white border-gray-300 h-10 text-sm focus-visible:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      </div>
      <Button 
        onClick={handleApply} 
        disabled={!inputCode || loading || isProcessing}
        variant="outline"
        className="shrink-0 border-gray-300 hover:bg-gray-50 text-gray-700 h-10"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
      </Button>
    </div>
  );
};