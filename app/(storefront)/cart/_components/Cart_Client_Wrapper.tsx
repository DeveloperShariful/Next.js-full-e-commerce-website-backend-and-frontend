// File: app/(storefront)/cart/_components/Cart_Client_Wrapper.tsx

"use client";

import { useEffect, useRef } from "react"; // useRef ইম্পোর্ট করুন
import { useRouter } from "next/navigation";
import { mergeCart } from "@/app/actions/storefront/cart/merge-cart";
import { Cart_Item_Row } from "./Cart_Item_Row";
import { Cart_Summary } from "./Cart_Summary";

interface CartProps {
  cart: any; 
  initialCoupon?: any; 
}

export const Cart_Client_Wrapper = ({ cart, initialCoupon }: CartProps) => {
  const router = useRouter();
  const ranOnce = useRef(false); // দুইবার রান হওয়া ঠেকানোর জন্য

  useEffect(() => {
    if (ranOnce.current) return; // React Strict Mode এ ডাবল কল আটকাতে
    ranOnce.current = true;

    const runMerge = async () => {
      // @ts-ignore - যদি mergeCart এর টাইপ আপডেট না করে থাকেন
      const res = await mergeCart();
      
      // শুধুমাত্র যদি আসলেই মার্জ বা কোনো চেঞ্জ হয়, তবেই রিফ্রেশ করুন
      if (res && res.merged) {
        router.refresh();
      }
    };
    
    runMerge();
  }, [router]);

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
      
      {/* LEFT: Cart Items List */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {cart.items.map((item: any) => (
              <Cart_Item_Row key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Summary */}
      <div className="lg:col-span-4 mt-8 lg:mt-0">
        <div className="sticky top-24">
          <Cart_Summary cart={cart} initialCoupon={initialCoupon} />
        </div>
      </div>

    </div>
  );
};