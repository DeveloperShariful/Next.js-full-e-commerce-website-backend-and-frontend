//app/(storefront)/checkout/_components/ExpressCheckouts.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  selectedShippingId: string;
  shippingInfo: any;
  couponCode?: string;
  onOrderPlace: (paymentData: any) => Promise<any>;
  isShippingSelected: boolean;
}

export default function ExpressCheckouts({ 
  total, 
  stripePublishableKey, 
  cartId, 
  selectedShippingId, 
  shippingInfo, 
  couponCode, 
  onOrderPlace, 
  isShippingSelected 
}: ExpressCheckoutsProps) {
  
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromise] = useState(() => loadStripe(stripePublishableKey));
  const lastUpdateRef = useRef<string>("");

  useEffect(() => {
    const initOrUpdatePayment = async () => {
      if (!cartId || cartId === "" || total <= 0) return;
      const currentUpdateKey = `${selectedShippingId}-${total}-${couponCode}`;
      if (lastUpdateRef.current === currentUpdateKey) return;

      try {
        if (!paymentIntentId) {
          const res = await createPaymentIntent({
            cartId,
            shippingMethodId: selectedShippingId || undefined,
            shippingAddress: shippingInfo || undefined,
            couponCode: couponCode || undefined
          });

          if (res.success && res.data) {
              setClientSecret(res.data.clientSecret);
              setPaymentIntentId(res.data.id);
              lastUpdateRef.current = currentUpdateKey;
          }
        } else {

          const res = await updatePaymentIntent({
            paymentIntentId,
            cartId,
            shippingMethodId: selectedShippingId || undefined,
            shippingAddress: shippingInfo || undefined,
            couponCode: couponCode || undefined
          });
          
          if (res.success) {
            lastUpdateRef.current = currentUpdateKey;
          }
        }
      } catch (err) {
        console.error("Stripe Checkout Sync Error:", err);
      }
    };
    const timer = setTimeout(initOrUpdatePayment, 500);
    return () => clearTimeout(timer);

  }, [total, cartId, selectedShippingId, couponCode, shippingInfo, paymentIntentId]);

  if (!clientSecret || !stripePromise) {
    return <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse mb-4"></div>;
  }

  return (
    <div className="w-full relative mb-6">
      {!isShippingSelected && (
        <div 
            onClick={() => toast.error('Please select a shipping option first.')}
            className="absolute top-0 left-0 w-full h-full z-10 cursor-not-allowed bg-white/50"
        />
      )}
      
      <Elements 
        key={paymentIntentId + (selectedShippingId || "")} 
        options={{ clientSecret, appearance: { theme: 'stripe' } }} 
        stripe={stripePromise}
      >
        <div className="min-h-[48px]">
          <ExpressForm onOrderPlace={onOrderPlace} clientSecret={clientSecret} />
        </div>
      </Elements>
      
      <div className="text-center text-gray-500 font-medium text-sm my-4 flex items-center gap-2 justify-center">
        <span className="h-px w-10 bg-gray-300"></span>
        <span>OR</span>
        <span className="h-px w-10 bg-gray-300"></span>
      </div>
    </div>
  );
}

function ExpressForm({ onOrderPlace, clientSecret }: { onOrderPlace: any, clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

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
      const names = paymentIntent.shipping?.name?.split(' ') || [];
      const shippingDetails = {
        firstName: names[0] || 'Guest',
        lastName: names.slice(1).join(' ') || '',
        address1: paymentIntent.shipping?.address?.line1 || '',
        city: paymentIntent.shipping?.address?.city || '',
        state: paymentIntent.shipping?.address?.state || '',
        postcode: paymentIntent.shipping?.address?.postal_code || '',
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