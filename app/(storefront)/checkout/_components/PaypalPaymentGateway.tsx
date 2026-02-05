//app/(storefront)/checkout/_components/PaypalPaymentGateway.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { createPayPalOrder , capturePayPalOrder} from '@/app/actions/storefront/checkout/paypal-payments';

interface PayPalGatewayProps {
  total: number;
  isPlacingOrder: boolean;
  onPlaceOrder: (paymentData: { transaction_id: string; paymentMethodId: string }) => Promise<any>;
  isShippingSelected: boolean;
  cartId: string;
  customerInfo: any;
  shippingInfo: any; // This holds the final shipping address passed from parent
  selectedShippingId: string;
  onSuccess: (orderId: string) => void;
}

export default function PayPalPaymentGateway({ 
    total, isPlacingOrder, onPlaceOrder, isShippingSelected,
    cartId, customerInfo, shippingInfo, selectedShippingId, onSuccess
}: PayPalGatewayProps) {
  
  const [{ isPending, isResolved, isRejected, options }] = usePayPalScriptReducer();
  const [isReady, setIsReady] = useState(false);

  // Script Load Status Check
  useEffect(() => {
    if (isResolved) {
        const hasWindowPayPal = typeof window !== 'undefined' && window.paypal;
        const hasButtons = hasWindowPayPal && window.paypal?.Buttons;
        
        if (hasButtons) {
            setIsReady(true);
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
            ⚠️ PayPal Script Failed to Load. Check Client ID.
        </div>
    );
  }

  // Not Ready UI
  if (!isReady) {
      return (
        <div className="w-full h-[48px] bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
            Initializing Payment...
        </div>
      );
  }

  return (
      <PayPalButtons
        style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
        disabled={isPlacingOrder || !isShippingSelected}
        forceReRender={[total, selectedShippingId]} // Re-render if total or shipping changes
        
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
             // 🔥 FIX: 3rd argument 'shippingInfo' passed here
             // This address is needed for Server-Side Shipping Validation
             const { orderID } = await createPayPalOrder(cartId, selectedShippingId, shippingInfo);
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
              const res = await capturePayPalOrder(
                  data.orderID, 
                  cartId, 
                  customerInfo, 
                  shippingInfo, 
                  selectedShippingId
              );

              if (res.success && res.orderId) {
                  toast.dismiss();
                  toast.success("Order placed successfully!");
                  onSuccess(res.orderId);
              } else {
                  throw new Error(res.error);
              }
           } catch (err: any) {
              toast.dismiss();
              toast.error(err.message || "Payment processing failed.");
           }
        }}
        
        onError={(err) => { 
            console.error("❌ PayPal Button Error:", err);
            toast.error("Payment could not be processed."); 
        }}
      />
  );
}