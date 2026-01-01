// app/actions/storefront/header-footer/Cart_Icon.tsx
"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { getCartDetails } from "@/app/actions/storefront/cart/get-cart-details";

export const Cart_Icon = ({ initialCount = 0 }: { initialCount?: number }) => {
  // আমরা এখানে অপটিমিস্টিক বা রিয়েল টাইম কাউন্ট দেখাতে পারি
  // আপাতত সিম্পল প্রপস দিয়ে করছি
  return (
    <Link href="/cart" className="relative text-slate-600 hover:text-blue-600 transition">
      <ShoppingCart size={20} />
      {initialCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">
          {initialCount}
        </span>
      )}
    </Link>
  );
};