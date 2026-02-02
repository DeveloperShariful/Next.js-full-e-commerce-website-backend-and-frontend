//File: app/(storefront)/affiliates/_components/coupon-manager.tsx

"use client";

import { useState } from "react";
import { Ticket, Copy, Check, ShoppingBag, Sparkles, Tag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// ✅ Import Global Store
import { useGlobalStore } from "@/app/providers/global-store-provider";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  usageCount: number;
  usageLimit?: number | null;
  expiresAt?: Date | string | null;
}

export default function CouponManager({ coupons }: { coupons: Coupon[] }) {
  // ✅ Dynamic Currency from Global Store
  const { symbol } = useGlobalStore();
  const currency = symbol || "$";

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard!");
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6">
        <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Ticket className="w-5 h-5" />
                </div>
                Active Promotions
            </h3>
            <p className="text-sm text-gray-500 mt-2 max-w-lg">
                Share these exclusive codes with your audience. When they use these codes at checkout, you earn commission.
            </p>
        </div>
      </div>

      {/* Coupon Grid */}
      {coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Tag className="w-8 h-8 opacity-20" />
            </div>
            <h4 className="font-semibold text-gray-900">No coupons assigned</h4>
            <p className="text-sm mt-1 max-w-xs text-center">Contact the affiliate manager to request a custom discount code for your audience.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
                <div key={coupon.id} className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    
                    {/* Decorative Top Gradient */}
                    <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                    <div className="p-6 relative">
                        {/* Cutout Circles (Ticket Effect) */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-r border-gray-200 z-10" />
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border-l border-gray-200 z-10" />

                        {/* Top Info */}
                        <div className="flex justify-between items-start mb-4">
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                                coupon.discountType === "PERCENTAGE" 
                                    ? "bg-purple-50 text-purple-700 border border-purple-100"
                                    : "bg-blue-50 text-blue-700 border border-blue-100"
                            )}>
                                {coupon.discountType === "PERCENTAGE" ? "Percentage Off" : "Fixed Amount"}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                <ShoppingBag className="w-3 h-3" />
                                {coupon.usageCount} used
                            </div>
                        </div>

                        {/* Amount & Code */}
                        <div className="text-center py-2 space-y-1">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight flex justify-center items-baseline">
                                {coupon.discountType === "FIXED" && <span className="text-2xl mr-0.5">{currency}</span>}
                                {coupon.discountValue}
                                {coupon.discountType === "PERCENTAGE" && <span className="text-2xl ml-0.5">%</span>}
                            </h2>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Discount</p>
                        </div>

                        {/* Code Box */}
                        <div className="mt-6 p-1 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between pl-4 pr-1 gap-2">
                            <code className="font-mono font-bold text-lg text-indigo-900 tracking-wide select-all">
                                {coupon.code}
                            </code>
                            <button 
                                onClick={() => handleCopy(coupon.code, coupon.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95",
                                    copiedId === coupon.id
                                        ? "bg-green-500 text-white"
                                        : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 shadow-sm"
                                )}
                            >
                                {copiedId === coupon.id ? (
                                    <> <Check className="w-3.5 h-3.5" /> Copied </>
                                ) : (
                                    <> <Copy className="w-3.5 h-3.5" /> Copy </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Bottom Sparkles */}
                    <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Sparkles className="w-16 h-16 text-indigo-600" />
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}