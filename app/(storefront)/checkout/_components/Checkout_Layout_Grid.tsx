// File: app/(storefront)/checkout/_components/Checkout_Layout_Grid.tsx

"use client";

import { useCheckoutStore } from "./../useCheckoutStore";

// Left Side Components
import { Contact_Info } from "./forms/Contact_Info";
import { Shipping_Address } from "./forms/Shipping_Address";
import { Billing_Address } from "./forms/Billing_Address";
import { Order_Notes } from "./forms/Order_Notes";

// Right Side Components
import { Order_Summary_Wrapper } from "./summary/Order_Summary_Wrapper";
import { Payment_Container } from "./payments/Payment_Container";

export const Checkout_Layout_Grid = () => {
  const { isProcessing } = useCheckoutStore();

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative pb-20 ${isProcessing ? "opacity-60 pointer-events-none cursor-wait" : ""}`}>
      
      {/* =========================================
          LEFT COLUMN: FORMS (Contact, Address, Notes)
          Span: 7/12
      ========================================= */}
      <div className="lg:col-span-7 space-y-10">
        
        {/* 1. Contact Info */}
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                1. Contact Information
            </h2>
            <Contact_Info />
        </section>

        {/* 2. Shipping Address */}
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                2. Shipping Address
            </h2>
            <Shipping_Address />
        </section>

        {/* 3. Billing Address */}
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                3. Billing Address
            </h2>
            <Billing_Address />
        </section>
        
        {/* 4. Order Notes */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
            <Order_Notes />
        </section>

      </div>

      {/* =========================================
          RIGHT COLUMN: SUMMARY & PAYMENT
          Span: 5/12 (Sticky Sidebar)
      ========================================= */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 space-y-6">
            
            {/* Upper Block: Order Summary (Products, Coupon, Shipping Selector, Totals) */}
            <Order_Summary_Wrapper />

            {/* Lower Block: Payment Section (Methods & Place Order Button) */}
            <Payment_Container />
            
            {/* Trust Badges / Info */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs text-gray-400 pt-2">
                <div className="flex flex-col items-center gap-1">
                    <span>🔒</span> SSL Secure
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span>🛡️</span> Buyer Protection
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span>⚡</span> Fast Checkout
                </div>
            </div>

        </div>
      </div>

    </div>
  );
};