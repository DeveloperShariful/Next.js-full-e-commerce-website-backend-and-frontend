// File: app/(storefront)/checkout/_components/payments/Stripe_Form.tsx

"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useCheckoutStore } from "../../_store/useCheckoutStore";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";

export const Stripe_Form = ({ methodConfig }: { methodConfig: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  
  const { cartId, shippingAddress, billingAddress, selectedShippingMethod, couponCode, totals } = useCheckoutStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    // ১. ফর্ম ভ্যালিডেশন
    const { error: submitError } = await elements.submit();
    if (submitError) {
        toast.error(submitError.message);
        setLoading(false);
        return;
    }

    // ২. পেমেন্ট প্রসেস করা
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
        
        // ৩. অর্ডার সেভ করা (সার্ভার অ্যাকশন)
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
            toast.error("Payment succeeded but order failed. Contact support.");
            setLoading(false);
        }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <PaymentElement />
      
      <Button 
        type="submit" 
        disabled={!stripe || loading} 
        className="w-full bg-[#635BFF] hover:bg-[#534ac2] text-white h-12 text-base font-semibold"
      >
        {loading ? (
            <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...
            </>
        ) : (
            <>
                <Lock className="h-4 w-4 mr-2" /> Pay ${totals.total.toFixed(2)}
            </>
        )}
      </Button>
      
      <p className="text-xs text-center text-gray-500 mt-2">
        <Lock className="h-3 w-3 inline mr-1" />
        Payments are secure and encrypted.
      </p>
    </form>
  );
};