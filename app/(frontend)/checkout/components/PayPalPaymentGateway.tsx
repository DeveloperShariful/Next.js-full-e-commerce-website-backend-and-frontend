// app/(frontend)/checkout/components/PayPalPaymentGateway.tsx

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';

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

  const [canRender, setCanRender] = useState(false);

  console.log("%c🔍 [PayPal Gateway Debug] Gateway Component Rendered.", "color: #ff0099; font-weight: bold;");

  useEffect(() => {
    console.log("🔍 [PayPal Gateway Debug] Mounting Interval Checker...");

    // 🛡️ Direct window monitoring logs with strict TypeScript safe check
    const interval = setInterval(() => {
      const paypalExists = typeof window !== 'undefined' && window.paypal !== undefined && window.paypal !== null;
      const buttonsExists = typeof window !== 'undefined' && !!window.paypal?.Buttons; // 👈 FIXED: Optional chaining (?.) solves the TS error!

      console.log(`🔍 [PayPal Polling] window.paypal exists: ${paypalExists} | window.paypal.Buttons exists: ${buttonsExists}`);

      if (paypalExists && buttonsExists) {
        console.log("%c🔍 [PayPal Gateway Debug] SUCCESS! window.paypal.Buttons found on Window object!", "color: #00ff00; font-weight: bold;");
        setCanRender(true);
        clearInterval(interval);
      }
    }, 100);
    return () => {
      console.log("🔍 [PayPal Gateway Debug] Cleaning up Interval Checker...");
      clearInterval(interval);
    };
  }, []);

  if (!canRender) {
    console.log("%c🔍 [PayPal Gateway Debug] render BLOCKED. Script is still downloading. Showing Skeleton...", "color: #ff3300;");
    return <div className="w-full h-12 bg-gray-200 animate-pulse rounded-md flex justify-center items-center text-xs text-gray-500">Connecting to PayPal API...</div>;
  }

  console.log("%c🎉 [PayPal Gateway Debug] render ALLOWED! Rendering PayPalButtons now!", "color: #00ff00; font-weight: bold;");

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
                  toast.error(captureData.message || "Payment could not be verified automatically.");
              }
          } catch (err) {
              toast.dismiss('paypal-capture');
              toast.error("Network error during verification.");
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