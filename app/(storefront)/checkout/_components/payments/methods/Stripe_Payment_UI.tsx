// File: app/(storefront)/checkout/_components/payments/methods/Stripe_Payment_UI.tsx

"use client";

import { useEffect, useState } from "react";
import { useCheckoutStore } from "../../../useCheckoutStore";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createStripeIntent } from "@/app/actions/storefront/checkout/create-stripe-intent";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// --- INNER FORM COMPONENT ---
const StripeForm = ({ amount }: { amount: number }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    
    const { cartId, shippingAddress, billingAddress, selectedShippingMethod, couponCode, totals } = useCheckoutStore();
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
  
      if (!stripe || !elements) return;
  
      setLoading(true);
  
      // 1. Validate Elements
      const { error: submitError } = await elements.submit();
      if (submitError) {
          toast.error(submitError.message);
          setLoading(false);
          return;
      }
  
      // 2. Confirm Payment
      const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
              return_url: `${window.location.origin}/checkout/success`,
          },
          redirect: "if_required",
      });
  
      if (error) {
          toast.error(error.message || "Payment failed");
          setLoading(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
          
          // 3. Save Order
          const res = await processCheckout({
              cartId: cartId!,
              shippingAddress,
              billingAddress,
              paymentMethod: "stripe",
              paymentId: paymentIntent.id,
              shippingData: {
                  method: selectedShippingMethod!.type,
                  carrier: selectedShippingMethod!.name,
                  methodId: selectedShippingMethod!.id,
                  cost: selectedShippingMethod!.price
              },
              couponCode: couponCode || undefined,
              totals: { ...totals }
          });
  
          if (res.success) {
              window.location.href = `/checkout/success/${res.orderId}`;
          } else {
              toast.error("Order creation failed. Contact support.");
              setLoading(false);
          }
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement options={{ layout: "tabs" }} />
        
        <Button 
          type="submit" 
          disabled={!stripe || loading} 
          className="w-full bg-[#635BFF] hover:bg-[#534ac2] text-white h-12 text-base font-bold shadow-md transition-all"
        >
          {loading ? (
              <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...
              </>
          ) : (
              <>
                  Pay ${amount.toFixed(2)}
              </>
          )}
        </Button>
        
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
          <Lock className="h-3 w-3" />
          Payments are secure and encrypted by Stripe.
        </div>
      </form>
    );
};

// --- WRAPPER COMPONENT ---
export const Stripe_Payment_UI = ({ methodConfig }: { methodConfig: any }) => {
  const { cartId, shippingAddress, selectedShippingMethod, couponCode, totals } = useCheckoutStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Load Stripe.js
  useEffect(() => {
    const publicKey = methodConfig.stripeConfig?.testMode 
        ? methodConfig.stripeConfig?.testPublishableKey 
        : methodConfig.stripeConfig?.livePublishableKey;

    if (publicKey) {
        setStripePromise(loadStripe(publicKey));
    }
  }, [methodConfig]);

  // 2. Fetch Payment Intent
  useEffect(() => {
    const initPayment = async () => {
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
            setError(res.error || "Failed to initialize payment.");
        }
    };

    // Debounce to prevent rapid calls
    const timer = setTimeout(() => {
        initPayment();
    }, 600);

    return () => clearTimeout(timer);
  }, [cartId, selectedShippingMethod, shippingAddress, couponCode, totals.total]);

  // Validation States
  if (!selectedShippingMethod) {
    return (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <AlertCircle className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 font-medium">Please select a shipping method first.</p>
        </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md border border-red-200">{error}</div>;
  }

  if (!clientSecret || !stripePromise) {
    return (
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#635BFF]" />
            <p className="text-sm text-gray-500">Loading secure payment...</p>
        </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
        <Elements 
            stripe={stripePromise} 
            options={{ 
                clientSecret, 
                appearance: { theme: 'stripe', labels: 'floating' } 
            }}
        >
            <StripeForm amount={totals.total} />
        </Elements>
    </div>
  );
};