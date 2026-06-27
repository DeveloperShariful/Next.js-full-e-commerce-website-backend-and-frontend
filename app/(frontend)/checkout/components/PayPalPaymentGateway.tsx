// app/(frontend)/checkout/components/PayPalPaymentGateway.tsx

'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

class PayPalButtonErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 text-center">
          PayPal could not load. Please refresh the page to try again.
        </div>
      );
    }
    return this.props.children;
  }
}
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getStoredUTM } from '@/components/SourceTracker';

export interface CartItemDTO {
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price?: number | string;
  variationId?: string;
}

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

export interface CouponDTO {
  code: string;
  amount: number;
}

interface PayPalGatewayProps {
  total: number;
  isPlacingOrder: boolean;
  isShippingSelected: boolean;
  cartItems: CartItemDTO[];
  customerInfo: Partial<AddressDTO>;
  shippingInfo?: Partial<AddressDTO>;
  selectedShipping: string;
  shippingRates: ShippingRateDTO[];
  appliedCoupons: CouponDTO[];
  orderNotes: string;
}

const PayPalPaymentGatewayComponent = ({
  total,
  isPlacingOrder,
  isShippingSelected,
  cartItems,
  customerInfo,
  shippingInfo,
  selectedShipping,
  shippingRates,
  appliedCoupons,
  orderNotes,
}: PayPalGatewayProps) => {

  const router = useRouter();
  const { clearCart } = useCart();
  const wcOrderIdRef = useRef<string | null>(null);
  const wcOrderKeyRef = useRef<string | null>(null);

  // Refs keep the latest values so createOrder never uses stale closure data,
  // even when React.memo prevents a re-render.
  const cartItemsRef        = useRef(cartItems);
  const customerInfoRef     = useRef(customerInfo);
  const shippingInfoRef     = useRef(shippingInfo);
  const selectedShippingRef = useRef(selectedShipping);
  const shippingRatesRef    = useRef(shippingRates);
  const appliedCouponsRef   = useRef(appliedCoupons);
  const orderNotesRef       = useRef(orderNotes);
  const isShippingSelectedRef = useRef(isShippingSelected);

  useEffect(() => { cartItemsRef.current        = cartItems;        }, [cartItems]);
  useEffect(() => { customerInfoRef.current     = customerInfo;     }, [customerInfo]);
  useEffect(() => { shippingInfoRef.current     = shippingInfo;     }, [shippingInfo]);
  useEffect(() => { selectedShippingRef.current = selectedShipping; }, [selectedShipping]);
  useEffect(() => { shippingRatesRef.current    = shippingRates;    }, [shippingRates]);
  useEffect(() => { appliedCouponsRef.current   = appliedCoupons;   }, [appliedCoupons]);
  useEffect(() => { orderNotesRef.current       = orderNotes;       }, [orderNotes]);
  useEffect(() => { isShippingSelectedRef.current = isShippingSelected; }, [isShippingSelected]);

  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  // Stable callback — never recreated, always reads latest values from refs.
  // No forceReRender needed: PayPal button never remounts when props change.
  const createOrder = useCallback(async () => {
    if (!isShippingSelectedRef.current) {
      toast.error("Please select a shipping method first.");
      throw new Error("Shipping not selected");
    }

    toast.loading("Initializing secure payment...", { id: 'paypal-init' });

    try {
      const affiliateMetaData: { key: string; value: string }[] = [];
      const utmData = getStoredUTM();

      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems:       cartItemsRef.current,
          customerInfo:    customerInfoRef.current,
          shippingInfo:    shippingInfoRef.current || customerInfoRef.current,
          selectedShipping: selectedShippingRef.current,
          shippingRates:   shippingRatesRef.current,
          appliedCoupons:  appliedCouponsRef.current,
          orderNotes:      orderNotesRef.current,
          affiliateMetaData,
          utmSource:       utmData.utmSource,
          utmMedium:       utmData.utmMedium,
          utmCampaign:     utmData.utmCampaign,
          referringSite:   utmData.referringSite,
        }),
      });

      const data = await res.json();
      toast.dismiss('paypal-init');

      if (!res.ok) throw new Error(data.error || 'Failed to create PayPal order.');

      wcOrderIdRef.current  = data.wcOrderId;
      wcOrderKeyRef.current = data.wcOrderKey;

      return data.id; // PayPal order ID
    } catch (err: unknown) {
      toast.dismiss('paypal-init');
      const msg = err instanceof Error ? err.message : 'Failed to start payment.';
      toast.error(msg);
      throw err;
    }
  }, []); // empty deps — stable forever, reads latest from refs at click time

  const onApprove = useCallback(async (data: { orderID: string }) => {
    toast.loading('Verifying payment...', { id: 'paypal-capture' });
    try {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          wcOrderId:     wcOrderIdRef.current,
        }),
      });

      const captureData = await res.json();
      toast.dismiss('paypal-capture');

      if (captureData.success) {
        toast.success('Payment successful!');
        await clearCart();
        router.push(`/order-success?order_id=${wcOrderIdRef.current}&key=${wcOrderKeyRef.current}`);
      } else {
        toast.error(captureData.message || 'Payment could not be verified automatically.');
      }
    } catch (err) {
      toast.dismiss('paypal-capture');
      toast.error('Network error during verification.');
      console.error('Capture Catch Error:', err);
    }
  }, [clearCart, router]);

  if (isPending || !isResolved) return <div className="w-full min-h-[100px]" />;

  if (isRejected) {
    return (
      <div className="w-full py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 text-center space-y-2">
        <p>PayPal could not load. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block bg-yellow-700 text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-yellow-800 transition-colors"
        >
          Refresh &amp; Retry
        </button>
      </div>
    );
  }

  if (
    typeof window !== 'undefined' &&
    !(window as { paypal?: { Buttons?: unknown } }).paypal?.Buttons
  ) {
    return (
      <div className="w-full py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 text-center space-y-2">
        <p>PayPal could not load. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block bg-yellow-700 text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-yellow-800 transition-colors"
        >
          Refresh &amp; Retry
        </button>
      </div>
    );
  }

  return (
    <PayPalButtonErrorBoundary>
      <PayPalButtons
        style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
        disabled={isPlacingOrder || total <= 0 || !isShippingSelected}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={() => { toast.error('You cancelled the payment.'); }}
        onError={(err) => {
          toast.dismiss();
          console.error('PayPal transaction failed:', err);
          // Safari ITP blocks third-party cookies used by PayPal popup.
          // Detect Safari and give actionable guidance instead of generic error.
          const isSafari = typeof navigator !== 'undefined' &&
            /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const msg = isSafari
            ? 'PayPal failed to load in Safari. Please enable "Allow Cross-Website Tracking" in Safari → Settings → Privacy, or use Chrome/Firefox.'
            : 'A PayPal error occurred. Please try again or use a card payment.';
          toast.error(msg, { duration: 8000 });
        }}
      />
    </PayPalButtonErrorBoundary>
  );
};

// Re-renders only when UI-visible props change (disabled state needs total/shipping/placing).
// cartItems, coupons, shipping changes are handled via refs — no re-render, no button flicker.
const PayPalPaymentGateway = React.memo(PayPalPaymentGatewayComponent, (prevProps, nextProps) => {
  return (
    prevProps.total             === nextProps.total &&
    prevProps.isShippingSelected === nextProps.isShippingSelected &&
    prevProps.isPlacingOrder    === nextProps.isPlacingOrder
  );
});

export default PayPalPaymentGateway;
