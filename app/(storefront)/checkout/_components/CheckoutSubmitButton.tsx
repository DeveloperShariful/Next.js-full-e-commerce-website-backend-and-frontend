// File: app/(storefront)/checkout/_components/CheckoutSubmitButton.tsx

'use client';

import React, { useState } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import PayPalPaymentGateway from './PaypalPaymentGateway';
import toast from 'react-hot-toast';
import { createPaymentIntent,  } from '@/app/actions/storefront/checkout/stripe-payment';
import { useRouter } from 'next/navigation';

interface Props {
    selectedMethod: any;
    onPlaceOrder: (data?: any) => Promise<any>;
    isProcessing: boolean;
    total: number;
    isShippingSelected: boolean;
    customerInfo: any;
    shippingInfo: any;
    cartId: string;
    selectedShippingId: string;
    couponCode?: string;
    paypalClientId: string;
    customerNote?: string;
}

export default function CheckoutSubmitButton({
    selectedMethod, onPlaceOrder, isProcessing, total, isShippingSelected, 
    customerInfo, shippingInfo, cartId, selectedShippingId, couponCode, paypalClientId, customerNote
}: Props) {
    
    const stripe = useStripe();
    const elements = useElements();
    const [stripeLoading, setStripeLoading] = useState(false);
    const router = useRouter();
    const handleStripeSubmit = async () => {
        if (!stripe || !elements) return;
        setStripeLoading(true);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) throw new Error(submitError.message);
            const orderRes = await onPlaceOrder({ paymentMethodId: selectedMethod.id });
            if (!orderRes?.orderId) throw new Error("Failed to create order");
            const intentRes = await createPaymentIntent({
                cartId,
                shippingMethodId: selectedShippingId,
                shippingAddress: shippingInfo,
                couponCode,
                metadata: { orderId: orderRes.orderId }
            });

            if (!intentRes.success || !intentRes.data?.clientSecret) throw new Error("Payment Init Failed");
            const result = await stripe.confirmPayment({
                elements,
                clientSecret: intentRes.data.clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/order-success?order_id=${orderRes.orderId}`,
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

            if (result.error) throw new Error(result.error.message);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Payment Failed");
        } finally {
            setStripeLoading(false);
        }
    };

    if (selectedMethod?.provider === 'paypal') {
        return (
            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "AUD", intent: "capture" }}>
                <PayPalPaymentGateway 
                    total={total}
                    isPlacingOrder={isProcessing}
                    onPlaceOrder={async (data) => {
                        return await onPlaceOrder({ 
                            transaction_id: data.transaction_id, 
                            paymentMethodId: selectedMethod.id 
                        });
                    }}
                    isShippingSelected={isShippingSelected}
                    cartId={cartId}
                    customerInfo={customerInfo}
                    shippingInfo={shippingInfo}
                    selectedShippingId={selectedShippingId}
                    onSuccess={(orderId) => router.push(`/order-success?order_id=${orderId}`)}
                    couponCode={couponCode}
                    customerNote={customerNote}
                />
            </PayPalScriptProvider>
        );
    }

    return (
        <button 
            onClick={selectedMethod?.provider === 'stripe' ? handleStripeSubmit : () => onPlaceOrder()}
            disabled={isProcessing || stripeLoading || !selectedMethod}
            className="w-full mt-6 bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99]"
        >
            {isProcessing || stripeLoading 
              ? 'Processing...' 
              : selectedMethod?.provider === 'stripe' 
                ? `Pay $${total.toFixed(2)}`
                : `Place Order $${total.toFixed(2)}`
            }
        </button>
    );
}