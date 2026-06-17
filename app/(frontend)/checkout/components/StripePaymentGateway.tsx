// app/(frontend)/checkout/components/StripePaymentGateway.tsx
'use client';

import React, { useState, forwardRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

// ============================================================================
// 1. INTERFACES
// ============================================================================
export interface AddressDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postcode: string;
}

export interface CartItemDTO {
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price?: string | number;
  variationId?: string;
}

export interface ShippingRateDTO {
  id: string;
  label: string;
  cost: number;
}

export interface CouponDTO {
  code: string;
  amount: number;
}

interface StripePaymentGatewayProps {
  publicKey: string;
  // ✅ FIX: clientSecret + stripePaymentIntentId come from CheckoutClientComponent (shared PI).
  // Before: this component created its own PI on mount → double PI creation on page load.
  // Now: receives the centrally-managed PI — zero API calls from this component.
  clientSecret: string | null;
  stripePaymentIntentId: string | null;
  onPlaceOrder: (paymentData?: {
    transaction_id?: string;
    shippingAddress?: Partial<AddressDTO>;
    redirect_needed?: boolean;
    paymentMethodId?: string;
  }) => Promise<{ orderId: string; orderKey: string } | void | null>;
  customerInfo: Partial<AddressDTO>;
  total: number;
  cartItems: CartItemDTO[];
  shippingInfo?: Partial<AddressDTO>;
  selectedShipping: string;
  shippingRates: ShippingRateDTO[];
  appliedCoupons: CouponDTO[];
  // kept for compatibility but no longer drives rendering
  selectedPaymentMethod?: string;
}

// ============================================================================
// 2. STRIPE FORM — handles credit card submit
// ============================================================================
const StripeForm = forwardRef<
  HTMLFormElement,
  StripePaymentGatewayProps & { clientSecret: string }
>(
  (
    {
      clientSecret,
      stripePaymentIntentId,
      onPlaceOrder,
      customerInfo,
      shippingInfo,
      cartItems,
      total,
      selectedShipping,
      shippingRates,
      appliedCoupons,
    },
    ref
  ) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isProcessing || !stripe || !elements) return;
      if (!clientSecret || !stripePaymentIntentId) {
        toast.error('Payment system not ready. Please refresh the page.');
        return;
      }

      setIsProcessing(true);
      toast.loading('Processing secure payment...', { id: 'stripe-payment' });

      try {
        // ── Step 1: Create order in DB ────────────────────────
        const orderDetails = await onPlaceOrder({ paymentMethodId: 'stripe' });
        if (!orderDetails?.orderId || !orderDetails?.orderKey) {
          throw new Error('Could not create order. Please try again.');
        }

        // ── Step 2: Link orderId to shared PI + confirm amount ─
        // Server will use DB amount (security: ignores frontend amount).
        const selectedRate = shippingRates.find(r => r.id === selectedShipping);
        await fetch('/api/stripe/update-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: stripePaymentIntentId,
            amount: total,             // server overrides this with DB amount
            orderId: orderDetails.orderId,
            customerInfo,
            shippingInfo: shippingInfo || customerInfo,
            cartItems,
            appliedCoupons,
            metadata: {
              shipping_method_id: selectedShipping || '',
              shipping_method_title: selectedRate?.label || 'Standard Shipping',
              shipping_cost: String(selectedRate?.cost || '0'),
            },
          }),
        });

        // ── Step 3: Validate card form fields ─────────────────
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new Error(submitError.message || 'Please check your card details.');
        }

        // ── Step 4: Confirm payment → redirects to return_url ─
        const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;

        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: returnUrl },
        });

        // If confirmPayment resolves without redirect, it means payment failed
        if (error) throw new Error(error.message || 'Payment failed or was declined.');

      } catch (error: unknown) {
        toast.dismiss('stripe-payment');
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
        // ✅ FIX: Reset processing state so user can retry without page refresh
        setIsProcessing(false);
      }
    };

    return (
      <form ref={ref} onSubmit={handleSubmit}>
        <div className="p-3 border border-[#ccc] rounded-[5px] bg-white">
          <PaymentElement />
        </div>
      </form>
    );
  }
);
StripeForm.displayName = 'StripeForm';

// ============================================================================
// 3. MAIN GATEWAY — wraps form in Elements with shared clientSecret
// ============================================================================
const StripePaymentGatewayComponent = forwardRef<HTMLFormElement, StripePaymentGatewayProps>(
  (props, ref) => {
    const { publicKey, clientSecret } = props;

    // loadStripe is cached by key — safe to call on every render
    const [stripePromise] = useState(() =>
      publicKey ? loadStripe(publicKey) : null
    );

    if (!stripePromise) {
      return (
        <div className="p-5 text-center text-[#555] bg-[#f9f9f9] rounded-lg">
          Loading payment options...
        </div>
      );
    }

    // ✅ FIX: Show skeleton while PI is being created by CheckoutClientComponent.
    // Before: would call create-payment-intent here → 2nd duplicate PI on page load.
    // Now: wait for parent's shared PI. No API call from this component.
    if (!clientSecret) {
      return (
        <div className="p-5 text-center text-[#555] bg-[#f9f9f9] rounded-lg animate-pulse">
          Initializing payment options...
        </div>
      );
    }

    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: 'stripe' },
        }}
      >
        <StripeForm ref={ref} {...props} clientSecret={clientSecret} />
      </Elements>
    );
  }
);
StripePaymentGatewayComponent.displayName = 'StripePaymentGateway';

export default StripePaymentGatewayComponent;