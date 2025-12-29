// File: app/(storefront)/cart/_components/order-summary.tsx
"use client";

import { CartWithItems } from "@/app/actions/storefront/cart/queries";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";

interface SummaryProps {
  cart: CartWithItems;
}

export default function OrderSummary({ cart }: SummaryProps) {
  if (!cart) return null;

  // Client-side calculation for immediate feedback
  const subtotal = cart.items.reduce((acc, item) => {
    const price = item.variant?.salePrice ?? item.variant?.price ?? item.product.salePrice ?? item.product.price;
    return acc + (price * item.quantity);
  }, 0);

  // Example tax logic (replace with real logic later)
  const taxEstimate = subtotal * 0.1; 
  const total = subtotal + taxEstimate;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h2>
      
      <div className="space-y-4 text-sm text-slate-600 pb-6 border-b border-slate-100">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-slate-500 italic">Calculated at checkout</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (Est. 10%)</span>
          <span>${taxEstimate.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center py-6">
        <span className="text-lg font-bold text-slate-900">Total</span>
        <span className="text-2xl font-black text-slate-900">${total.toFixed(2)}</span>
      </div>

      {/* Coupon Input */}
      <div className="mb-6 relative">
        <div className="absolute left-3 top-3 text-slate-400">
          <Tag size={16} />
        </div>
        <input 
          type="text" 
          placeholder="Promo code" 
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
        />
      </div>

      <Link 
        href="/checkout"
        className="w-full bg-slate-900 text-white text-center py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base"
      >
        Proceed to Checkout <ArrowRight size={18} />
      </Link>
      
      <div className="mt-4 text-[10px] text-center text-slate-400 uppercase tracking-wide font-semibold">
        Secure Checkout • SSL Encrypted
      </div>
    </div>
  );
}