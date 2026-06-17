// app/(frontend)/checkout/components/PayPalPaymentGateway.tsx

'use client';

import React, { useRef } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useCart } from '@/context/CartContext';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

// ============================================================
// ROOT CAUSE OF BUG (FIXED):
// ============================================================
// আগের code: setInterval দিয়ে window.paypal.Buttons poll করত।
// প্রথম load-এ PayPal SDK download হতে সময় লাগে (500-2000ms),
// তাই polling শুরু হত কিন্তু SDK ready থাকত না → "Connecting..." দেখাত।
// Reload-এ browser cache থেকে SDK instant load → buttons দেখাত।
//
// FIX: usePayPalScriptReducer hook use করছি।
// এটা React context থেকে সরাসরি PayPal SDK loading state দেয়।
// isPending=true → SDK loading, isResolved=true → SDK ready, কোনো polling নেই।
// ============================================================

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

  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="w-full h-12 bg-gray-200 animate-pulse rounded-md flex justify-center items-center text-xs text-gray-500">
        Connecting to PayPal API...
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="w-full h-12 bg-red-50 border border-red-200 rounded-md flex justify-center items-center text-xs text-red-600">
        PayPal failed to load. Please refresh the page.
      </div>
    );
  }

  if (!isResolved) return null;

  return (
    <PayPalButtons
      style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
      disabled={isPlacingOrder || total <= 0 || !isShippingSelected}
      forceReRender={[total]}

      createOrder={async () => {
        if (!isShippingSelected) {
          toast.error("Please select a shipping method first.");
          throw new Error("Shipping not selected");
        }

        toast.loading("Initializing secure payment...", { id: 'paypal-init' });

        try {
          // Affiliate tracking from cookies
          const affiliateId = Cookies.get('solid_affiliate_id');
          const visitId = Cookies.get('solid_affiliate_visit_id');
          const affiliateMetaData: { key: string; value: string }[] = [];
          if (affiliateId) affiliateMetaData.push({ key: 'solid_affiliate_id', value: affiliateId });
          if (visitId) affiliateMetaData.push({ key: 'solid_affiliate_visit_id', value: visitId });

          // Single request: creates DB order + PayPal order in one step.
          // No stripe/create-order call needed for PayPal.
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartItems,
              customerInfo,
              shippingInfo: shippingInfo || customerInfo,
              selectedShipping,
              shippingRates,
              appliedCoupons,
              orderNotes,
              affiliateMetaData,
            }),
          });

          const data = await res.json();
          toast.dismiss('paypal-init');

          if (!res.ok) throw new Error(data.error || 'Failed to create PayPal order.');

          wcOrderIdRef.current = data.wcOrderId;
          wcOrderKeyRef.current = data.wcOrderKey;

          return data.id; // PayPal order ID
        } catch (err: unknown) {
          toast.dismiss('paypal-init');
          const msg = err instanceof Error ? err.message : 'Failed to start payment.';
          toast.error(msg);
          throw err;
        }
      }}

      onApprove={async (data) => {
        toast.loading('Verifying payment...', { id: 'paypal-capture' });
        try {
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paypalOrderId: data.orderID,
              wcOrderId: wcOrderIdRef.current,
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
      }}

      onCancel={() => {
        toast.error('You cancelled the payment.');
      }}

      onError={(err) => {
        toast.dismiss();
        console.error('PayPal transaction failed:', err);
        toast.error('A PayPal error occurred. Please try again.');
      }}
    />
  );
};

// ✅ React.memo — re-renders only when total, shippingSelected, or isPlacingOrder change
const PayPalPaymentGateway = React.memo(PayPalPaymentGatewayComponent, (prevProps, nextProps) => {
  return (
    prevProps.total === nextProps.total &&
    prevProps.isShippingSelected === nextProps.isShippingSelected &&
    prevProps.isPlacingOrder === nextProps.isPlacingOrder
  );
});

export default PayPalPaymentGateway;
