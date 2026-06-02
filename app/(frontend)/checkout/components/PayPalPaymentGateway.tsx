// app/(frontend)/checkout/components/PayPalPaymentGateway.tsx

// app/(frontend)/checkout/components/PayPalPaymentGateway.tsx

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';

// ==========================================
// 1. STRICT INTERFACES
// ==========================================
export interface CartItemDTO { 
  id: string; 
  databaseId: number; 
  name: string; 
  quantity: number; 
  price: number; 
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
  onPlaceOrder: (paymentData?: { paymentMethodId: string }) => void;
  isShippingSelected: boolean;
  cartItems: CartItemDTO[];
  customerInfo: Partial<AddressDTO>;
  shippingInfo?: Partial<AddressDTO>;
  selectedShipping: string;
  shippingRates: ShippingRateDTO[];
  appliedCoupons: CouponDTO[];
}

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
const PayPalPaymentGatewayComponent = ({ 
    total, 
    isPlacingOrder, 
    isShippingSelected, 
    cartItems, 
    customerInfo, 
    shippingInfo, 
    selectedShipping, 
    shippingRates, 
    appliedCoupons 
}: PayPalGatewayProps) => {
  
  const wcOrderIdRef = useRef<string | null>(null);
  const wcOrderKeyRef = useRef<string | null>(null);

  // 🛡️ THE FIX: Wait for PayPal script to load completely
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // Check if script is loaded and the Buttons object is attached to the window
    if (isResolved && window.paypal && window.paypal.Buttons) {
      setCanRender(true);
    }
  }, [isResolved]);

  // If script failed to load (e.g. invalid client ID or network error)
  if (isRejected) {
    return <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">Failed to load PayPal. Please check your internet connection or API keys.</div>;
  }

  // Show a loading skeleton while PayPal script is downloading
  if (isPending || !canRender) {
    return <div className="w-full h-12 bg-gray-200 animate-pulse rounded-md"></div>;
  }

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
              const res = await fetch('/api/paypal/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      total, 
                      cartItems, 
                      customerInfo, 
                      shippingInfo, 
                      selectedShipping, 
                      shippingRates, 
                      appliedCoupons
                  })
              });
              
              const data = await res.json();
              toast.dismiss('paypal-init');

              if (!res.ok) throw new Error(data.error || "Failed to create order");
              
              wcOrderIdRef.current = data.wcOrderId;
              wcOrderKeyRef.current = data.wcOrderKey;
              
              return data.id; 
          } catch (err: unknown) {
              toast.dismiss('paypal-init');
              const msg = err instanceof Error ? err.message : "Failed to start payment.";
              toast.error(msg);
              throw err;
          }
        }}
        
        onApprove={async (data) => {
          toast.loading("Verifying payment...", { id: 'paypal-capture' });
          try {
              const res = await fetch('/api/paypal/capture-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      paypalOrderId: data.orderID,
                      wcOrderId: wcOrderIdRef.current
                  })
              });
              
              const captureData = await res.json();
              toast.dismiss('paypal-capture');

              if (captureData.success) {
                  toast.success('Payment successful!');
                  window.location.href = `/order-success?order_id=${wcOrderIdRef.current}&key=${wcOrderKeyRef.current}&clear_cart=true`;
              } else {
                  toast.error(captureData.message || "Payment could not be verified automatically. Check your email.");
              }
          } catch (err) {
              toast.dismiss('paypal-capture');
              toast.error("Network error during verification. We are checking the status.");
              console.error("Capture Catch Error:", err);
          }
        }}
        
        onCancel={() => {
            toast.error("You cancelled the payment.");
        }}

        onError={(err) => {
          toast.dismiss();
          console.error("PayPal transaction failed:", err);
          toast.error("A PayPal error occurred. Please try again.");
        }}
      />
  );
};

const PayPalPaymentGateway = React.memo(PayPalPaymentGatewayComponent, (prevProps, nextProps) => {
  return (
    prevProps.total === nextProps.total &&
    prevProps.isShippingSelected === nextProps.isShippingSelected
  );
});

export default PayPalPaymentGateway;