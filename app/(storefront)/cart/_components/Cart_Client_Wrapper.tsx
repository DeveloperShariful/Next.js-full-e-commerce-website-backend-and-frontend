// File: app/(storefront)/cart/_components/Cart_Client_Wrapper.tsx

"use client";

import { Cart_Item_Row } from "./Cart_Item_Row";
import { Cart_Summary } from "./Cart_Summary";

interface CartProps {
  cart: any; // Type from getCartDetails response
}

export const Cart_Client_Wrapper = ({ cart }: CartProps) => {
  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
      
      {/* LEFT: Cart Items List (8 Columns) */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Row (Desktop Only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-sm font-medium text-gray-500">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Quantity</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          {/* Items Loop */}
          <div className="divide-y divide-gray-100">
            {cart.items.map((item: any) => (
              <Cart_Item_Row key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Summary & Checkout (4 Columns) */}
      <div className="lg:col-span-4 mt-8 lg:mt-0">
        <div className="sticky top-24">
          <Cart_Summary cart={cart} />
        </div>
      </div>

    </div>
  );
};