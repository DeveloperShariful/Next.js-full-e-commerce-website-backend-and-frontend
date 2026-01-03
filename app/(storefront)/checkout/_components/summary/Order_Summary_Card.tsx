// File: app/(storefront)/checkout/_components/summary/Order_Summary_Card.tsx
"use client";

import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Cart_Preview_List } from "./Cart_Preview_List";
import { Discount_Form } from "./Discount_Form";
import { Price_Breakdown } from "./Price_Breakdown";

export const Order_Summary_Card = () => {
  const { cart } = useCheckoutStore();

  if (!cart) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            <p className="text-sm text-gray-500 mt-1">{cart.items.length} items in cart</p>
        </div>

        {/* Cart Items (Scrollable) */}
        <div className="max-h-[350px] overflow-y-auto p-6 border-b border-gray-100 scrollbar-thin scrollbar-thumb-gray-200">
            <Cart_Preview_List items={cart.items} />
        </div>

        {/* Discount Code */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
            <Discount_Form />
        </div>

        {/* Price Breakdown */}
        <div className="p-6 bg-gray-50/50">
            <Price_Breakdown />
        </div>

    </div>
  );
};