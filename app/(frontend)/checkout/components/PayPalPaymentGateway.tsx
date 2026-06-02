// app/(frontend)/checkout/components/PayPalPaymentGateway.tsx

'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useCart } from '@/context/CartContext'; // 🛡️ Step 1: Imported useCart Context
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
  onPlaceOrder: (paymentData?: { paymentMethodId: string }) => Promise<{ orderId: string; orderKey: string } | void | null>;
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
    onPlaceOrder,
    isShippingSelected, 
    cartItems, 
    customerInfo, 
    shippingInfo, 
    selectedShipping, 
    shippingRates, 
    appliedCoupons 
}: PayPalGatewayProps) => {
  
  const router = useRouter();
  const { clearCart } = useCart(); // 🛡️ Step 2: Extract clearCart function
  const wcOrderIdRef = useRef<string | null>(null); 
  const wcOrderKeyRef = useRef<string | null>(null);

  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const paypalExists = typeof window !== 'undefined' && window.paypal !== undefined && window.paypal !== null;
      const buttonsExists = typeof window !== 'undefined' && !!window.paypal?.Buttons;

      if (paypalExists && buttonsExists) {
        setCanRender(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!canRender) {
    return <div className="w-full h-12 bg-gray-200 animate-pulse rounded-md flex justify-center items-center text-xs text-gray-500">Connecting to PayPal API...</div>;
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
              const orderDetails = await onPlaceOrder({ paymentMethodId: 'paypal' });

              if (!orderDetails) throw new Error("Failed to initialize store order.");
              
              wcOrderIdRef.current = orderDetails.orderId;
              wcOrderKeyRef.current = orderDetails.orderKey;

              const res = await fetch('/api/paypal/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      orderId: orderDetails.orderId,
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
                  
                  // 🛡️ Step 3: Clear the Cart dynamically before redirecting
                  if (typeof clearCart === 'function') {
                      await clearCart();
                  }

                  // Smooth Redirect to success page
                  router.push(`/order-success?order_id=${wcOrderIdRef.current}&key=${wcOrderKeyRef.current}`);
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