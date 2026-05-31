// File: app/(frontend)/checkout/_components/PaypalPaymentGateway.tsx

'use client';

import React, { useRef } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface PayPalGatewayProps {
  total: number;
  isPlacingOrder: boolean;
  // ✅ টাইপ আপডেট করা হয়েছে CheckoutClient এর সাথে মিলিয়ে
  onPlaceOrder: (paymentData?: any) => Promise<{ orderId: string; orderNumber: string } | null>;
  isShippingSelected: boolean;
  cartItems: any[];
  customerInfo: any;
  shippingInfo: any;
  selectedShipping: string;
  shippingRates: any[];
  appliedCoupons: any[];
}

const PayPalPaymentGatewayComponent = ({ 
    total, onPlaceOrder, isShippingSelected, cartItems, customerInfo, shippingInfo, selectedShipping, shippingRates, appliedCoupons 
}: PayPalGatewayProps) => {
  
  const router = useRouter();
  const localOrderIdRef = useRef<string | null>(null);
  const localOrderNumberRef = useRef<string | null>(null);

  return (
      <PayPalButtons
        style={{ layout: "vertical", color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
        disabled={total <= 0 || !isShippingSelected}
        forceReRender={[total]}
        
        // ১. পেমেন্ট পপআপ খোলার আগে লোকাল অর্ডার তৈরি
        createOrder={async () => {
          if (!isShippingSelected) {
            toast.error("Please select a shipping method first.");
            throw new Error("Shipping not selected");
          }
          
          const toastId = toast.loading("Connecting to PayPal...", { id: 'paypal-init' });
          
          try {
              // ক. প্রথমে আমাদের ডাটাবেজে পেন্ডিং অর্ডার তৈরি করি
              const orderDetails = await onPlaceOrder({ paymentMethodId: 'paypal' });

              if (!orderDetails) throw new Error("Failed to initialize store order.");
              
              // খ. আইডিগুলো রেফারেন্সে সেভ করে রাখছি পরবর্তী ধাপের জন্য
              localOrderIdRef.current = orderDetails.orderId;
              localOrderNumberRef.current = orderDetails.orderNumber;

              // গ. পেপ্যাল এপিআই কল করে PayPal Order ID আনা
              const res = await fetch('/api/paypal/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      orderId: orderDetails.orderId,
                      total, cartItems, customerInfo, shippingInfo, 
                      selectedShipping, appliedCoupons
                  })
              });
              
              const data = await res.json();
              toast.dismiss(toastId);

              if (!res.ok) throw new Error(data.error || "Failed to create PayPal session");
              
              return data.id; // এটি PayPal সার্ভার থেকে আসা পেমেন্ট আইডি
          } catch (err: any) {
              toast.dismiss('paypal-init');
              toast.error(err.message || "Could not start PayPal payment.");
              throw err;
          }
        }}
        
        // ২. কাস্টমার পেমেন্ট কনফার্ম করলে টাকা রিসিভ এবং স্টক আপডেট
        onApprove={async (data) => {
          const toastId = toast.loading("Verifying your payment...", { id: 'paypal-capture' });
          try {
              const res = await fetch('/api/paypal/capture-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      paypalOrderId: data.orderID,
                      wcOrderId: localOrderIdRef.current // আমাদের ডাটাবেজ আইডি
                  })
              });
              
              const captureData = await res.json();
              toast.dismiss(toastId);

              if (captureData.success) {
                  toast.success('Payment Successful! Thank you.');
                  // সাকসেস পেজে রিডাইরেক্ট
                  router.push(`/order-success?order_id=${localOrderIdRef.current}`);
              } else {
                  toast.error(captureData.message || "Payment could not be verified automatically.");
              }
          } catch (err) {
              toast.dismiss('paypal-capture');
              toast.error("Network error during verification. We are checking the status.");
          }
        }}
        
        onCancel={() => {
            toast.error("PayPal checkout was canceled.");
        }}

        onError={(err) => {
          toast.dismiss();
          console.error("PayPal system failure:", err);
          toast.error("A technical error occurred with PayPal. Please try again.");
        }}
      />
  );
};

// পারফরম্যান্স অপ্টিমাইজেশন
const PayPalPaymentGateway = React.memo(PayPalPaymentGatewayComponent, (prevProps, nextProps) => {
  return (
    prevProps.total === nextProps.total &&
    prevProps.isShippingSelected === nextProps.isShippingSelected &&
    prevProps.isPlacingOrder === nextProps.isPlacingOrder
  );
});

export default PayPalPaymentGateway;