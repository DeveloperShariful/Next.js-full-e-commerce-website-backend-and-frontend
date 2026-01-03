// File: app/(storefront)/checkout/_components/payments/Stripe_Wrapper.tsx

"use client";

import { useEffect, useState } from "react";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createStripeIntent } from "@/app/actions/storefront/checkout/create-stripe-intent";
import { Stripe_Form } from "./Stripe_Form";
import { Loader2 } from "lucide-react";

export const Stripe_Wrapper = ({ methodConfig }: { methodConfig: any }) => {
  const { cartId, shippingAddress, selectedShippingMethod, couponCode, totals } = useCheckoutStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // ১. স্ট্রাইপ লোড করা
  useEffect(() => {
    const publicKey = methodConfig.stripeConfig?.testMode 
        ? methodConfig.stripeConfig?.testPublishableKey 
        : methodConfig.stripeConfig?.livePublishableKey;

    if (publicKey) {
        setStripePromise(loadStripe(publicKey));
    }
  }, [methodConfig]);

  // ২. পেমেন্ট ইন্টেন্ট তৈরি
  useEffect(() => {
    const initPayment = async () => {
        // সব রিকোয়ারমেন্ট ফিল আপ না হলে কল করব না
        if (!cartId || !selectedShippingMethod || !shippingAddress.postcode || totals.total <= 0) return;

        const res = await createStripeIntent({
            cartId,
            shippingMethodId: selectedShippingMethod.id,
            couponCode: couponCode || undefined,
            address: shippingAddress
        });

        if (res.success && res.clientSecret) {
            setClientSecret(res.clientSecret);
            setError(null);
        } else {
            console.error("Stripe Intent Error:", res.error);
            setError(res.error || "Failed to init payment");
        }
    };

    const timer = setTimeout(() => {
        initPayment();
    }, 500);

    return () => clearTimeout(timer);
  }, [cartId, selectedShippingMethod, shippingAddress, couponCode, totals.total]);

  // Loading State
  if (!selectedShippingMethod) {
    return <div className="text-sm text-gray-500">Please select a shipping method first.</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500 bg-red-50 p-3 rounded">Unable to load payment: {error}</div>;
  }

  if (!clientSecret || !stripePromise) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
    );
  }

  return (
    <Elements 
        stripe={stripePromise} 
        options={{ 
            clientSecret, 
            appearance: { theme: 'stripe', labels: 'floating' } 
        }}
    >
        <Stripe_Form methodConfig={methodConfig} />
    </Elements>
  );
};