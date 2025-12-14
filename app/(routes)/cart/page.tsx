// app/(routes)/cart/page.tsx

"use client";

import { useEffect, useState } from "react";
import useCart from "@/hooks/use-cart"; 
import Link from "next/link";
import Image from "next/image";
import { 
  Trash2, Plus, Minus, ShoppingBag, 
  ArrowRight, Lock 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency', currency: 'BDT', minimumFractionDigits: 0
    }).format(price);
  };

  const onCheckout = () => {
    if (cart.items.length === 0) {
        toast.error("Cart is empty");
        return;
    }
    router.push("/checkout");
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="container mx-auto px-6">
        
        <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
           <ShoppingBag className="text-blue-600"/> Shopping Cart
           <span className="text-sm font-normal text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
             {cart.items.length} Items
           </span>
        </h1>

        {cart.items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={48} className="text-slate-400 opacity-50"/>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
                <p className="text-slate-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
                <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Start Shopping <ArrowRight size={18}/>
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* CART ITEMS */}
                <div className="lg:col-span-8">
                   <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 space-y-6">
                          {cart.items.map((item) => (
                             <div key={item.cartItemId} className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                                {/* ✅ FIXED IMAGE: Placeholder if src is empty */}
                                <div className="relative w-full sm:w-32 h-32 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                                   <Image 
                                     src={item.image && item.image !== "" ? item.image : "https://placehold.co/600x400?text=No+Image"} 
                                     alt={item.name} 
                                     fill 
                                     className="object-cover"
                                   />
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {item.selectedVariantName 
                                                        ? `Variant: ${item.selectedVariantName}` 
                                                        : (item.category ? `Category: ${item.category.name}` : "General Product")}
                                                </p>
                                            </div>
                                            <p className="font-bold text-lg text-slate-900">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-4">
                                        <div className="flex items-center border border-slate-200 rounded-lg">
                                            <button onClick={() => cart.decrementItem(item.cartItemId)} className="p-2 hover:bg-slate-100 text-slate-600 transition" disabled={item.quantity <= 1}>
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-10 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                                            <button onClick={() => cart.incrementItem(item.cartItemId)} className="p-2 hover:bg-slate-100 text-slate-600 transition">
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <button onClick={() => cart.removeItem(item.cartItemId)} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium transition">
                                            <Trash2 size={16} /> Remove
                                        </button>
                                    </div>
                                </div>
                             </div>
                          ))}
                      </div>
                   </div>
                </div>

                {/* ORDER SUMMARY */}
                <div className="lg:col-span-4">
                   <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
                      <h2 className="text-lg font-bold text-slate-800 mb-6">Order Summary</h2>
                      <div className="space-y-3 text-sm border-b border-slate-100 pb-6 mb-6">
                          <div className="flex justify-between text-slate-600">
                              <span>Subtotal</span>
                              <span className="font-bold text-slate-800">{formatPrice(cart.getSubtotal())}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                              <span>Shipping</span>
                              <span className="text-slate-400 italic">Calculated at checkout</span>
                          </div>
                          {cart.discountAmount > 0 && (
                              <div className="flex justify-between text-green-600">
                                  <span>Discount ({cart.couponCode})</span>
                                  <span>-{formatPrice(cart.discountAmount)}</span>
                              </div>
                          )}
                      </div>

                      <div className="flex justify-between items-center mb-6">
                          <span className="text-lg font-bold text-slate-800">Total</span>
                          <span className="text-2xl font-extrabold text-blue-600">{formatPrice(cart.getSubtotal())}</span>
                      </div>

                      <button 
                        onClick={onCheckout}
                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 group"
                      >
                         Proceed to Checkout <ArrowRight size={18} className="group-hover:translate-x-1 transition"/>
                      </button>

                      <div className="mt-6 flex flex-col gap-3 text-xs text-slate-500 text-center">
                          <p className="flex items-center justify-center gap-1">
                              <Lock size={12}/> Secure Checkout Guaranteed
                          </p>
                      </div>
                   </div>
                </div>

            </div>
        )}
      </div>
    </div>
  );
}