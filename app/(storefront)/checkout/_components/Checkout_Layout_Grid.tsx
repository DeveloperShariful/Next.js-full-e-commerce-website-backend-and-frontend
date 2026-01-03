// File: app/(storefront)/checkout/_components/Checkout_Layout_Grid.tsx
"use client";

import { useCheckoutStore } from "../_store/useCheckoutStore";
import { Contact_Info } from "./forms/Contact_Info";
import { Shipping_Address } from "./forms/Shipping_Address";
import { Billing_Address } from "./forms/Billing_Address";
import { Shipping_Method } from "./forms/Shipping_Method";
import { Order_Notes } from "./forms/Order_Notes";
import { Payment_Selector } from "./payments/Payment_Selector";
import { Express_Checkouts } from "./payments/Express_Checkouts";
import { Order_Summary_Card } from "./summary/Order_Summary_Card";

export const Checkout_Layout_Grid = () => {
  const { isProcessing } = useCheckoutStore();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}>
      
      {/* LEFT COLUMN: FORMS */}
      <div className="lg:col-span-7 space-y-8">
        
        {/* Express Checkout (Apple/Google Pay) */}
        <section>
             <Express_Checkouts />
             <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-50 px-2 text-gray-500">Or continue below</span></div>
             </div>
        </section>

        {/* 1. Contact */}
        <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h2>
            <Contact_Info />
        </section>

        {/* 2. Shipping Address (With Autocomplete) */}
        <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Shipping Address</h2>
            <Shipping_Address />
        </section>

        {/* 3. Billing Address */}
        <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Billing Address</h2>
            <Billing_Address />
        </section>

        {/* 4. Shipping Method */}
        <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Shipping Method</h2>
            <Shipping_Method />
        </section>
        
        {/* 5. Order Notes (New) */}
        <section>
            <Order_Notes />
        </section>

        {/* 6. Payment */}
        <section>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Payment</h2>
            <Payment_Selector />
        </section>

      </div>

      {/* RIGHT COLUMN: SUMMARY (Sticky) */}
      <div className="lg:col-span-5">
        <div className="sticky top-8 space-y-6">
            <Order_Summary_Card />
            
            {/* Trust Badges / Info */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-500 pt-4">
                <div>🔒 SSL Secure</div>
                <div>🛡️ Buyer Protection</div>
                <div>↩️ Easy Returns</div>
            </div>
        </div>
      </div>

    </div>
  );
};