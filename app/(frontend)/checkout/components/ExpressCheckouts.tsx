// app/(frontend)/checkout/components/ExpressCheckouts.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// ==========================================
// 1. STRICT INTERFACES
// ==========================================
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

export interface CartItemDTO {
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price?: number | string;
  variationId?: string;
}

export interface CouponDTO {
  code: string;
  amount: number;
}

interface ExpressCheckoutsProps {
  publicKey: string; // 🛡️ NEW: Passed from Parent (Database driven)
  total: number;
  onOrderPlace: (paymentData: { 
    transaction_id?: string; 
    shippingAddress?: Partial<AddressDTO>;
    paymentMethodId?: string; 
  }) => Promise<{ orderId: string; orderKey: string } | void | null>; 
  isShippingSelected: boolean;
  cartItems: CartItemDTO[];
  customerInfo: Partial<AddressDTO>;
  selectedShipping: string;
  shippingRates: ShippingRateDTO[];
  appliedCoupons: CouponDTO[];
}

// ==========================================
// 2. INNER FORM COMPONENT
// ==========================================
const CheckoutForm = ({ onOrderPlace, clientSecret, cartItems, customerInfo, selectedShipping, shippingRates, appliedCoupons }: ExpressCheckoutsProps & { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const onConfirm = async () => {
    if (!stripe || !elements) {
      toast.error("Payment system has not loaded yet. Please try again.");
      return;
    }

    toast.loading('Processing express checkout...', { id: 'express-checkout' });

    try {
      const orderDetails = await onOrderPlace({ 
        paymentMethodId: 'stripe'
      });

      if (!orderDetails || !orderDetails.orderId || !orderDetails.orderKey) {
        throw new Error("Could not create an order. Please try again or use another payment method.");
      }

      const selectedRate = shippingRates.find(rate => rate.id === selectedShipping);
      const shippingMetadata = {
          shipping_method_id: selectedShipping || '',
          shipping_method_title: selectedRate?.label || 'Standard Shipping',
          shipping_cost: String(selectedRate?.cost || '0')
      };

      const paymentIntentId = clientSecret.split('_secret_')[0];
      
      await fetch('/api/stripe/update-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              paymentIntentId: paymentIntentId,
              orderId: orderDetails.orderId,
              customerInfo: customerInfo, 
              cartItems: cartItems, 
              metadata: shippingMetadata,
              appliedCoupons: appliedCoupons
          }),
      });

      const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed or was canceled.');
      }

    } catch (error: unknown) {
      toast.dismiss('express-checkout');
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(errorMessage);
    }
  };

  return <ExpressCheckoutElement onConfirm={onConfirm} />;
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
const ExpressCheckoutsComponent = (props: ExpressCheckoutsProps) => {
  const { total, selectedShipping, shippingRates, cartItems, customerInfo, appliedCoupons, isShippingSelected, publicKey } = props;
  
  // 🛡️ DYNAMIC STRIPE PROMISE (From DB Key)
  const [stripePromise] = useState(() => 
    publicKey ? loadStripe(publicKey) : null
  );

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [remountKey, setRemountKey] = useState(0);

  const selectedRate = shippingRates.find(rate => rate.id === selectedShipping);
  const couponsDependency = JSON.stringify(appliedCoupons || []);

  useEffect(() => {
    const managePaymentIntent = async () => {
      if (total <= 0) return;

      const metadataInfo = {
        shipping_method_id: selectedShipping || '',
        shipping_method_title: selectedRate?.label || 'Standard Shipping',
        shipping_cost: String(selectedRate?.cost || '0')
      };

      if (!paymentIntentId) {
        try {
          const res = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              amount: Math.round(total * 100), 
              cartItems,
              customerInfo,
              metadata: metadataInfo,
              appliedCoupons 
            }),
          });
          const data = await res.json();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.clientSecret.split('_secret_')[0]);
            setRemountKey(prevKey => prevKey + 1);
          }
        } catch (error) {
          console.error("Failed to create Express Payment Intent:", error);
        }
      } else {
        try {
          await fetch('/api/stripe/update-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              paymentIntentId, 
              amount: total, 
              cartItems,
              customerInfo,
              metadata: metadataInfo,
              appliedCoupons 
            }),
          });
          setRemountKey(prevKey => prevKey + 1);
        } catch (error) {
          console.error("Failed to update Express Payment Intent:", error);
        }
      }
    };

    managePaymentIntent();

  }, [total, paymentIntentId, selectedShipping, cartItems.length, couponsDependency]); 

  if (!clientSecret || !stripePromise) {
    return <div className="h-12 w-full bg-[#f0f0f0] rounded-lg animate-pulse"></div>;
  }

  const options = {
    clientSecret,
    paymentMethods: {
      googlePay: 'always',
      applePay: 'always',
    },
    layout: {
      wallets: { layout: 'grid' },
    },
  };

  return (
    <div className="w-full relative">
      {!isShippingSelected && (
        <div
          onClick={() => toast.error('Please select a shipping option first to use Express Checkout.')}
          className="absolute top-0 left-0 w-full h-full z-10 cursor-not-allowed"
        />
      )}
      <Elements key={remountKey} options={options as any} stripe={stripePromise}>
        <CheckoutForm {...props} clientSecret={clientSecret} />
      </Elements>
      <div className="text-center text-[#6b7280] font-medium text-sm mt-2.5">— OR —</div>
    </div>
  );
};

const ExpressCheckouts = React.memo(ExpressCheckoutsComponent, (prevProps, nextProps) => {
  return (
    prevProps.total === nextProps.total &&
    prevProps.selectedShipping === nextProps.selectedShipping &&
    prevProps.cartItems.length === nextProps.cartItems.length
  );
});

export default ExpressCheckouts;