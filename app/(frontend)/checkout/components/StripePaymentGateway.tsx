// app/(frontend)/checkout/components/StripePaymentGateway.tsx

import React, { useState, forwardRef, useEffect } from 'react';
import Image from 'next/image';
import { loadStripe, PaymentMethodCreateParams } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';

// ★★★ PRO TRICK: Missing Stripe definition added securely without 'any' ★★★
declare module '@stripe/stripe-js' {
  interface Stripe {
    confirmZipPayment(
      clientSecret: string,
      options?: {
        payment_method?: {
          billing_details?: PaymentMethodCreateParams.BillingDetails & {
            address: PaymentMethodCreateParams.BillingDetails.Address & { country: string };
          };
        };
        return_url?: string;
      }
    ): Promise<{ paymentIntent?: unknown; error?: { message: string } }>;
  }
}

// ==========================================
// 1. STRICT INTERFACES
// ==========================================
export interface AddressDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  postcode: string;
}

export interface CartItemDTO {
  id: string;
  databaseId?: number;
  name: string;
  quantity: number;
  price?: string | number;
  variationId?: string;
}

export interface ShippingRateDTO {
  id: string;
  label: string;
  cost: number;
}

export interface CouponDTO {
  code: string;
  amount: number;
}

interface StripePaymentGatewayProps {
  publicKey: string; // 🛡️ Passed from Parent (Database driven)
  selectedPaymentMethod: string;
  onPlaceOrder: (paymentData?: { 
    transaction_id?: string;
    shippingAddress?: Partial<AddressDTO>; 
    redirect_needed?: boolean;
    paymentMethodId?: string;
    is_embedded_redirect?: boolean;
  }) => Promise<{ orderId: string; orderKey: string } | void | null>;
  customerInfo: Partial<AddressDTO>;
  total: number;
  cartItems: CartItemDTO[];
  shippingInfo?: Partial<AddressDTO>;
  selectedShipping: string;
  shippingRates: ShippingRateDTO[];
  appliedCoupons: CouponDTO[];
}

// ==========================================
// 2. STRIPE FORM COMPONENT
// ==========================================
const StripeForm = forwardRef<HTMLFormElement, StripePaymentGatewayProps & { clientSecret?: string }>(
  ({ selectedPaymentMethod, onPlaceOrder, customerInfo, shippingInfo, cartItems, total, clientSecret, selectedShipping, shippingRates, appliedCoupons }, ref) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [internalStripeMethod, setInternalStripeMethod] = useState<string>('card');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isProcessing || !stripe || !elements) return;
    
      setIsProcessing(true);
      toast.loading('Processing secure payment...', { id: 'stripe-payment' });

      // 🛡️ 100% STRICT TYPE MATCHING FOR STRIPE BNPL (Klarna, Afterpay, Zip)
      // Stripe requires an intersection type where 'country' is strictly a string.
      const bnplBillingDetails: PaymentMethodCreateParams.BillingDetails & {
        address: PaymentMethodCreateParams.BillingDetails.Address & { country: string };
      } = {
          name: (customerInfo.firstName || customerInfo.lastName) 
                ? `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() 
                : undefined,
          email: customerInfo.email || undefined,
          phone: customerInfo.phone || undefined,
          address: {
            line1: customerInfo.address1 || undefined,
            city: customerInfo.city || undefined,
            state: customerInfo.state || undefined,
            postal_code: customerInfo.postcode || undefined,
            country: 'AU', // 👈 Strict string requirement fulfilled
          }
      };

      const selectedRate = shippingRates.find(rate => rate.id === selectedShipping);
      const shippingMetadata = {
          shipping_method_id: selectedShipping || '',
          shipping_method_title: selectedRate?.label || 'Standard Shipping',
          shipping_cost: String(selectedRate?.cost || '0')
      };

      const isStandaloneRedirect = selectedPaymentMethod === 'stripe_klarna' || selectedPaymentMethod === 'stripe_afterpay_clearpay' || selectedPaymentMethod === 'stripe_zip';
      const isRedirectFromElement = selectedPaymentMethod === 'stripe' && (internalStripeMethod === 'klarna' || internalStripeMethod === 'afterpay_clearpay' || internalStripeMethod === 'zip');
      const isRedirectFlow = isStandaloneRedirect || isRedirectFromElement;

      try {
          const resolvedPaymentMethodId = isStandaloneRedirect 
              ? selectedPaymentMethod 
              : (selectedPaymentMethod === 'stripe' && internalStripeMethod === 'zip') 
                  ? 'stripe_zip' 
                  : selectedPaymentMethod;

          const orderDetails = await onPlaceOrder({ 
              redirect_needed: isRedirectFlow,
              is_embedded_redirect: isRedirectFromElement,
              paymentMethodId: resolvedPaymentMethodId
          });

          if (!orderDetails || !orderDetails.orderId || !orderDetails.orderKey) {
              throw new Error("Could not create a pending order. Please try again.");
          }

          if (isRedirectFlow) {
              const paymentMethodType = isStandaloneRedirect ? selectedPaymentMethod.replace('stripe_', '') : internalStripeMethod;
              
              const res = await fetch('/api/stripe/create-payment-intent', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      amount: Math.round(total * 100),
                      payment_method_types: [paymentMethodType],
                      metadata: { order_id: orderDetails.orderId, ...shippingMetadata },
                      orderId: orderDetails.orderId,
                      customerInfo, 
                      shippingInfo, 
                      cartItems,
                      appliedCoupons
                  }),
              });
              
              const { clientSecret: redirectClientSecret, error: piError } = await res.json();
              if (piError) throw new Error(piError.message || "Could not create payment intent.");

              const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;
              let confirmationResult;

              // 🛡️ Passing the strictly typed bnplBillingDetails. No 'any' needed!
              if (paymentMethodType === 'klarna') {
                  confirmationResult = await stripe.confirmKlarnaPayment(redirectClientSecret, {
                      payment_method: { billing_details: bnplBillingDetails },
                      return_url: returnUrl,
                  });
              } else if (paymentMethodType === 'afterpay_clearpay') {
                  confirmationResult = await stripe.confirmAfterpayClearpayPayment(redirectClientSecret, {
                      payment_method: { billing_details: bnplBillingDetails },
                      return_url: returnUrl,
                  });
              } else if (paymentMethodType === 'zip') {
                  confirmationResult = await stripe.confirmZipPayment(redirectClientSecret, {
                      payment_method: { billing_details: bnplBillingDetails },
                      return_url: returnUrl,
                  });
              }
              
              if (confirmationResult?.error) {
                  throw new Error(confirmationResult.error.message);
              }
          } 
          
          else if (selectedPaymentMethod === 'stripe') {
              if (!clientSecret) throw new Error("Could not initialize payment. Please try again.");

              const { error: submitError } = await elements.submit();
              if (submitError) throw new Error(submitError.message || "Please check your payment details.");

              const paymentIntentId = clientSecret.split('_secret_')[0];
              await fetch('/api/stripe/update-payment-intent', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      paymentIntentId,
                      amount: total,
                      orderId: orderDetails.orderId,
                      customerInfo, 
                      shippingInfo: shippingInfo || customerInfo, 
                      cartItems, 
                      metadata: shippingMetadata,
                      appliedCoupons
                  }),
              });

              const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;

              const { error } = await stripe.confirmPayment({
                  elements,
                  clientSecret,
                  confirmParams: { return_url: returnUrl },
              });

              if (error) throw new Error(error.message || "Payment failed or was declined.");
          } else {
              throw new Error("This payment method is not configured correctly.");
          }

      } catch (error: unknown) {
          toast.dismiss('stripe-payment');
          const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred during checkout.";
          toast.error(errorMessage);
          setIsProcessing(false);
      }
    };

    const renderPaymentUI = () => {
      if (selectedPaymentMethod === 'stripe') {
        return (
          <div className="p-3 border border-[#ccc] rounded-[5px] bg-white">
            <PaymentElement onChange={(e) => setInternalStripeMethod(e.value.type)} />
          </div>
        );
      }
      
      if (selectedPaymentMethod === 'stripe_klarna') {
        const installment = (total / 4).toFixed(2);
        return (
          <div className="flex items-center gap-[15px] p-[15px] border border-[#e0e0e0] rounded-[5px] bg-[#f9f9f9]">
            <Image src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" alt="Klarna" width={40} height={20} />
             <div className="flex flex-col gap-[5px] text-sm text-[#333]">
               <span>Pay now, or in 4 interest-free payments of <strong>A${installment}</strong>. <a href="https://www.klarna.com/au/payments/pay-in-4/" target="_blank" rel="noopener noreferrer" className="underline text-[#007bff]">Learn more</a></span>
               <small className="text-xs text-[#777]">After submission, you will be redirected to securely complete next steps.</small>
             </div>
          </div>
        );
      }
  
      if (selectedPaymentMethod === 'stripe_afterpay_clearpay') {
        const installment = (total).toFixed(2);
        return (
          <div className="flex items-center gap-[15px] p-[15px] border border-[#e0e0e0] rounded-[5px] bg-[#f9f9f9]">
            <Image src="https://static.afterpay.com/integration/logo-afterpay-colour.svg" alt="Afterpay" width={60} height={20} unoptimized/>
            <div className="flex flex-col gap-[5px] text-sm text-[#333]">
              <span>Pay <strong>A${installment}</strong>. You can pay up to 2000 AUD. After submission, you will be redirected to securely complete next steps.</span>
            </div>
          </div>
        );
      }

      if (selectedPaymentMethod === 'stripe_zip') {
        return (
          <div className="flex items-center gap-[15px] p-[15px] border border-[#e0e0e0] rounded-[5px] bg-[#f9f9f9]">
            <Image src="https://gobikes.au/wp-content/uploads/2026/05/Zip-Pay-Logo.webp" alt="Zip Pay" width={60} height={20} unoptimized/>
            <div className="flex flex-col gap-[5px] text-sm text-[#333]">
              <span>Own it now, pay later with <strong>Zip Pay</strong>.</span>
              <small className="text-xs text-[#777]">After submission, you will be redirected to securely complete next steps.</small>
            </div>
          </div>
        );
      }

      return null;
    };

    return <form ref={ref} onSubmit={handleSubmit}>{renderPaymentUI()}</form>;
  }
);
StripeForm.displayName = 'StripeForm';

// ==========================================
// 3. MAIN GATEWAY COMPONENT
// ==========================================
const StripePaymentGateway = forwardRef<HTMLFormElement, StripePaymentGatewayProps>((props, ref) => {
    // 🛡️ DYNAMIC PUBLISHABLE KEY PASSED FROM PARENT DB
    const [stripePromise] = useState(() => 
        props.publicKey ? loadStripe(props.publicKey) : null
    );
    const [clientSecret, setClientSecret] = useState<string>('');
    
    const couponsDependency = JSON.stringify(props.appliedCoupons || []);

    useEffect(() => {
        if (props.selectedPaymentMethod === 'stripe' && props.total > 0) {
            if (clientSecret) return;
            fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: Math.round(props.total * 100),
                    appliedCoupons: props.appliedCoupons
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else if (data.error) {
                    toast.error(data.error.message || 'Could not initialize payment options.');
                }
            });
        }
    }, [props.total, props.selectedPaymentMethod, clientSecret, couponsDependency]);

    if (!stripePromise) {
        return <div className="p-5 text-center text-[#555] bg-[#f9f9f9] rounded-lg">Loading Stripe...</div>;
    }

    if (props.selectedPaymentMethod === 'stripe') {
        if (!clientSecret) {
            return <div className="p-5 text-center text-[#555] bg-[#f9f9f9] rounded-lg">Initializing Payment Options...</div>;
        }
        return (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <StripeForm ref={ref} {...props} clientSecret={clientSecret} />
            </Elements>
        );
    }
    
    return (
        <Elements stripe={stripePromise}>
            <StripeForm ref={ref} {...props} />
        </Elements>
    );
});
StripePaymentGateway.displayName = 'StripeGateway';

export default StripePaymentGateway;