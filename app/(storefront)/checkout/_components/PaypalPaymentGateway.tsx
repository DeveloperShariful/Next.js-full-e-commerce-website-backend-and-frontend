//app/(storefront)/checkout/_components/PaypalPaymentGateway.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { createPayPalOrder } from '@/app/actions/storefront/checkout/paypal/create-order';
import { capturePayPalOrder } from '@/app/actions/storefront/checkout/paypal/capture-order';

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
}

export default function PayPalPaymentGateway({ 
    total, isPlacingOrder, onPlaceOrder, isShippingSelected,
    cartId, customerInfo, shippingInfo, selectedShippingId, onSuccess
}: PayPalGatewayProps) {
  
  const [{ isPending, isResolved, isRejected, options }] = usePayPalScriptReducer();
  const [isReady, setIsReady] = useState(false);

  // 🔍 DEBUG LOG 2: Script Status
  useEffect(() => {
    console.log("🔥 [PayPalGateway] Script Status:", { 
        isPending, 
        isResolved, 
        isRejected,
        clientIdUsed: options.clientId 
    });

    if (isResolved) {
        // উইন্ডো অবজেক্ট চেক করা
        const hasWindowPayPal = typeof window !== 'undefined' && window.paypal;
        const hasButtons = hasWindowPayPal && window.paypal?.Buttons;
        
        console.log("🔥 [PayPalGateway] Window Object Check:", { 
            hasWindowPayPal: !!hasWindowPayPal, 
            hasButtons: !!hasButtons 
        });

        if (hasButtons) {
            setIsReady(true);
        } else {
            console.error("❌ [PayPalGateway] Script loaded but window.paypal.Buttons missing!");
        }
    }
  }, [isPending, isResolved, isRejected, options]);

  // Loading UI
  if (isPending) {
    return (
        <div className="w-full h-[48px] bg-yellow-50 rounded flex items-center justify-center text-sm text-yellow-700 animate-pulse border border-yellow-200">
            Connecting to PayPal...
        </div>
    );
  }

  // Error UI
  if (isRejected) {
    return (
        <div className="w-full p-4 bg-red-50 text-red-600 text-sm border border-red-200 rounded">
            ⚠️ PayPal Script Failed to Load.<br/>
            Check if Client ID is correct in Admin Panel.
        </div>
    );
  }

  // Not Ready UI
  if (!isReady) {
      return (
        <div className="w-full h-[48px] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
            Initializing Secure Payment...
        </div>
      );
  }

  return (
      <PayPalButtons
        style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
        disabled={isPlacingOrder || !isShippingSelected}
        forceReRender={[total]}
        
        createOrder={async () => {
          if (!isShippingSelected) {
            toast.error("Please select a shipping method first.");
            throw new Error("Shipping missing");
          }
          if (!customerInfo.firstName || !customerInfo.email) {
             toast.error("Please fill in billing details.");
             throw new Error("Billing missing");
          }

          try {
             console.log("🚀 Calling Server Action: createPayPalOrder");
             const { orderID } = await createPayPalOrder(cartId, selectedShippingId);
             console.log("✅ Order ID Received:", orderID);
             return orderID;
          } catch (err) {
             console.error("❌ Create Order Failed:", err);
             toast.error("Could not initiate PayPal.");
             throw err;
          }
        }}
        
        onApprove={async (data) => {
           toast.loading("Processing order...");
           try {
              console.log("🚀 Calling Server Action: capturePayPalOrder", data.orderID);
              const res = await capturePayPalOrder(
                  data.orderID, 
                  cartId, 
                  customerInfo, 
                  shippingInfo, 
                  selectedShippingId
              );

              if (res.success && res.orderId) {
                  toast.success("Order placed successfully!");
                  onSuccess(res.orderId);
              } else {
                  throw new Error(res.error);
              }
           } catch (err: any) {
              toast.dismiss();
              toast.error(err.message || "Payment failed.");
           }
        }}
        
        onError={(err) => { 
            console.error("❌ PayPal Button Error:", err);
            toast.error("Payment could not be processed."); 
        }}
      />
  );
}