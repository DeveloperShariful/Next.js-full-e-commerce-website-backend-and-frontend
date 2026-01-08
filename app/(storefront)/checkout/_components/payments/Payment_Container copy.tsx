// File: app/(storefront)/checkout/_components/payments/Payment_Container.tsx

"use client";

import { useCheckoutStore } from "../../useCheckoutStore";
import { Payment_Method_List } from "./Payment_Method_List";
import { PayPal_Payment_UI } from "./methods/PayPal_Payment_UI";
import { Stripe_Payment_UI } from "./methods/Stripe_Payment_UI";
import { Offline_Payment_UI } from "./methods/Offline_Payment_UI";

export const Payment_Container = () => {
  const { selectedPaymentMethod, settings } = useCheckoutStore();

  // Find Config logic updated to handle split IDs
  let methodConfig = null;
  
  if (selectedPaymentMethod?.startsWith('stripe')) {
      methodConfig = settings?.paymentMethods?.find((m: any) => m.identifier === 'stripe');
  } else {
      methodConfig = settings?.paymentMethods?.find((m: any) => m.identifier === selectedPaymentMethod);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
            <p className="text-sm text-gray-500 mt-0.5">All transactions are secure and encrypted.</p>
        </div>

        <div className="p-5 border-b border-gray-100">
            <Payment_Method_List />
        </div>

        <div className="p-5 bg-gray-50/30 min-h-[100px]">
            {!selectedPaymentMethod ? (
                <p className="text-sm text-gray-500 text-center py-4">Please select a payment method.</p>
            ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* PAYPAL */}
                    {selectedPaymentMethod === "paypal" && methodConfig && (
                        <PayPal_Payment_UI methodConfig={methodConfig} />
                    )}

                    {/* STRIPE (Card, Afterpay, Klarna) */}
                    {selectedPaymentMethod?.startsWith("stripe") && methodConfig && (
                        <Stripe_Payment_UI methodConfig={methodConfig} />
                    )}

                    {/* OFFLINE (COD, Bank, Cheque) */}
                    {["cod", "bank_transfer", "cheque"].includes(selectedPaymentMethod || "") && methodConfig && (
                        <Offline_Payment_UI methodConfig={methodConfig} />
                    )}

                </div>
            )}
        </div>
    </div>
  );
};