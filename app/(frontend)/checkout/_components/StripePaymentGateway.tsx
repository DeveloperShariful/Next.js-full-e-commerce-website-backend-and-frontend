//app/(frontend)/checkout/components/StripePaymentGateway.tsx

"use client";

import React, { useState, forwardRef, useEffect } from 'react';
import Image from 'next/image';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface StripePaymentGatewayProps {
  selectedPaymentMethod: string;
  onPlaceOrder: (paymentData?: any) => Promise<{ orderId: string; orderNumber: string } | null>;
  customerInfo: any;
  total: number;
  cartItems: any[];
  shippingInfo: any;
  selectedShipping: string;
  appliedCoupons: any[];
}

const StripePaymentGateway = forwardRef<HTMLFormElement, StripePaymentGatewayProps>((props, ref) => {
  const { selectedPaymentMethod, onPlaceOrder, customerInfo, total, cartItems, shippingInfo, selectedShipping, appliedCoupons } = props;
  
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [internalMethodType, setInternalMethodType] = useState<string>('card');

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret || isProcessing) return;

    setIsProcessing(true);
    const toastId = toast.loading("Securely processing your order...");

    try {
      // ১. ডাটাবেজে পেন্ডিং অর্ডার তৈরি
      const orderDetails = await onPlaceOrder({ paymentMethodId: selectedPaymentMethod });
      if (!orderDetails) throw new Error("Could not initialize order session.");

      // ২. পেমেন্ট ইন্টেন্ট আপডেট (Order ID ম্যাপ করা)
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

      // ৩. পেমেন্ট কনফার্মেশন
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-success?order_id=${orderDetails.orderId}`,
        },
        redirect: 'if_required',
      });

      if (error) throw new Error(error.message);
      
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // ৪. পেমেন্ট ক্যাপচার করা (স্টক আপডেট)
        await fetch('/api/stripe/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderDetails.orderId, paymentIntentId: paymentIntent.id })
        });
        toast.success("Success! Order placed.", { id: toastId });
        router.push(`/order-success?order_id=${orderDetails.orderId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed", { id: toastId });
      setIsProcessing(false);
    }
  };

  if (!clientSecret) return <div className="py-10 text-center text-gray-400 animate-pulse font-medium text-sm">Initializing Secure Gateway...</div>;

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement onChange={(e) => setInternalMethodType(e.value.type)} options={{ layout: "tabs" }} />
      {internalMethodType !== 'card' && (
        <div className="p-3 bg-blue-50 text-blue-700 text-[12px] rounded-lg border border-blue-100 italic">
          Note: You will be briefly redirected to securely authorize this payment.
        </div>
      )}
    </form>
  );
});

StripePaymentGateway.displayName = 'StripePaymentGateway';
export default StripePaymentGateway;