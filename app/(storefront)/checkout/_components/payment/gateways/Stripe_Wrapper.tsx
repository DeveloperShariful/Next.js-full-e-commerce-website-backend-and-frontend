// File: app/(storefront)/checkout/_components/payment/gateways/Stripe_Wrapper.tsx

"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createStripeIntent } from "@/app/actions/storefront/checkout/create-stripe-intent";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { processCheckout } from "@/app/actions/storefront/checkout/process-checkout";
import { useFormContext } from "react-hook-form";

// 1. Inner Form Component (যেখানে কার্ড ইনপুট থাকে)
const StripeForm = ({ clientSecret, cartId }: { clientSecret: string, cartId: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { getValues } = useFormContext(); // মেইন ফর্ম ডাটা পাওয়ার জন্য
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    // A. Stripe Payment Confirm
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // আমরা পেজ রিডাইরেক্ট না করে নিজেরা হ্যান্ডেল করব
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error) {
      toast.error(error.message || "Payment failed");
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // B. Payment Success -> Process Order in Database
      const formData = getValues(); // ফর্মের সব ডাটা (Address, Email etc)
      
      // Calculate totals (এটি একটি ডামি ক্যালকুলেশন, আসল লজিক সার্ভারে চেক হয়)
      // রিয়েল অ্যাপে এখানে `Order_Summary` থেকে টোটাল আনা উচিত
      const checkoutPayload = {
        cartId,
        userId: undefined, // Guest
        guestInfo: { email: formData.email, name: `${formData.shippingAddress.firstName} ${formData.shippingAddress.lastName}`, phone: formData.shippingAddress.phone },
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
        paymentMethod: "stripe",
        paymentId: paymentIntent.id,
        shippingData: { method: "flat_rate", cost: 0 }, // TODO: Pass real shipping data
        discountId: undefined,
        totals: { subtotal: 0, tax: 0, discount: 0, total: paymentIntent.amount / 100 } // Amount from Stripe
      };

      const res = await processCheckout(checkoutPayload);

      if (res.success) {
        window.location.href = `/checkout/success?orderId=${res.orderId}`;
      } else {
        toast.error("Payment successful but order creation failed. Contact support.");
      }
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || loading} 
        className="w-full bg-[#635BFF] hover:bg-[#5851DF] text-white font-bold h-11"
      >
        {loading ? <Loader2 className="animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
        Pay Now
      </Button>
    </form>
  );
};

// 2. Main Wrapper (Provider Setup)
export const Stripe_Wrapper = ({ cartId }: { cartId: string }) => {
  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    const initStripe = async () => {
      const res = await createStripeIntent(cartId);
      if (res.success && res.clientSecret && res.publishableKey) {
        setStripePromise(loadStripe(res.publishableKey));
        setClientSecret(res.clientSecret);
      } else {
        toast.error("Failed to initialize Stripe");
      }
    };
    initStripe();
  }, [cartId]);

  if (!clientSecret || !stripePromise) {
    return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 border rounded-md bg-white mt-4 animate-in fade-in">
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <StripeForm clientSecret={clientSecret} cartId={cartId} />
      </Elements>
    </div>
  );
};