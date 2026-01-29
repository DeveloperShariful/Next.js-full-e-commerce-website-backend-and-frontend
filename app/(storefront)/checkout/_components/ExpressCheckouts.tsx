//app/(storefront)/checkout/_components/ExpressCheckouts.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { createPaymentIntent, updatePaymentIntent } from '@/app/actions/storefront/checkout/stripe-payment';

interface ShippingFormData {
  firstName: string; lastName: string; address1: string; city: string;
  state: string; postcode: string; email: string; phone: string;
}

interface ExpressCheckoutsProps {
  total: number;
  stripePublishableKey: string;
  cartId: string;
  onOrderPlace: (paymentData: { 
    transaction_id: string; 
    paymentMethodId: string;
    shippingAddress?: Partial<ShippingFormData>; 
  }) => Promise<{ orderId: string; orderKey: string } | void | null>;
  isShippingSelected: boolean;
  selectedShippingId: string;
}

const CheckoutForm = ({ onOrderPlace, clientSecret }: { onOrderPlace: any, clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();

  // 🔥 FIX: elements প্যারামিটার থেকে না নিয়ে হুক থেকে নেওয়া হচ্ছে
  const onConfirm = async () => {
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
    } else if (paymentIntent?.status === 'succeeded') {
      toast.success('Payment Successful!');
      
      const stripeAddress = paymentIntent.shipping;
      const names = stripeAddress?.name?.split(' ') || [];
      
      const shippingDetails = {
        firstName: names[0] || 'Guest',
        lastName: names.slice(1).join(' ') || '',
        address1: stripeAddress?.address?.line1 || '',
        city: stripeAddress?.address?.city || '',
        state: stripeAddress?.address?.state || '',
        postcode: stripeAddress?.address?.postal_code || '',
        email: paymentIntent.receipt_email || '', 
      };
      
      await onOrderPlace({ 
        transaction_id: paymentIntent.id,
        paymentMethodId: 'stripe_wallet',
        shippingAddress: shippingDetails
      });
    }
  };

  return <ExpressCheckoutElement onConfirm={onConfirm} />;
}

export default function ExpressCheckouts({ total, onOrderPlace, isShippingSelected, stripePublishableKey, cartId, selectedShippingId }: ExpressCheckoutsProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromise] = useState(() => loadStripe(stripePublishableKey));

  useEffect(() => {
    const initPayment = async () => {
      if (!cartId) return;

      if (!paymentIntentId) {
        const res = await createPaymentIntent(cartId, selectedShippingId);
        if (res.clientSecret && res.id) {
            setClientSecret(res.clientSecret);
            setPaymentIntentId(res.id);
        }
      } else {
        await updatePaymentIntent(paymentIntentId, cartId, selectedShippingId);
      }
    };

    const timer = setTimeout(() => {
        initPayment();
    }, 500);

    return () => clearTimeout(timer);
  }, [total, cartId, selectedShippingId, paymentIntentId]);

  if (!clientSecret || !stripePromise) {
    return <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse mb-4"></div>;
  }

  const options = {
    clientSecret,
    paymentMethods: {
        googlePay: 'always' as const,
        applePay: 'always' as const,
    }
  };

  return (
    <div className="w-full relative mb-6">
      {!isShippingSelected && (
        <div 
            onClick={() => toast.error('Please select a shipping option first.')}
            className="absolute top-0 left-0 w-full h-full z-10 cursor-not-allowed bg-white/50"
        />
      )}
      
      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm onOrderPlace={onOrderPlace} clientSecret={clientSecret} />
      </Elements>
      
      <div className="text-center text-gray-500 font-medium text-sm my-4 flex items-center gap-2 justify-center">
        <span className="h-px w-10 bg-gray-300"></span>
        <span>OR</span>
        <span className="h-px w-10 bg-gray-300"></span>
      </div>
    </div>
  );
}