//app/(storefront)/checkout/components/StripePaymentGateway.tsx

'use client';

import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { createPaymentIntent, } from '@/app/actions/storefront/checkout/stripe-payment';

interface StripePaymentGatewayProps {
  selectedPaymentMethod: string;
  onPlaceOrder: (paymentData?: { 
    transaction_id?: string;
    paymentMethodId?: string;
  }) => Promise<{ orderId: string, orderKey: string } | void | null>;
  cartId: string;
  customerInfo: any;
  shippingInfo: any;
  selectedShippingId: string;
  couponCode?: string;
  total: number;
}

export default function StripePaymentGateway({
  selectedPaymentMethod,
  onPlaceOrder,
  cartId,
  customerInfo,
  shippingInfo,
  selectedShippingId,
  couponCode,
  total
}: StripePaymentGatewayProps) {
  
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const orderData = await onPlaceOrder({ paymentMethodId: selectedPaymentMethod });
      
      if (!orderData?.orderId) {
        throw new Error("Failed to create order record. Please try again.");
      }

      const res = await createPaymentIntent({
        cartId,
        shippingMethodId: selectedShippingId,
        shippingAddress: shippingInfo,
        couponCode,
        metadata: { orderId: orderData.orderId } 
      });

      if (!res.success || !res.data?.clientSecret) {
        throw new Error(res.error || "Failed to initialize payment.");
      }

      const result = await stripe.confirmPayment({
        elements,
        clientSecret: res.data.clientSecret, // Override with the order-linked secret
        confirmParams: {
          return_url: `${window.location.origin}/order-success?order_id=${orderData.orderId}`,
          payment_method_data: {
            billing_details: {
              name: `${customerInfo.firstName} ${customerInfo.lastName}`,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: {
                line1: customerInfo.address1,
                city: customerInfo.city,
                state: customerInfo.state,
                postal_code: customerInfo.postcode,
                country: 'AU',
              }
            }
          }
        },
      });

      if (result.error) {

        throw new Error(result.error.message);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Payment failed");
      toast.error(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-4">
        <PaymentElement />
      </div>

      {errorMessage && <div className="text-red-500 text-sm mb-4">{errorMessage}</div>}

      <button 
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  );
}