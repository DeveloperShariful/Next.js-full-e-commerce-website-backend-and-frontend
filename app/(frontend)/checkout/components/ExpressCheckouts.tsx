// app/(frontend)/checkout/components/ExpressCheckouts.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import WalletEscapeHatch from './WalletEscapeHatch';

/**
 * Result of asking Stripe whether any wallet (Apple Pay / Google Pay / Link) can
 * show. 'none' is the normal state inside a Facebook/Instagram in-app browser,
 * where Meta has not enabled the Payment Request API.
 */
type WalletProbe = 'probing' | 'available' | 'none';

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
  total,
  onOrderPlace,
  cartItems,
  customerInfo,
  selectedShipping,
  shippingRates,
  appliedCoupons,
  onWalletProbe,
}: ExpressCheckoutsProps & {
  clientSecret: string;
  onWalletProbe: (state: WalletProbe) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  // ✅ FIX: Sync displayed amount in Google Pay / Apple Pay / Link when total changes
  // (shipping selected, coupon applied, etc.) without re-mounting the Elements component.
  useEffect(() => {
    if (!elements || total <= 0) return;
    elements.update({ amount: Math.round(total * 100) });
  }, [elements, total]);

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

      const paymentIntentId = clientSecret.split('_secret_')[0];
      const selectedRate = shippingRates.find(r => r.id === selectedShipping);
      const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;

      // Step 2: Update PI metadata — fire and forget so it never delays confirmPayment.
      // capture-order's security check only fails on active mismatch, not missing metadata.
      fetch('/api/stripe/update-payment-intent', {
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
      }).catch(err => console.error('[ExpressCheckout] PI metadata update failed:', err));

      // Step 3: Confirm payment immediately after order creation.
      // redirect: 'if_required' — Link/saved cards resolve inline (no redirect).
      // Standard redirect flows (3DS etc.) still redirect to return_url.
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed or was cancelled.');
      }

      // Step 4: Payment succeeded inline (no redirect needed) — capture order + navigate.
      // When redirect: 'if_required' causes a browser redirect, this code never runs.
      // When payment resolves inline (Link, saved card), we must add Stripe's URL params
      // manually so OrderConfirmationClient passes its security check.
      if (result.paymentIntent?.status === 'succeeded') {
        await fetch('/api/stripe/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderDetails.orderId,
            paymentIntentId: result.paymentIntent.id,
          }),
        });
        toast.dismiss('express-checkout');
        window.location.href = `${returnUrl}&payment_intent=${result.paymentIntent.id}&payment_intent_client_secret=${clientSecret}`;
      } else {
        toast.dismiss('express-checkout');
        window.location.href = returnUrl;
      }

    } catch (error: unknown) {
      toast.dismiss('express-checkout');
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };

  return (
    <ExpressCheckoutElement
      onConfirm={onConfirm}
      // onReady is the ONLY availability signal in @stripe/react-stripe-js@5.6.0
      // (there is no availablepaymentmethodschange event in this version).
      // availablePaymentMethods is undefined when no wallet can show; the
      // Object.values check also covers Stripe returning an all-false object.
      onReady={({ availablePaymentMethods }) => {
        const hasWallet =
          !!availablePaymentMethods &&
          Object.values(availablePaymentMethods).some(Boolean);
        onWalletProbe(hasWallet ? 'available' : 'none');
      }}
      // Iframe failed to load entirely — plausible in a restrictive WebView.
      onLoadError={() => onWalletProbe('none')}
    />
  );
}

// ============================================================================
// 3. MAIN COMPONENT — renders only when clientSecret is ready
// ============================================================================
function ExpressCheckoutsComponent(props: ExpressCheckoutsProps) {
  const { publicKey, clientSecret, total, isShippingSelected } = props;

  // loadStripe is cached by public key — no extra cost on re-renders
  const [stripePromise] = useState(() =>
    publicKey ? loadStripe(publicKey) : null
  );

  // Has Stripe told us whether any wallet can show? Lives here — above <Elements>
  // and above the early return — so the result survives anything Elements does
  // internally, and so the hooks below never sit after a conditional return.
  const [walletProbe, setWalletProbe] = useState<WalletProbe>('probing');

  // The element only exists once this is true — deliberately the same condition
  // as the early return below. clientSecret arrives asynchronously from
  // CheckoutClient, and an ungated timer would fire during the skeleton window
  // and wrongly declare 'none' before ExpressCheckoutElement had even mounted.
  const elementMounted = !!clientSecret && !!stripePromise && total > 0;

  // Safety net: in a hostile WebView the Stripe iframe can load but never post
  // back, so neither onReady nor onLoadError ever fires. Assume 'none' after
  // 4.5s. The handler stays attached, so a late 'ready' carrying wallets flips
  // this back to 'available' and the fallback disappears — optimistic, then
  // self-correcting, which is why an aggressive timeout is safe here.
  useEffect(() => {
    if (!elementMounted || walletProbe !== 'probing') return;
    const timer = setTimeout(() => setWalletProbe('none'), 4500);
    return () => clearTimeout(timer);
  }, [elementMounted, walletProbe]);

  // Wait for clientSecret (needed at confirmPayment time) and a valid total
  if (!clientSecret || !stripePromise || total <= 0) {
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

      {/* ✅ FIX: Initialize Elements with mode+amount (not clientSecret) so that
          elements.update({ amount }) works when shipping/coupon changes the total.
          clientSecret is passed as a prop to CheckoutForm and used only in
          stripe.confirmPayment — this is Stripe's deferred-intent pattern. */}
      <Elements
        key="ece"
        stripe={stripePromise}
        options={{
          mode: 'payment',
          amount: Math.round(total * 100),
          currency: 'aud',
          appearance: { theme: 'stripe' },
        }}
      >
        <CheckoutForm {...props} clientSecret={clientSecret} onWalletProbe={setWalletProbe} />
      </Elements>

      {/* React reconciles static children by position, and a falsy && branch still
          occupies its slot. Both of the below must stay AFTER <Elements>, never
          before it — inserting a slot ahead of Elements would remount it and
          reset the wallet probe. */}
      {walletProbe !== 'none' && (
        <div className="text-center text-[#6b7280] font-medium text-sm mt-2.5">— OR —</div>
      )}

      {/* Always mounted, hides itself via the prop, so the slot count never
          changes. It renders its own divider when visible — so exactly one
          — OR — shows in every state, and none when there are no wallets and no
          fallback (which also clears the orphan divider that used to sit above
          nothing in the in-app browser). */}
      <WalletEscapeHatch active={walletProbe === 'none'} />
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