// File: app/(storefront)/checkout/_components/payments/methods/PayPal_Payment_UI.tsx

"use client";

import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useCheckoutStore } from "../../../useCheckoutStore";
import { createPaypalOrder } from "@/app/actions/storefront/checkout/create-paypal-order";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

export const PayPal_Payment_UI = ({ methodConfig }: { methodConfig: any }) => {
  const { cartId, shippingAddress, billingAddress, selectedShippingMethod, couponCode, totals, settings, customerNote } = useCheckoutStore();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const config = methodConfig.paypalConfig;
  const currency = settings?.currency || "AUD";
  const clientId = config?.sandbox ? config?.sandboxClientId : config?.liveClientId;

  // Validation: Ensure shipping info is present before rendering buttons
  useEffect(() => {
    const hasShipping = Boolean(shippingAddress?.postcode && selectedShippingMethod);
    setIsReady(!!clientId && hasShipping && totals.total > 0);
  }, [clientId, shippingAddress, selectedShippingMethod, totals.total]);

  if (!isReady) {
    return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <AlertCircle className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Please enter shipping address to pay with PayPal.</p>
        </div>
    );
  }

  return (
    <div className="w-full relative z-0 animate-in fade-in zoom-in-95">
        <PayPalScriptProvider options={{ 
            clientId: clientId,
            currency: currency,
            intent: config?.intent?.toLowerCase() || "capture",
            components: "buttons,messages" // Added messages for Pay Later
        }}>
            {/* Pay Later Message */}
            {config?.payLaterMessaging && (
                <div className="mb-4">
                    {/* @ts-ignore - PayPal types issue workaround */}
                    <paypal-messages 
                        amount={totals.total.toString()} 
                        style={{ layout: "text", logo: { type: "primary" } }} 
                    />
                </div>
            )}

            <PayPalButtons 
                style={{ 
                    layout: config?.buttonLayout?.toLowerCase() || "vertical",
                    color: config?.buttonColor?.toLowerCase() || "gold",
                    shape: config?.buttonShape?.toLowerCase() || "rect",
                    label: config?.buttonLabel?.toLowerCase() || "paypal"
                }}
                
                // 1. Create Order on Server
                createOrder={async (data, actions) => {
                    const res = await createPaypalOrder({
                        cartId: cartId!,
                        shippingMethodId: selectedShippingMethod!.id,
                        couponCode: couponCode || undefined,
                        address: shippingAddress
                    });

                    if (res.success && res.orderId) {
                        return res.orderId;
                    } else {
                        toast.error(res.error || "Failed to initialize PayPal");
                        throw new Error("PayPal Init Failed");
                    }
                }}

                // 2. Capture & Finalize
                onApprove={async (data, actions) => {
                    const toastId = toast.loading("Processing your order...");
                    
                    const res = await processCheckout({
                        cartId: cartId!,
                        shippingAddress,
                        billingAddress,
                        paymentMethod: "paypal",
                        paymentId: data.orderID,
                        shippingData: {
                            method: selectedShippingMethod!.type,
                            carrier: selectedShippingMethod!.name,
                            cost: selectedShippingMethod!.price,
                            methodId: selectedShippingMethod!.id
                        },
                        couponCode: couponCode || undefined,
                        totals: { ...totals }
                    });

                    toast.dismiss(toastId);

                    if (res.success) {
                        router.push(`/checkout/success/${res.orderId}`);
                    } else {
                        toast.error("Payment received but order creation failed. Please contact support.");
                    }
                }}

                onError={(err) => {
                    console.error("PayPal Error:", err);
                    toast.error("Payment could not be processed. Please try again.");
                }}
            />
        </PayPalScriptProvider>
    </div>
  );
};