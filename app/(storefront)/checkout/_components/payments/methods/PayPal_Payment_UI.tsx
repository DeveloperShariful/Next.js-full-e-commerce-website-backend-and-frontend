// File: app/(storefront)/checkout/_components/payments/methods/PayPal_Payment_UI.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { useCheckoutStore } from "../../../useCheckoutStore";
import { createPaypalOrder } from "@/app/actions/storefront/checkout/create-paypal-order";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

// 🔥 1. INNER WRAPPER COMPONENT (The Fix)
const PayPalButtonsWrapper = ({ 
    config, 
    cartId, 
    shippingAddress, 
    selectedShippingMethod, 
    couponCode, 
    totals 
}: any) => {
    // স্ক্রিপ্টের অবস্থা চেক করার হুক
    const [{ isResolved, isPending }] = usePayPalScriptReducer();
    const router = useRouter();
    const [scriptError, setScriptError] = useState(false);

    // লজিক: স্ক্রিপ্ট লোড না হওয়া পর্যন্ত লোডার দেখাও
    if (isPending || !isResolved) {
        return (
            <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border border-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2"/>
                <p className="text-xs text-gray-500">Connecting to PayPal secure server...</p>
            </div>
        );
    }

    if (scriptError) {
        return (
            <div className="text-center p-4 text-red-500 text-sm">
                PayPal failed to load. Please refresh the page.
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300">
            {/* Pay Later Message */}
            {config?.payLaterMessaging && (
                <div className="mb-6">
                    {/* @ts-ignore */}
                    <paypal-messages 
                        amount={totals.total.toString()} 
                        style={{ layout: "text", logo: { type: "primary" } }} 
                    />
                </div>
            )}

            {/* Smart Buttons */}
            <PayPalButtons 
                style={{ 
                    layout: "vertical", 
                    color: config?.buttonColor?.toLowerCase() || "gold",
                    shape: config?.buttonShape?.toLowerCase() || "rect",
                    label: config?.buttonLabel?.toLowerCase() || "paypal"
                }}
                
                // বাটন রেন্ডার হতে সমস্যা হলে ক্যাচ করা
                onInit={() => console.log("PayPal Button Initialized")}
                
                createOrder={async (data, actions) => {
                    const res = await createPaypalOrder({
                        cartId: cartId!,
                        shippingMethodId: selectedShippingMethod!.id,
                        shippingCost: selectedShippingMethod!.price,
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

                onApprove={async (data, actions) => {
                    const toastId = toast.loading("Processing your order...");
                    
                    const res = await processCheckout({
                        cartId: cartId!,
                        shippingAddress,
                        billingAddress: shippingAddress, // Assuming same for simplicity here
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
                        toast.error("Payment received but order creation failed. Contact support.");
                    }
                }}

                onError={(err) => {
                    console.error("PayPal SDK Error:", err);
                    // বাটন রেন্ডার এরর বা পেমেন্ট এরর হ্যান্ডলিং
                    if (err.toString().includes("window.paypal")) {
                        setScriptError(true);
                    } else {
                        toast.error("Payment could not be processed. Please try again.");
                    }
                }}
            />
        </div>
    );
};

// 🔥 2. MAIN COMPONENT
export const PayPal_Payment_UI = ({ methodConfig }: { methodConfig: any }) => {
  const { cartId, shippingAddress, selectedShippingMethod, couponCode, totals, settings } = useCheckoutStore();
  const [isReady, setIsReady] = useState(false);

  const config = methodConfig?.paypalConfig;
  const currency = settings?.currency || "AUD";
  const clientId = config?.sandbox ? config?.sandboxClientId : config?.liveClientId;

  useEffect(() => {
    if (clientId) {
        setIsReady(true);
    }
  }, [clientId]);

  // useMemo to prevent re-render of ScriptProvider
  const initialOptions = useMemo(() => ({
    clientId: clientId,
    currency: currency,
    intent: config?.intent?.toLowerCase() || "capture",
    components: "buttons,messages",
    "data-sdk-integration-source": "integrationbuilder_sc"
  }), [clientId, currency, config?.intent]);

  if (!isReady) {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
             <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2"/>
             <p className="text-xs text-gray-500">Loading Configuration...</p>
        </div>
    );
  }

  if (!selectedShippingMethod) {
     return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <AlertCircle className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Please select a shipping method first.</p>
        </div>
     );
  }

  return (
    <div className="w-full relative z-0">
        <PayPalScriptProvider options={initialOptions}>
            <PayPalButtonsWrapper 
                config={config}
                cartId={cartId}
                shippingAddress={shippingAddress}
                selectedShippingMethod={selectedShippingMethod}
                couponCode={couponCode}
                totals={totals}
            />
        </PayPalScriptProvider>
    </div>
  );
};