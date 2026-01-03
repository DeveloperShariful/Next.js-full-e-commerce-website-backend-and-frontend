// File: app/(storefront)/checkout/_components/payments/PayPal_Button.tsx

"use client";

import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { createPaypalOrder } from "@/app/actions/storefront/checkout/create-paypal-order";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const PayPal_Button = ({ methodConfig }: { methodConfig: any }) => {
  const { cartId, shippingAddress, billingAddress, selectedShippingMethod, couponCode, totals, settings, customerNote } = useCheckoutStore();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const config = methodConfig.paypalConfig;
  const currency = settings?.currency || "AUD";

  // ক্লায়েন্ট আইডি ডিটেকশন (Sandbox vs Live)
  const clientId = config?.sandbox ? config?.sandboxClientId : config?.liveClientId;

  // বাটন লোড হওয়ার আগে চেক করা সব ডাটা আছে কি না
  useEffect(() => {
    if (clientId && selectedShippingMethod && shippingAddress.postcode && totals.total > 0) {
        setIsReady(true);
    } else {
        setIsReady(false);
    }
  }, [clientId, selectedShippingMethod, shippingAddress, totals.total]);

  if (!isReady) {
    return <div className="p-4 text-center text-sm text-gray-500">Please complete shipping details first.</div>;
  }

  return (
    <div className="w-full relative z-0 pt-2">
        <PayPalScriptProvider options={{ 
            clientId: clientId,
            currency: currency,
            intent: config?.intent?.toLowerCase() || "capture",
            components: "buttons" // ✅ FIX: এই লাইনটি যোগ করা হয়েছে যা এরর ফিক্স করবে
        }}>
            <PayPalButtons 
                style={{ 
                    layout: config?.buttonLayout?.toLowerCase() || "vertical",
                    color: config?.buttonColor?.toLowerCase() || "gold",
                    shape: config?.buttonShape?.toLowerCase() || "rect",
                    label: config?.buttonLabel?.toLowerCase() || "paypal"
                }}
                
                // ১. অর্ডার তৈরি (Server Action কল করবে)
                createOrder={async (data, actions) => {
                    const res = await createPaypalOrder({
                        cartId: cartId!,
                        shippingMethodId: selectedShippingMethod!.id,
                        couponCode: couponCode || undefined,
                        address: shippingAddress
                    });

                    if (res.success && res.orderId) {
                        return res.orderId; // PayPal Order ID
                    } else {
                        toast.error(res.error || "Failed to init PayPal");
                        throw new Error("PayPal Init Failed");
                    }
                }}

                // ২. পেমেন্ট সফল হলে (Capture & Save to DB)
                onApprove={async (data, actions) => {
                    toast.loading("Processing order...");
                    
                    // PayPal পেমেন্ট হয়ে গেছে, এখন আমাদের ডাটাবেসে অর্ডার সেভ করতে হবে
                    const res = await processCheckout({
                        cartId: cartId!,
                        shippingAddress,
                        billingAddress,
                        paymentMethod: "paypal",
                        paymentId: data.orderID, // PayPal Transaction ID
                        shippingData: {
                            method: selectedShippingMethod!.type,
                            carrier: selectedShippingMethod!.name,
                            cost: selectedShippingMethod!.price,
                            methodId: selectedShippingMethod!.id
                        },
                        couponCode: couponCode || undefined,
                       // customerNote: customerNote,
                        totals: { ...totals }
                    });

                    if (res.success) {
                        toast.dismiss();
                        toast.success("Payment successful!");
                        router.push(`/checkout/success/${res.orderId}`);
                    } else {
                        toast.dismiss();
                        toast.error("Payment received but order creation failed. Contact support.");
                    }
                }}

                onError={(err) => {
                    console.error("PayPal Error:", err);
                    toast.error("Payment could not be processed.");
                }}
            />
        </PayPalScriptProvider>
    </div>
  );
};