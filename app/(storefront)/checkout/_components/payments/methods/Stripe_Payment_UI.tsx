// File: app/(storefront)/checkout/_components/payments/methods/Stripe_Payment_UI.tsx

"use client";

import { useEffect, useState } from "react";
import { useCheckoutStore } from "../../../useCheckoutStore";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { createStripeIntent } from "@/app/actions/storefront/checkout/create-stripe-intent";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

// --- INNER FORM ---
const StripeForm = ({ amount }: { amount: number }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    
    const { cartId, shippingAddress, billingAddress, selectedShippingMethod, couponCode, totals, selectedPaymentMethod } = useCheckoutStore();
  
    // Determine mode based on selection
    const isCard = selectedPaymentMethod === 'stripe_card';
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
  
      setLoading(true);
      const { error: submitError } = await elements.submit();
      if (submitError) {
          console.error("🔴 [Stripe] Element Validation Error:", submitError.message);
          toast.error(submitError.message);
          setLoading(false);
          return;
      }
  
      const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: `${window.location.origin}/checkout/success` },
          redirect: "if_required",
      });
  
      if (error) {
          console.error("🔴 [Stripe] Confirm Error:", error.message);
          toast.error(error.message || "Payment failed");
          setLoading(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
          console.log("✅ [Stripe] Payment Succeeded:", paymentIntent.id);
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
              console.error("🔴 [Stripe] Order Save Failed:", res.error);
              toast.error("Order creation failed. Contact support.");
              setLoading(false);
          }
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement 
            options={{ 
                layout: "accordion", 
                wallets: { applePay: 'auto', googlePay: 'auto' }
            }} 
            onReady={() => console.log("🟢 [Stripe] Element Ready!")}
        />
        
        <Button type="submit" disabled={!stripe || loading} className="w-full bg-[#635BFF] hover:bg-[#534ac2] text-white h-12 text-base font-bold shadow-md transition-all flex items-center gap-2">
          {loading ? <><Loader2 className="animate-spin h-5 w-5" /> Processing...</> : <><Lock size={16} /> Pay ${amount.toFixed(2)}</>}
        </Button>
        
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          Payments are secure and encrypted.
        </div>
      </form>
    );
};

// --- WRAPPER ---
export const Stripe_Payment_UI = ({ methodConfig }: { methodConfig: any }) => {
  const { cartId, shippingAddress, selectedShippingMethod, couponCode, totals, selectedPaymentMethod } = useCheckoutStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publicKey = methodConfig.stripeConfig?.testMode 
        ? methodConfig.stripeConfig?.testPublishableKey 
        : methodConfig.stripeConfig?.livePublishableKey;
    
    console.log("🔍 [Stripe Debug] Public Key Found:", !!publicKey);

    if (publicKey) setStripePromise(loadStripe(publicKey));
  }, [methodConfig]);

  useEffect(() => {
    const initPayment = async () => {
        // Validation Logs
        if (!cartId || !selectedShippingMethod || !shippingAddress.postcode || totals.total <= 0) {
            console.warn("⚠️ [Stripe Warning] Prerequisites missing:", {
                cartId: !!cartId,
                shippingMethod: !!selectedShippingMethod,
                postcode: !!shippingAddress.postcode,
                total: totals.total
            });
            return;
        }

        console.log("🔵 [Stripe] Creating Payment Intent...");
        
        const res = await createStripeIntent({
            cartId,
            shippingMethodId: selectedShippingMethod.id,
            shippingCost: selectedShippingMethod.price,
            couponCode: couponCode || undefined,
            address: shippingAddress
        });

        if (res.success && res.clientSecret) {
            console.log("✅ [Stripe] Intent Created:", res.clientSecret.slice(0, 10) + "...");
            setClientSecret(res.clientSecret);
            setError(null);
        } else {
            console.error("🔴 [Stripe Error]", res.error);
            setError(res.error || "Failed to initialize payment.");
        }
    };

    const timer = setTimeout(initPayment, 600);
    return () => clearTimeout(timer);
  }, [cartId, selectedShippingMethod, shippingAddress, couponCode, totals.subtotal, selectedPaymentMethod]);

  if (!selectedShippingMethod) {
    return <div className="p-4 border border-dashed rounded text-center text-sm text-gray-500">Select shipping first.</div>;
  }

  if (error) {
    return <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md border border-red-200">{error}</div>;
  }

  if (!clientSecret || !stripePromise) {
    return <div className="py-10 flex flex-col items-center gap-2"><Loader2 className="h-8 w-8 animate-spin text-[#635BFF]" /><p className="text-xs text-gray-400">Loading Secure Gateway...</p></div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2">
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', labels: 'floating', variables: { colorPrimary: '#635BFF' } } }}>
            <StripeForm amount={totals.total} />
        </Elements>
    </div>
  );
};