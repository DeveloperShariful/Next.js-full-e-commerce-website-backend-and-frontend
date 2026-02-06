//app/(storefront)/checkout/_components/PaypalPaymentGateway.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { createPayPalOrder, capturePayPalOrder } from '@/app/actions/storefront/checkout/paypal-payments';

interface PayPalGatewayProps {
  total: number;
  isPlacingOrder: boolean;
  onPlaceOrder: (paymentData: { transaction_id: string; paymentMethodId: string }) => Promise<any>;
  isShippingSelected: boolean;
  cartId: string;
  customerInfo: any;
  shippingInfo: any;
  selectedShippingId: string;
  onSuccess: (orderId: string) => void;
  couponCode?: string;
}

export default function PayPalPaymentGateway({ 
    total, 
    isPlacingOrder, 
    isShippingSelected,
    cartId, 
    customerInfo, 
    shippingInfo, 
    selectedShippingId, 
    onSuccess, 
    couponCode
}: PayPalGatewayProps) {
  
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();
  const [isReady, setIsReady] = useState(false);
  const dbOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isResolved && window.paypal) {
        setIsReady(true);
    }
  }, [isResolved]);

  if (isPending) return <div className="p-4 text-center text-sm text-gray-500 animate-pulse border rounded">Connecting to PayPal...</div>;
  if (isRejected) return <div className="p-4 text-center text-sm text-red-500 border border-red-200 rounded">Failed to load PayPal. Check connection.</div>;
  if (!isReady) return <div className="p-4 text-center text-sm text-gray-500 border rounded">Initializing Payment...</div>;

  return (
      <div className="w-full relative z-0">
        <PayPalButtons
            style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
            disabled={isPlacingOrder || !isShippingSelected}
            forceReRender={[total, selectedShippingId]} 
            
            createOrder={async (data, actions) => {
            // 1. Validation
            if (!isShippingSelected) {
                toast.error("Select shipping method");
                throw new Error("Shipping missing");
            }
            if (!cartId) {
                toast.error("Session expired. Refresh page.");
                throw new Error("Cart ID missing");
            }

            try {
                // 2. Call Server Action
                const res = await createPayPalOrder({
                    cartId,
                    shippingMethodId: selectedShippingId,
                    shippingAddress: shippingInfo, 
                    billingAddress: customerInfo,
                    couponCode: couponCode || undefined
                });

                // 3. Handle Failure
                if (!res.success || !res.data?.orderID) {
                    const msg = res.error || "Init Failed";
                    console.error("PayPal Server Error:", msg);
                    // Throwing error here stops the spinner
                    throw new Error(msg);
                }

                // 4. Success
                dbOrderIdRef.current = res.data.dbOrderId;
                return res.data.orderID; 

            } catch (err: any) {
                // Ensure the error message is visible to user
                const msg = err.message || "Unknown Error";
                toast.error(msg);
                throw err; // Rethrow to stop PayPal spinner
            }
            }}
            
            onApprove={async (data, actions) => {
            try {
                if (!dbOrderIdRef.current) throw new Error("Order Ref Lost");
                toast.loading("Verifying Payment...");

                const res = await capturePayPalOrder({
                    payPalOrderId: data.orderID,
                    dbOrderId: dbOrderIdRef.current
                });

                toast.dismiss();
                if (res.success && res.data?.orderId) {
                    toast.success("Payment Successful!");
                    onSuccess(res.data.orderId);
                } else {
                    throw new Error(res.error || "Capture Failed");
                }
            } catch (err: any) {
                toast.dismiss();
                console.error("Capture Error:", err);
                toast.error(err.message || "Payment Failed");
            }
            }}
            
            onError={(err) => { 
                console.error("PayPal SDK Error:", err);
                // toast.error("Pop-up closed or connection failed."); 
            }}
        />
      </div>
  );
}