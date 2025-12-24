// components/front/mini-cart.tsx

"use client";

import { useEffect, useState } from "react";
import useCart from "@/app/actions/storeFont/use-cart"; // গ্লোবাল স্টোর
import { ShoppingCart, X, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MiniCart() {
  const [isMounted, setIsMounted] = useState(false);
  const cart = useCart(); // ✅ কার্ট স্টোর ব্যবহার করছি
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition">
        <ShoppingCart size={20} />
        <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
      </button>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency', currency: 'BDT', minimumFractionDigits: 0
    }).format(price);
  };

  const handleCheckout = () => {
    cart.onClose(); // ✅ গ্লোবাল ক্লোজ ফাংশন
    router.push("/checkout");
  };

  return (
    <>
      {/* Cart Trigger Button */}
      <button 
        onClick={cart.onOpen} // ✅ বাটন ক্লিক করলে গ্লোবাল স্টেট আপডেট হবে
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition group"
      >
        <ShoppingCart size={20} className="group-hover:text-blue-600"/>
        {cart.items.length > 0 && (
          <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
            {cart.items.length}
          </span>
        )}
      </button>

      {/* Overlay Backdrop */}
      {cart.isOpen && ( // ✅ চেক করছি গ্লোবাল 'isOpen' ট্রু কিনা
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-sm"
          onClick={cart.onClose} // ✅ বাইরে ক্লিক করলে বন্ধ হবে
        />
      )}

      {/* Sliding Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[60] shadow-2xl transform transition-transform duration-300 ease-in-out ${cart.isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <ShoppingCart size={20} className="text-blue-600"/> My Cart ({cart.items.length})
           </h2>
           <button onClick={cart.onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition">
             <X size={20}/>
           </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 h-[calc(100vh-180px)]">
           {cart.items.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-400">
                <ShoppingCart size={64} className="opacity-20"/>
                <p>Your cart is empty.</p>
                <button onClick={cart.onClose} className="text-blue-600 font-bold hover:underline text-sm">Continue Shopping</button>
             </div>
           ) : (
             <div className="space-y-4">
               {cart.items.map((item) => (
                 <div key={item.cartItemId} className="flex gap-3 group">
                    <div className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                       <Image 
                         src={item.image && item.image !== "" ? item.image : "https://placehold.co/100"} 
                         alt={item.name} 
                         fill 
                         className="object-cover"
                       />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                       <div>
                          <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-slate-500">
                            {item.selectedVariantName || "Regular"}
                          </p>
                       </div>
                       <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-slate-900">
                             {item.quantity} x {formatPrice(item.price)}
                          </p>
                          <button 
                            onClick={() => cart.removeItem(item.cartItemId)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                          >
                             <Trash2 size={14}/>
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="absolute bottom-0 left-0 w-full bg-white border-t p-4 space-y-4">
             <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                <span>Subtotal</span>
                <span>{formatPrice(cart.getSubtotal())}</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <Link 
                  href="/cart"
                  onClick={cart.onClose}
                  className="py-3 border border-slate-300 rounded-lg text-center text-sm font-bold hover:bg-slate-50 transition"
                >
                  View Cart
                </Link>
                <button 
                  onClick={handleCheckout}
                  className="py-3 bg-slate-900 text-white rounded-lg text-center text-sm font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  Checkout <ArrowRight size={16}/>
                </button>
             </div>
          </div>
        )}
      </div>
    </>
  );
}