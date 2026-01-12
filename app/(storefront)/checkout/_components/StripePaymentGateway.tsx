//app/(storefront)/checkout/components/StripePaymentGateway.tsx

'use client';

import React, { useState, forwardRef } from 'react';
import Image from 'next/image';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

interface CustomerInfo { firstName?: string; lastName?: string; email?: string; phone?: string; address1?: string; city?: string; state?: string; postcode?: string; }

interface StripePaymentGatewayProps {
  selectedPaymentMethod: string;
  onPlaceOrder: (paymentData?: { 
    transaction_id?: string;
    paymentMethodId?: string;
  }) => Promise<{ orderId: string, orderKey: string } | void | null>;
  customerInfo: CustomerInfo;
  total: number;
}

const StripePaymentGateway = forwardRef<HTMLFormElement, StripePaymentGatewayProps>(
  ({ selectedPaymentMethod, onPlaceOrder, customerInfo, total }, ref) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!stripe || !elements || isProcessing) return;

      setIsProcessing(true);
      
      // 1. Validate Form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Please check your payment details.");
        setIsProcessing(false);
        return;
      }
      
      toast.loading('Creating order...');

      try {
        // 2. Create Order in DB
        const orderDetails = await onPlaceOrder({ 
            paymentMethodId: selectedPaymentMethod 
        });

        if (!orderDetails || !orderDetails.orderId) {
            throw new Error("Failed to create order.");
        }
        
        // 3. Confirm Payment with Stripe
        const { error } = await stripe.confirmPayment({
          elements,
          // FIX: 'clientSecret' removed. Elements will handle it automatically.
          
          confirmParams: {
            return_url: `${window.location.origin}/order-success?order_id=${orderDetails.orderId}`,
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

        if (error) {
          toast.dismiss();
          toast.error(error.message || "Payment failed.");
        }
        // Success automatically redirects to return_url
      } catch (err: any) {
        toast.dismiss();
        toast.error(err.message || "An unexpected error occurred.");
      } finally {
        setIsProcessing(false);
      }
    };

    const renderPaymentUI = () => {
      if (selectedPaymentMethod === 'stripe_card') {
        return <PaymentElement options={{ layout: 'tabs' }} />;
      }
      
      if (selectedPaymentMethod === 'stripe_klarna') {
        const installment = (total / 4).toFixed(2);
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border border-blue-100 rounded-lg bg-blue-50/50">
                <Image src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" alt="Klarna" width={40} height={20} />
                <div className="text-sm text-gray-700">
                    Pay 4 interest-free payments of <strong>${installment}</strong>.
                </div>
            </div>
            <PaymentElement options={{ layout: 'tabs' }} />
          </div>
        );
      }
  
      if (selectedPaymentMethod.includes('afterpay')) {
        const installment = (total / 4).toFixed(2);
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border border-green-100 rounded-lg bg-green-50/50">
               <Image src="https://static.afterpay.com/integration/logo-afterpay-colour.svg" alt="Afterpay" width={60} height={20} unoptimized/>
               <div className="text-sm text-gray-700">
                   Pay 4 installments of <strong>${installment}</strong>.
               </div>
            </div>
             <PaymentElement options={{ layout: 'tabs' }} />
          </div>
        );
      }
      return <PaymentElement />;
    };

    return (
        <form ref={ref} onSubmit={handleSubmit} className="w-full">
            {renderPaymentUI()}
        </form>
    );
  }
);

StripePaymentGateway.displayName = 'StripePaymentGateway';
export default StripePaymentGateway;