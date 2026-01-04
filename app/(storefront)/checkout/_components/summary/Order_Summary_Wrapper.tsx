// File: app/(storefront)/checkout/_components/summary/Order_Summary_Wrapper.tsx

"use client";

import { useCheckoutStore } from "../../useCheckoutStore";
import { Cart_Items } from "./Cart_Items";
import { Discount_Input } from "./Discount_Input";
import { Shipping_Selector } from "./Shipping_Selector";
import { Totals_Display } from "./Totals_Display";

export const Order_Summary_Wrapper = () => {
  const { cart } = useCheckoutStore();

  if (!cart) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            <span className="text-sm text-gray-500">{cart.items.length} items</span>
        </div>

        {/* 1. Cart Items (Scrollable) */}
        <div className="max-h-[320px] overflow-y-auto p-5 border-b border-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
            <Cart_Items items={cart.items} />
        </div>

        {/* 2. Discount Code */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/30">
            <Discount_Input />
        </div>

        {/* 3. Shipping Method Selector (Moved Here) */}
        <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Shipping Method</h3>
            <Shipping_Selector />
        </div>

        {/* 4. Totals Breakdown */}
        <div className="p-5 bg-gray-50/50">
            <Totals_Display />
        </div>

    </div>
  );
};