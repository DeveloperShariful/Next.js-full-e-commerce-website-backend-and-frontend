// File: app/(storefront)/checkout/_components/payments/Payment_Container.tsx

"use client";

import { useCheckoutStore } from "../../useCheckoutStore";
import { Payment_Method_List } from "./Payment_Method_List";
import { PayPal_Payment_UI } from "./methods/PayPal_Payment_UI";
import { Stripe_Payment_UI } from "./methods/Stripe_Payment_UI";
import { Offline_Payment_UI } from "./methods/Offline_Payment_UI";

export const Payment_Container = () => {
  const { selectedPaymentMethod, settings } = useCheckoutStore();

  // Find config for selected method
  const methodConfig = settings?.paymentMethods?.find(
    (m: any) => m.identifier === selectedPaymentMethod
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
            <p className="text-sm text-gray-500 mt-0.5">All transactions are secure and encrypted.</p>
        </div>

        {/* 1. Payment Method Selection (Radio List) */}
        <div className="p-5 border-b border-gray-100">
            <Payment_Method_List />
        </div>

        {/* 2. Dynamic Button / Form Area */}
        <div className="p-5 bg-gray-50/30 min-h-[100px]">
            {!selectedPaymentMethod ? (
                <p className="text-sm text-gray-500 text-center py-4">Please select a payment method.</p>
            ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* PAYPAL */}
                    {selectedPaymentMethod === "paypal" && (
                        <PayPal_Payment_UI methodConfig={methodConfig} />
                    )}

                    {/* STRIPE */}
                    {selectedPaymentMethod === "stripe" && (
                        <Stripe_Payment_UI methodConfig={methodConfig} />
                    )}

                    {/* OFFLINE (COD, Bank, Cheque) */}
                    {["cod", "bank_transfer", "cheque"].includes(selectedPaymentMethod) && (
                        <Offline_Payment_UI methodConfig={methodConfig} />
                    )}

                </div>
            )}
        </div>

    </div>
  );
};