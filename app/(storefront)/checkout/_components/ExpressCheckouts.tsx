//app/(storefront)/checkout/_components/ExpressCheckouts.tsx

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { createPaymentIntent, updatePaymentIntent } from '@/app/actions/storefront/checkout/stripe-payment';

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

let stripePromise: Promise<any> | null = null;
const getStripe = (key: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

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
  const [isSyncing, setIsSyncing] = useState(false);
  const prevTotal = useRef(total);
  const prevShippingId = useRef(selectedShippingId);
  const prevCoupon = useRef(couponCode);
  useEffect(() => {
    const initPayment = async () => {
      if (!cartId || total <= 0 || paymentIntentId) return;

      try {
        const res = await createPaymentIntent({
            cartId,
            shippingMethodId: selectedShippingId || undefined,
            shippingAddress: shippingInfo || undefined,
            couponCode: couponCode || undefined
        });

        if (res.success && res.data) {
            setClientSecret(res.data.clientSecret);
            setPaymentIntentId(res.data.id);
        }
      } catch (err) {
        console.error("Stripe Init Error:", err);
      }
    };

    initPayment();
  }, [cartId]); 
  useEffect(() => {
    if (
        total === prevTotal.current && 
        selectedShippingId === prevShippingId.current && 
        couponCode === prevCoupon.current
    ) {
        return;
    }
    const updateStripeAmount = async () => {
        if (!paymentIntentId) return;
        setIsSyncing(true);

        try {
             console.log("🔄 Syncing Stripe Total:", total);

            const res = await updatePaymentIntent({
                paymentIntentId,
                cartId,
                shippingMethodId: selectedShippingId || undefined,
                shippingAddress: shippingInfo || undefined,
                couponCode: couponCode || undefined
            });
            
            if (res.success && res.data?.clientSecret) {
                setClientSecret(res.data.clientSecret);
                prevTotal.current = total;
                prevShippingId.current = selectedShippingId;
                prevCoupon.current = couponCode;
            }
        } catch (err) {
            console.error("Stripe Update Error:", err);
            toast.error("Could not update payment total");
        } finally {
            setTimeout(() => {
                setIsSyncing(false);
            }, 500);
        }
    };

    const timer = setTimeout(updateStripeAmount, 600);
    return () => clearTimeout(timer);

  }, [total, selectedShippingId, couponCode, paymentIntentId, cartId, shippingInfo]);

  const options = useMemo(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret: clientSecret,
      appearance: { theme: 'stripe' as const },
    };
  }, [clientSecret]);

  if (!clientSecret || !options) {
    return <div className="h-[48px] w-full bg-gray-100 rounded animate-pulse mb-6"></div>;
  }

  return (
    <div className="w-full relative mb-6">
      
      {!isShippingSelected && (
        <div 
            onClick={() => toast.error('Please select a shipping option first.')}
            className="absolute top-0 left-0 w-full h-full z-20 cursor-not-allowed bg-white/60"
        />
      )}
      
      {isSyncing ? (
          <div className="h-[48px] w-full flex items-center justify-center bg-gray-50 border rounded-lg">
              <span className="text-sm text-gray-500 animate-pulse">Updating Total...</span>
          </div>
      ) : (
          <Elements 
            key={total + (selectedShippingId || "") + (couponCode || "")} 
            stripe={getStripe(stripePublishableKey)}
            options={options}
          >
            <div className="min-h-[48px]">
               <ExpressForm onOrderPlace={onOrderPlace} />
            </div>
          </Elements>
      )}
      
      <div className="text-center text-gray-400 font-medium text-xs mt-4 flex items-center gap-2 justify-center uppercase tracking-wide">
        <span className="h-px w-8 bg-gray-200"></span>
        <span>Or pay with card</span>
        <span className="h-px w-8 bg-gray-200"></span>
      </div>
    </div>
  );
}

function ExpressForm({ onOrderPlace }: { onOrderPlace: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onConfirm = async (event: any) => {
    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || "Payment Failed");
      toast.error(error.message || 'Payment failed');
    } else if (paymentIntent?.status === 'succeeded') {
      
      const shipping = paymentIntent.shipping;
      const names = shipping?.name?.split(' ') || [];
      
      const shippingDetails = {
        firstName: names[0] || 'Guest',
        lastName: names.slice(1).join(' ') || '',
        address1: shipping?.address?.line1 || '',
        city: shipping?.address?.city || '',
        state: shipping?.address?.state || '',
        postcode: shipping?.address?.postal_code || '',
        email: paymentIntent.receipt_email || '', 
      };
      
      await onOrderPlace({ 
        transaction_id: paymentIntent.id,
        paymentMethodId: 'stripe_express',
        shippingAddress: shippingDetails
      });
    }
  };

  return (
    <>
        <ExpressCheckoutElement onConfirm={onConfirm} />
        {errorMessage && <div className="text-red-500 text-sm mt-2">{errorMessage}</div>}
    </>
  );
}