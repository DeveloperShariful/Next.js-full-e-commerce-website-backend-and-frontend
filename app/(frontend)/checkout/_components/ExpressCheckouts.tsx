//app/(frontend)/checkout/_components/ExpressCheckouts.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useStripe, useElements, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ExpressCheckoutsProps {
  total: number;
  onOrderPlace: (paymentData: any) => Promise<{ orderId: string; orderNumber: string } | null>;
  isShippingSelected: boolean;
  cartItems: any[];
  customerInfo: any;
  selectedShipping: string;
  shippingRates: any[];
  appliedCoupons: any[];
}

export default function ExpressCheckouts(props: ExpressCheckoutsProps) {
  const { total, onOrderPlace, isShippingSelected, customerInfo, appliedCoupons, cartItems } = props;
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (total > 0) {
      fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, customerInfo, appliedCoupons })
      })
      .then(res => res.json())
      .then(data => { if (data.clientSecret) setClientSecret(data.clientSecret); });
    }
  }, [total, appliedCoupons, customerInfo]);

  const handleConfirm = async () => {
    if (!stripe || !elements || !clientSecret) return;
    const toastId = toast.loading("Processing your quick checkout...");

    try {
      const orderDetails = await onOrderPlace({ paymentMethodId: 'stripe' });
      if (!orderDetails) throw new Error("Order session failed.");

      await fetch('/api/stripe/update-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: clientSecret.split('_secret_')[0],
          orderId: orderDetails.orderId,
          amount: total,
          customerInfo,
          cartItems
        })
      });

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: `${window.location.origin}/order-success?order_id=${orderDetails.orderId}` },
        redirect: 'if_required',
      });

      if (error) throw new Error(error.message);
      
      if (paymentIntent.status === 'succeeded') {
        await fetch('/api/stripe/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderDetails.orderId, paymentIntentId: paymentIntent.id })
        });
        toast.success("Order Placed!", { id: toastId });
        router.push(`/order-success?order_id=${orderDetails.orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed", { id: toastId });
    }
  };

  if (!clientSecret) return null;

  return (
    <div className="w-full relative mb-6">
      {!isShippingSelected && (
        <div onClick={() => toast.error("Select shipping method first.")} className="absolute inset-0 z-10 cursor-not-allowed" />
      )}
      <ExpressCheckoutElement onConfirm={handleConfirm} />
      <div className="text-center text-gray-400 text-[12px] mt-4 font-bold uppercase tracking-widest">— Quick Checkout —</div>
    </div>
  );
}