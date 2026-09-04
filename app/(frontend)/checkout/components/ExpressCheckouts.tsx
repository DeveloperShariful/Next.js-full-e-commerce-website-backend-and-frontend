// app/(frontend)/checkout/components/ExpressCheckouts.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadStripe, type StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import WalletEscapeHatch from './WalletEscapeHatch';

/**
 * Result of asking Stripe whether any wallet (Apple Pay / Google Pay / Link) can
 * show. 'none' is the normal state inside a Facebook/Instagram in-app browser,
 * where Meta has not enabled the Payment Request API.
 */
type WalletProbe = 'probing' | 'available' | 'none';

/**
 * Never collapse wallets into a "See more" overflow menu. Stripe's default
 * (overflow: 'auto') lets it hide buttons when space is tight — on a narrow
 * phone that meant only Link fit and Google Pay was buried behind "See more",
 * so most mobile shoppers never saw the one-tap button at all.
 *
 * maxColumns / maxRows are deliberately left unset — both already default to 0
 * (unlimited), so the desktop side-by-side arrangement is unchanged. Stripe
 * forbids combining overflow: 'never' with maxRows > 0; we don't set maxRows.
 *
 * Module scope so the object identity is stable and never triggers a needless
 * elements.update() on re-render.
 */
const EXPRESS_CHECKOUT_OPTIONS = {
  layout: { overflow: 'never' as const },
};

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
  // Nullable on purpose: the wallet buttons now render before the PaymentIntent
  // exists (it isn't needed to display them — see the note on the early return
  // below). onConfirm guards for it, and by the time a customer has approved in
  // the wallet sheet it has long since arrived.
  clientSecret: string | null;
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

  // The `event` argument matters: Stripe only closes the wallet / Link interface
  // when event.paymentFailed() is called. Every failure path below MUST call it,
  // or the customer is left staring at "Processing…" forever while the error
  // toast sits behind the payment sheet where they can't see it.
  const onConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) {
      toast.error('Payment system not ready. Please try again.');
      event.paymentFailed({ reason: 'fail' });
      return;
    }

    // The PaymentIntent is created in parallel by CheckoutClient and is normally
    // ready long before anyone finishes approving in the wallet sheet. This only
    // fires in the rare race where someone taps within the first moments.
    if (!clientSecret) {
      toast.error('Still preparing your payment. Please try again in a moment.');
      event.paymentFailed({ reason: 'fail', message: 'Still preparing your payment. Please try again in a moment.' });
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

      // Step 2: Sync the PaymentIntent to the authoritative order total BEFORE
      // confirming. Passing orderId makes the route look the order up and
      // overwrite the PI amount with order.total from the database
      // (update-payment-intent/route.ts:53-65) — so the charge can never drift
      // from what the order actually says.
      //
      // Deliberately AWAITED. It used to be fire-and-forget for speed, but that
      // let confirmPayment race ahead while the PI still carried the older
      // debounced amount from CheckoutClient (debouncedUpdatePIAmount, 800ms).
      // Costs one round-trip, spent while "Processing…" is already on screen.
      const piSync = await fetch('/api/stripe/update-payment-intent', {
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

      if (!piSync.ok) {
        // Never confirm against an unverified amount — fail loudly instead.
        console.error('[ExpressCheckout] PI amount sync failed:', piSync.status);
        throw new Error('Could not verify the payment amount. Please try another payment method.');
      }

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
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast.dismiss('express-checkout');
      toast.error(message);

      // Without this the Link / Google Pay sheet never learns the payment failed
      // and spins on "Processing…" indefinitely — the toast is hidden behind it,
      // so the customer has no idea what happened and no way forward.
      event.paymentFailed({ reason: 'fail', message });
    }
  };

  return (
    <ExpressCheckoutElement
      options={EXPRESS_CHECKOUT_OPTIONS}
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

  // Test hook: ?forcenowallet=1 pins the probe to 'none'. Needed because Link is
  // offered in almost every normal browser, so you cannot otherwise reproduce
  // the "no wallets" state outside a real in-app browser.
  //
  // The effect writes a ref only — never setState — so it cannot cascade a
  // render. Whichever arrives first, Stripe's onReady or the 4.5s timeout below,
  // routes through handleWalletProbe and lands on 'none'.
  const forcedNoWallet = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    forcedNoWallet.current = window.location.search.includes('forcenowallet=1');
  }, []);

  // Stable identity; pins the result to 'none' when the test hook is on.
  const handleWalletProbe = useCallback((state: WalletProbe) => {
    setWalletProbe(forcedNoWallet.current ? 'none' : state);
  }, []);

  // The element only exists once this is true — deliberately the same condition
  // as the early return below. An ungated timer would fire during the skeleton
  // window and wrongly declare 'none' before ExpressCheckoutElement had even
  // mounted.
  const elementMounted = !!stripePromise && total > 0;

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

  // Wait only for Stripe.js and a real total.
  //
  // Deliberately NOT waiting for clientSecret: <Elements> below runs on
  // mode + amount (Stripe's deferred-intent pattern), and clientSecret is used
  // only inside stripe.confirmPayment — i.e. after the customer has already
  // approved in the wallet sheet. Gating the render on it made the buttons wait
  // for a whole extra round-trip (/api/stripe/create-payment-intent) that they
  // don't need in order to appear.
  //
  // Tapping too early is still impossible in practice: the !isShippingSelected
  // overlay below blocks clicks until a shipping rate is chosen, and onConfirm
  // guards for a null clientSecret regardless.
  if (!stripePromise || total <= 0) {
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
        <CheckoutForm {...props} clientSecret={clientSecret} onWalletProbe={handleWalletProbe} />
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
      {/* z-20 lifts this ABOVE the !isShippingSelected overlay (z-10) above.
          That overlay exists to block Express Checkout until shipping is picked,
          but this link only opens a browser — it must stay tappable, and in the
          in-app browser people usually see it before choosing shipping. */}
      <div className="relative z-20">
        <WalletEscapeHatch active={walletProbe === 'none'} />
      </div>
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