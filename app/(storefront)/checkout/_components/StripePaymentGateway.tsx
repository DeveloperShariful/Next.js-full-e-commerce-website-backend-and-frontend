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
      
      // 1. Validate Payment Element inputs first
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Please check your payment details.");
        setIsProcessing(false);
        return;
      }
      
      toast.loading('Creating order...');

      try {
        // 2. Create Order in Database (PENDING state)
        // This validates stock and creates the order ID we need for the return_url
        const orderDetails = await onPlaceOrder({ 
            paymentMethodId: selectedPaymentMethod 
        });

        if (!orderDetails || !orderDetails.orderId) {
            throw new Error("Failed to create order.");
        }
        
        // 3. Confirm Payment with Stripe
        // Now passing the return_url with the order_id parameter
        const { error } = await stripe.confirmPayment({
          elements,
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
                        country: 'AU', // You might want to make this dynamic if shipping globally
                    }
                }
            }
          },
        });

        // 4. Handle Immediate Error
        if (error) {
          toast.dismiss();
          // If payment fails (e.g. declined), the order remains PENDING in DB.
          // You might want to auto-cancel it or let the user retry.
          toast.error(error.message || "Payment failed.");
        }
        
        // Note: If successful, Stripe redirects the page, so code below here won't run.
      } catch (err: any) {
        toast.dismiss();
        toast.error(err.message || "An unexpected error occurred.");
      } finally {
        setIsProcessing(false);
      }
    };

    const renderPaymentUI = () => {
      const paymentElementOptions = { layout: 'tabs' as const };

      if (selectedPaymentMethod === 'stripe_card') {
        return <PaymentElement options={paymentElementOptions} />;
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
            <PaymentElement options={paymentElementOptions} />
          </div>
        );
      }
  
      if (selectedPaymentMethod.includes('afterpay') || selectedPaymentMethod.includes('zip')) {
        const isZip = selectedPaymentMethod.includes('zip');
        const installment = (total / 4).toFixed(2);
        const logo = isZip 
            ? "https://static.zipmoney.com.au/assets/default/footer-logo/zip-logo-black.svg" // Zip Logo
            : "https://static.afterpay.com/integration/logo-afterpay-colour.svg"; // Afterpay Logo

        return (
          <div className="space-y-4">
            <div className={`flex items-center gap-4 p-4 border rounded-lg ${isZip ? 'border-purple-100 bg-purple-50/50' : 'border-green-100 bg-green-50/50'}`}>
               <Image src={logo} alt={isZip ? "Zip" : "Afterpay"} width={60} height={20} unoptimized/>
               <div className="text-sm text-gray-700">
                   {isZip ? "Own it now, pay later." : `Pay 4 installments of $${installment}.`}
               </div>
            </div>
             <PaymentElement options={paymentElementOptions} />
          </div>
        );
      }

      // Default fallback
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