// File: app/(storefront)/checkout/_components/PaypalPaymentGateway.tsx

'use client';

import React, { useEffect, useRef } from 'react'; // useState সরিয়ে দিয়েছি কারণ এটার দরকার নেই
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
  customerNote?: string;
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
    couponCode,
    customerNote
}: PayPalGatewayProps) {
  
  const [{ isPending }] = usePayPalScriptReducer();

  // ✅ Refs to hold latest data without causing re-renders
  // বাটন রেন্ডার হওয়ার পর প্রপস চেঞ্জ হলে বাটন রিফ্রেশ না করে আমরা Ref আপডেট করব
  const propsRef = useRef({
      total,
      shippingInfo,
      customerInfo,
      selectedShippingId,
      couponCode,
      customerNote,
      isShippingSelected
  });

  // যখনই প্রপস চেঞ্জ হবে, Ref আপডেট হবে (কিন্তু রি-রেন্ডার হবে না)
  useEffect(() => {
      propsRef.current = {
          total,
          shippingInfo,
          customerInfo,
          selectedShippingId,
          couponCode,
          customerNote,
          isShippingSelected
      };
  }, [total, shippingInfo, customerInfo, selectedShippingId, couponCode, customerNote, isShippingSelected]);

  if (isPending) return <div className="h-12 w-full bg-gray-100 animate-pulse rounded"></div>;

  return (
      <div className="w-full relative z-0">
        <PayPalButtons
            style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
            disabled={isPlacingOrder} // isShippingSelected এখানে বাদ দিলাম, validaion ভেতরে করব
            
            // ❌ forceReRender একদম বাদ দিয়েছি। এটাই স্লো হওয়ার কারণ ছিল।
            
            createOrder={async (data, actions) => {
                // ✅ Ref থেকে লেটেস্ট ডাটা নেওয়া হচ্ছে
                const currentProps = propsRef.current; 

                try {
                    if (!currentProps.isShippingSelected) {
                        toast.error("Please select a shipping method first.");
                        throw new Error("Shipping method not selected");
                    }

                    const res = await createPayPalOrder({
                        cartId,
                        shippingMethodId: currentProps.selectedShippingId,
                        shippingAddress: currentProps.shippingInfo, // Latest Address from Ref
                        couponCode: currentProps.couponCode
                    });

                    const responseData = res as any; 
                    const orderID = responseData?.data?.orderID || responseData?.orderID;

                    if (!res.success || !orderID) {
                        throw new Error(res.error || "Could not init PayPal");
                    }
                    
                    return orderID;

                } catch (err: any) {
                    console.error("PayPal Init Error:", err);
                    // টোস্ট শুধু একবার দেখানোর জন্য চেক
                    if (err.message !== "Shipping method not selected") {
                         toast.error("Could not connect to PayPal");
                    }
                    throw err;
                }
            }}
            
            onApprove={async (data, actions) => {
                const currentProps = propsRef.current;
                try {
                    toast.loading("Processing Order...");

                    const res = await capturePayPalOrder({
                        payPalOrderId: data.orderID,
                        cartId,
                        shippingMethodId: currentProps.selectedShippingId,
                        shippingAddress: currentProps.shippingInfo, 
                        billingAddress: currentProps.customerInfo,
                        couponCode: currentProps.couponCode,
                        customerNote: currentProps.customerNote
                    });
                    
                    toast.dismiss();

                    const responseData = res as any;
                    const finalOrderId = responseData?.data?.orderId || responseData?.orderId;

                    if (res.success && finalOrderId) {
                        toast.success("Order Placed Successfully!");
                        onSuccess(finalOrderId);
                    } else {
                        throw new Error(res.error || "Order creation failed after payment");
                    }

                } catch (err: any) {
                    toast.dismiss();
                    console.error("Capture Error:", err);
                    toast.error(err.message || "Payment failed");
                }
            }}
            
            onError={(err) => { 
                console.error("PayPal Error:", err);
            }}
        />
      </div>
  );
}