// app/(frontend)/checkout/components/ExpressCheckouts.tsx
'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

// ============================================================================
// 1. INTERFACES
// ============================================================================
export interface AddressDTO {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postcode: string;
  email: string;
  phone: string;
}

export interface ShippingRateDTO {
  id: string;
  label: string;
  cost: number;
}

export interface CartItemDTO {
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price?: number | string;
  variationId?: string;
}

export interface CouponDTO {
  code: string;
  amount: number;
}

interface ExpressCheckoutsProps {
  publicKey: string;
  // ✅ FIX: clientSecret comes from CheckoutClientComponent (shared PI).
  // Before: this component created its own PI on mount + re-created on every total change.
  // Now: one PI is created centrally → passed here. No API call from this component.
  clientSecret: string | null;
  total: number;
  onOrderPlace: (paymentData: {
    transaction_id?: string;
    shippingAddress?: Partial<AddressDTO>;
    paymentMethodId?: string;
  }) => Promise<{ orderId: string; orderKey: string } | void | null>;
  isShippingSelected: boolean;
  cartItems: CartItemDTO[];
  customerInfo: Partial<AddressDTO>;
  selectedShipping: string;
  shippingRates: ShippingRateDTO[];
  appliedCoupons: CouponDTO[];
}

// ============================================================================
// 2. INNER FORM — handles onConfirm after Apple/Google Pay approval
// ============================================================================
function CheckoutForm({
  clientSecret,
  onOrderPlace,
  cartItems,
  customerInfo,
  selectedShipping,
  shippingRates,
  appliedCoupons,
}: ExpressCheckoutsProps & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

  const onConfirm = async () => {
    if (!stripe || !elements) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    toast.loading('Processing express checkout...', { id: 'express-checkout' });

    try {
      // Step 1: Create order in DB
      const orderDetails = await onOrderPlace({ paymentMethodId: 'stripe' });
      if (!orderDetails?.orderId || !orderDetails?.orderKey) {
        throw new Error('Could not create an order. Please try another payment method.');
      }

      // Step 2: Link orderId to the shared PI via metadata update
      const paymentIntentId = clientSecret.split('_secret_')[0];
      const selectedRate = shippingRates.find(r => r.id === selectedShipping);

      await fetch('/api/stripe/update-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          orderId: orderDetails.orderId,
          customerInfo,
          cartItems,
          appliedCoupons,
          metadata: {
            shipping_method_id: selectedShipping || '',
            shipping_method_title: selectedRate?.label || 'Standard Shipping',
            shipping_cost: String(selectedRate?.cost || '0'),
          },
        }),
      });

      // Step 3: Confirm payment — Stripe redirects via return_url
      const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
      });

      if (error) throw new Error(error.message || 'Payment failed or was cancelled.');

    } catch (error: unknown) {
      toast.dismiss('express-checkout');
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };

  return <ExpressCheckoutElement onConfirm={onConfirm} />;
}

// ============================================================================
// 3. MAIN COMPONENT — renders only when clientSecret is ready
// ============================================================================
function ExpressCheckoutsComponent(props: ExpressCheckoutsProps) {
  const { publicKey, clientSecret, isShippingSelected } = props;

  // loadStripe is cached by public key — no extra cost on re-renders
  const [stripePromise] = useState(() =>
    publicKey ? loadStripe(publicKey) : null
  );

  // ✅ FIX: If PI not ready yet (clientSecret = null), show skeleton.
  // Before: would immediately start creating a PI here → double PI creation.
  // Now: wait for parent to provide clientSecret — zero API calls from this component.
  if (!clientSecret || !stripePromise) {
    return (
      <div className="w-full">
        <div className="h-12 w-full bg-[#f0f0f0] rounded-lg animate-pulse" />
        <div className="text-center text-[#6b7280] font-medium text-sm mt-2.5">— OR —</div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Overlay blocks clicks if shipping not selected yet */}
      {!isShippingSelected && (
        <div
          onClick={() => toast.error('Please select a shipping option first to use Express Checkout.')}
          className="absolute top-0 left-0 w-full h-full z-10 cursor-not-allowed"
        />
      )}

      {/* ✅ Use same clientSecret as credit card form — one PI for all Stripe methods */}
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: 'stripe' },
        }}
      >
        <CheckoutForm {...props} clientSecret={clientSecret} />
      </Elements>

      <div className="text-center text-[#6b7280] font-medium text-sm mt-2.5">— OR —</div>
    </div>
  );
}

// ============================================================================
// 4. MEMOIZED EXPORT — re-renders only when clientSecret or isShippingSelected change
// ============================================================================
const ExpressCheckouts = React.memo(ExpressCheckoutsComponent, (prev, next) =>
  prev.clientSecret === next.clientSecret &&
  prev.isShippingSelected === next.isShippingSelected &&
  prev.total === next.total
);

export default ExpressCheckouts;