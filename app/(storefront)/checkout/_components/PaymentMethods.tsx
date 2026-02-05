//app/(storefront)/checkout/_components/PaymentMethods.tsx

'use client';

import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import PayPalPaymentGateway from './PaypalPaymentGateway'; 
import { createPaymentIntent } from '@/app/actions/storefront/checkout/stripe-payment';

interface PaymentMethodsProps {
  paymentOptions: any[];
  selectedPaymentMethod: string;
  onPaymentMethodChange: (methodId: string) => void;
  onPlaceOrder: (paymentData?: { transaction_id?: string; paymentMethodId?: string; shippingAddress?: any }) => Promise<any>;
  isPlacingOrder: boolean;
  total: number;
  isShippingSelected: boolean;
  customerInfo: any;
  paypalClientId: string;
  stripePublishableKey: string;
  cartId: string;
  shippingInfo: any;
  selectedShippingId: string;
  couponCode?: string; // ✅ Added couponCode support
}

export default function PaymentMethods({
  paymentOptions,
  selectedPaymentMethod,
  onPaymentMethodChange,
  onPlaceOrder,
  isPlacingOrder,
  total,
  isShippingSelected,
  customerInfo,
  cartId,
  shippingInfo,
  selectedShippingId,
  couponCode // ✅ Destructured
}: PaymentMethodsProps) {
  
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [stripeError, setStripeError] = useState<string | null>(null);

  // 💳 Handle Stripe Payment Logic
  const handleStripePayment = async () => {
    if (!stripe || !elements) return;

    // 1. Create Order in DB (Pending Status)
    const orderData = await onPlaceOrder({ paymentMethodId: selectedPaymentMethod });
    if (!orderData?.orderId) return;

    // 2. Create Payment Intent (Server Side)
    const { clientSecret, error } = await createPaymentIntent(
        cartId, 
        selectedShippingId, 
        shippingInfo, 
        couponCode // ✅ Pass coupon code to calculate correct total
    );

    if (error) {
        setStripeError(error);
        toast.error(error);
        return;
    }

    // 3. Confirm Payment with Stripe
    const result = await stripe.confirmPayment({
      elements,
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
      setStripeError(result.error.message || "Payment failed");
      toast.error(result.error.message || "Payment failed");
    }
  };

  // Find the currently selected method object
  const selectedMethod = paymentOptions.find(m => m.id === selectedPaymentMethod);

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Payment Method</h3>
      
      <div className="space-y-4">
        {paymentOptions.map((option) => (
          <div 
            key={option.id} 
            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPaymentMethod === option.id ? 'border-black bg-gray-50' : 'border-gray-200'}`} 
            onClick={() => onPaymentMethodChange(option.id)}
          >
            <div className="flex items-center gap-3">
              <input 
                type="radio" 
                name="payment_method" 
                checked={selectedPaymentMethod === option.id} 
                onChange={() => onPaymentMethodChange(option.id)}
                className="w-4 h-4 accent-black"
              />
              <span className="font-medium">{option.name}</span>
            </div>
            
            {/* Payment Details Section */}
            {selectedPaymentMethod === option.id && (
              <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                
                {/* 🟢 STRIPE ELEMENT */}
                {option.provider === 'stripe' && (
                    <div className="mb-4">
                        <PaymentElement />
                        {stripeError && <div className="text-red-500 text-sm mt-2">{stripeError}</div>}
                    </div>
                )}

                {/* 🔵 PAYPAL BUTTONS */}
                {option.provider === 'paypal' && (
                    <PayPalPaymentGateway 
                        total={total}
                        isPlacingOrder={isPlacingOrder}
                        onPlaceOrder={onPlaceOrder}
                        isShippingSelected={isShippingSelected}
                        cartId={cartId}
                        customerInfo={customerInfo}
                        shippingInfo={shippingInfo}
                        selectedShippingId={selectedShippingId}
                        onSuccess={(orderId) => router.push(`/order-success?order_id=${orderId}`)}
                       // couponCode={couponCode || null} // ✅ Correct Prop Passing (No 'paymentOptions' here)
                    />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Place Order Button (Only for Stripe & Offline) */}
      {/* PayPal has its own buttons, so we hide this main button when PayPal is selected */}
      {selectedMethod?.provider !== 'paypal' && (
          <button 
            onClick={selectedMethod?.provider === 'stripe' ? handleStripePayment : () => onPlaceOrder()}
            disabled={isPlacingOrder || !selectedPaymentMethod}
            className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPlacingOrder 
              ? 'Processing...' 
              : `Place Order ${total > 0 ? `($${total.toFixed(2)})` : ''}`
            }
          </button>
      )}
    </div>
  );
}