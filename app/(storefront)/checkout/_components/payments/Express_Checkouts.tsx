// File: app/(storefront)/checkout/_components/payments/Express_Checkouts.tsx
"use client";

import { useEffect, useState } from "react";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createStripeIntent } from "@/app/actions/storefront/checkout/create-stripe-intent";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ExpressElementForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const { cartId, totals, couponCode } = useCheckoutStore();
    const router = useRouter();

    const onConfirm = async (event: any) => {
        if (!stripe || !elements || !cartId) return;

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret: event.expressPaymentType.clientSecret,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/success`,
            },
            redirect: "if_required"
        });

        if (error) {
            toast.error(error.message || "Payment failed");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            toast.success("Payment successful! Creating order...");
            
            const res = await processCheckout({
                cartId: cartId,
                shippingAddress: { country: 'AU', state: 'NSW', postcode: '2000', city: 'Sydney' }, // Fallback logic needed here for real app
                billingAddress: { country: 'AU' },
                paymentMethod: "stripe_express",
                paymentId: paymentIntent.id,
                shippingData: { method: "express", carrier: "Standard", methodId: "express", cost: 0 },
                couponCode: couponCode || undefined,
                totals: { ...totals }
            });

            if (res.success) {
                router.push(`/checkout/success/${res.orderId}`);
            } else {
                toast.error("Order creation failed. Contact support.");
            }
        }
    };

    return (
        <ExpressCheckoutElement onConfirm={onConfirm} options={{ buttonTheme: { applePay: 'black', googlePay: 'black' } }} />
    );
};

export const Express_Checkouts = () => {
  const { settings, cartId, totals } = useCheckoutStore();
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const stripeConfig = settings?.paymentMethods?.find((m: any) => m.identifier === 'stripe')?.stripeConfig;
    
    if (stripeConfig) {
        const key = stripeConfig.testMode ? stripeConfig.testPublishableKey : stripeConfig.livePublishableKey;
        if (key) setStripePromise(loadStripe(key));
    }
  }, [settings]);

  useEffect(() => {
    const init = async () => {
        if (!cartId || totals.total <= 0) return;

        const res = await createStripeIntent({
            cartId: cartId,
            address: { country: "AU", state: "", postcode: "", suburb: "" },
            shippingMethodId: undefined,
            couponCode: undefined
        });

        if (res.success && res.clientSecret) {
            setClientSecret(res.clientSecret);
        }
    };
    init();
  }, [cartId, totals.total]);

  if (!stripePromise || !clientSecret || totals.total <= 0) return null;

  return (
    <div className="mb-4">
        {/* ✅ FIX: Removed 'mode', 'amount', 'currency' - clientSecret handles everything */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <ExpressElementForm />
        </Elements>
    </div>
  );
};