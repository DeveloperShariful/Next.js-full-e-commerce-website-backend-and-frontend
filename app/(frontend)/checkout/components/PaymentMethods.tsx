// app/(frontend)/checkout/components/PaymentMethods.tsx

'use client';
import Image from 'next/image';
import React, { useRef, useState } from 'react';
import ExpressCheckouts from './ExpressCheckouts';
import PayPalPaymentGateway from './PayPalPaymentGateway';
import StripePaymentGateway from './StripePaymentGateway'; 
import PayPalMessage from './PayPalMessage';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js'; // Added for Redirect Flow

// ==========================================
// 1. STRICT INTERFACES
// ==========================================
export interface PaymentGateway { 
  id: string; 
  identifier: string; 
  provider: string;   
  title: string; 
  description: string | null; 
  isEnabled: boolean; 
  publicKey?: string | null;
  minOrderAmount?: number | null;
  maxOrderAmount?: number | null;
}

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

export interface CouponDTO { 
  code: string; 
  amount: number; 
}

interface PaymentMethodsProps {
  gateways: PaymentGateway[];
  selectedPaymentMethod: string; 
  onPaymentMethodChange: (identifier: string) => void;
  onPlaceOrder: (paymentData?: { 
    transaction_id?: string; 
    shippingAddress?: Partial<AddressDTO>; 
    redirect_needed?: boolean; 
    paymentMethodId?: string; 
  }) => Promise<{ orderId: string; orderKey: string } | void | null>; 
  isPlacingOrder: boolean;
  isShippingSelected: boolean;
  total: number;
  customerInfo: Partial<AddressDTO>;
  cartItems: any[];
  shippingInfo?: Partial<AddressDTO>;
  selectedShipping: string;
  shippingRates: ShippingRateDTO[];
  appliedCoupons: CouponDTO[];
}

export default function PaymentMethods(props: PaymentMethodsProps) {
  const { 
    gateways, selectedPaymentMethod, onPaymentMethodChange, total, onPlaceOrder, 
    isPlacingOrder, isShippingSelected, customerInfo, cartItems, shippingInfo, 
    selectedShipping, shippingRates, appliedCoupons 
  } = props;

  const stripeFormRef = useRef<HTMLFormElement>(null);
  const [isRedirecting, setIsRedirecting] = useState(false); // New state for BNPL loading

  const paypalGateway = gateways.find(g => g.identifier === 'paypal');
  const paypalClientId = paypalGateway?.publicKey || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";
  const mainStripeKey = gateways.find(g => g.identifier === 'stripe')?.publicKey || "";

  const initialOptions = {
    clientId: paypalClientId,
    currency: "AUD",
    intent: "capture",
    components: "buttons,googlepay",
  };

  const getGatewayIcon = (identifier: string): React.ReactNode => {
    if (identifier === 'paypal') return <Image src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" width={80} height={20} className="h-6 w-auto" unoptimized />;
    if (identifier === 'stripe_klarna') return <Image src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" alt="Klarna" width={50} height={20} className="h-6 w-auto" />;
    if (identifier === 'stripe_afterpay') return <Image src="https://static.afterpay.com/integration/logo-afterpay-colour.svg" alt="Afterpay" width={80} height={20} className="h-6 w-auto" unoptimized />;
    if (identifier === 'stripe_zip') return <Image src="https://gobikes.au/wp-content/uploads/2026/05/Zip-Pay-Logo.webp" alt="Zip Pay" width={50} height={20} className="h-6 w-auto" unoptimized />;
    if (identifier === 'stripe') return (<span className="flex items-center gap-1"><Image src="https://gobikes.au/wp-content/uploads/2026/05/Credit-Card-Icons.webp" alt="Visa/Mastercard" width={300} height={200} className="h-7 w-auto rounded-[5px] md:h-[28px]" style={{ width: 'auto' }} /></span>);
    return null;
  };

  // 🛡_ Handles normal Place Order, and BNPL Redirects
  const handlePlaceOrderClick = async () => {
    // 1. If it's pure Credit Card (stripe), let the nested component handle it
    if (selectedPaymentMethod === 'stripe' && stripeFormRef.current) {
      stripeFormRef.current.requestSubmit();
      return;
    } 
    
    // 2. If it's a BNPL (Klarna, Afterpay, Zip) - We handle the redirect flow here
    if (selectedPaymentMethod.startsWith('stripe_')) {
      setIsRedirecting(true);
      toast.loading('Preparing secure redirect...', { id: 'bnpl-redirect' });

      try {
        const orderDetails = await onPlaceOrder({ 
            redirect_needed: true,
            paymentMethodId: selectedPaymentMethod
        });

        if (!orderDetails || !orderDetails.orderId || !orderDetails.orderKey) {
            throw new Error("Could not create order. Please try again.");
        }

        // 🛡️ FIX: Map 'afterpay' to the official 'afterpay_clearpay' expected by Stripe
        let paymentMethodType = selectedPaymentMethod.replace('stripe_', ''); // 'klarna', 'afterpay', 'zip'
        if (paymentMethodType === 'afterpay') {
            paymentMethodType = 'afterpay_clearpay'; // 👈 Enforce official Stripe name
        }

        const selectedRate = shippingRates.find(rate => rate.id === selectedShipping);
        const shippingMetadata = {
            shipping_method_id: selectedShipping || '',
            shipping_method_title: selectedRate?.label || 'Standard Shipping',
            shipping_cost: String(selectedRate?.cost || '0')
        };

        // Create Payment Intent on Server
        const res = await fetch('/api/stripe/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: Math.round(total * 100),
                payment_method_types: [paymentMethodType], // Sends "afterpay_clearpay" to prevent API error
                metadata: { order_id: orderDetails.orderId, ...shippingMetadata },
                orderId: orderDetails.orderId,
                customerInfo, 
                shippingInfo: shippingInfo || customerInfo, 
                cartItems,
                appliedCoupons
            }),
        });
        
        const { clientSecret, error: piError } = await res.json();
        if (piError || !clientSecret) throw new Error(piError?.message || "Could not initialize payment.");

        // Load Stripe and execute redirect
        const stripe = await loadStripe(mainStripeKey);
        if (!stripe) throw new Error("Stripe failed to load.");

        const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;

        const billingDetails = {
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
              country: 'AU', 
            }
        } as any; // Using 'any' here locally just to pass it to Stripe's raw API safely

        let confirmationResult;
        
        if (paymentMethodType === 'klarna') {
            confirmationResult = await stripe.confirmKlarnaPayment(clientSecret, {
                payment_method: { billing_details: billingDetails },
                return_url: returnUrl,
            });
        } else if (paymentMethodType === 'afterpay_clearpay') { // 👈 Checked against correctly mapped type
            confirmationResult = await stripe.confirmAfterpayClearpayPayment(clientSecret, {
                payment_method: { billing_details: billingDetails },
                return_url: returnUrl,
            });
        } else if (paymentMethodType === 'zip') {
            confirmationResult = await stripe.confirmZipPayment(clientSecret, {
                payment_method: { billing_details: billingDetails },
                return_url: returnUrl,
            } as any);
        }

        if (confirmationResult?.error) {
            throw new Error(confirmationResult.error.message);
        }

      } catch (error: unknown) {
        toast.dismiss('bnpl-redirect');
        const errorMessage = error instanceof Error ? error.message : "Redirect failed.";
        toast.error(errorMessage);
        setIsRedirecting(false);
      }
      return;
    }

    // 3. For Offline methods (Bank Transfer, COD)
    onPlaceOrder();
  };

  const isPayPalSelected = selectedPaymentMethod === 'paypal';
  
  const availableGateways = gateways.filter(gateway => {
    if (!gateway.isEnabled) return false;
    if (gateway.minOrderAmount && total < gateway.minOrderAmount) return false;
    if (gateway.maxOrderAmount && total > gateway.maxOrderAmount) return false;
    return true;
  });

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="w-full flex flex-col gap-2.5">
      <div className="w-full">
        <ExpressCheckouts 
            publicKey={mainStripeKey}
            total={total} 
            onOrderPlace={onPlaceOrder as any} 
            isShippingSelected={isShippingSelected}
            cartItems={cartItems}
            customerInfo={customerInfo as any}
            selectedShipping={selectedShipping}
            shippingRates={shippingRates as any}
            appliedCoupons={appliedCoupons as any} 
        />
      </div>
      
      <PayPalMessage total={total} />
      
      <div className="border border-[#e0e0e0] rounded-lg overflow-hidden flex flex-col">
        {availableGateways.map(gateway => (
          <div key={gateway.identifier} className="border-b border-[#e0e0e0] last:border-b-0">
            <div 
                className="flex items-center p-[18px_8px] cursor-pointer bg-[#f9f9f9] transition-colors duration-200 hover:bg-[#f0f0f0]" 
                onClick={() => onPaymentMethodChange(gateway.identifier)}
            >
              <input 
                type="radio" 
                id={gateway.identifier} 
                name="payment_method" 
                value={gateway.identifier} 
                checked={selectedPaymentMethod === gateway.identifier} 
                readOnly 
                className="w-[18px] h-[18px] mr-[15px] shrink-0 accent-[#ff0000]" 
              />
              <label htmlFor={gateway.identifier} className="font-semibold text-base grow cursor-pointer">
                {gateway.title}
              </label>
              <div className="ml-[15px]">
                {getGatewayIcon(gateway.identifier)}
              </div>
            </div>
            
            {/* 🛡️ ONLY load Stripe Form if "stripe" (Credit Card) is selected */}
            {selectedPaymentMethod === gateway.identifier && gateway.identifier === 'stripe' && (
              <div className="p-[10px_5px_5px_5px] bg-[#f9f9f9] border-t border-[#e0e0e0]">
                <StripePaymentGateway 
                    ref={stripeFormRef} 
                    publicKey={mainStripeKey}
                    selectedPaymentMethod={selectedPaymentMethod} 
                    onPlaceOrder={onPlaceOrder as any} 
                    customerInfo={customerInfo as any} 
                    total={total}
                    cartItems={cartItems}
                    shippingInfo={shippingInfo as any}
                    selectedShipping={selectedShipping}
                    shippingRates={shippingRates as any}
                    appliedCoupons={appliedCoupons as any} 
                />
              </div>
            )}

            {/* 🛡️ Load the Database Description for BNPL or Offline Methods */}
            {selectedPaymentMethod === gateway.identifier && gateway.identifier !== 'stripe' && gateway.description && (
               <div className="p-[15px] bg-[#f9f9f9] border-t border-[#e0e0e0]">
                   <div className="w-full text-sm text-[#555] leading-normal" dangerouslySetInnerHTML={{ __html: gateway.description }} />
               </div>
            )}
          </div>
        ))}
      </div>

      <div className="w-full mt-2.5">
        {isPayPalSelected ? (
          <div className="min-h-[150px]">
            <PayPalPaymentGateway
             total={total}
             isPlacingOrder={isPlacingOrder} 
             onPlaceOrder={onPlaceOrder as any} 
             isShippingSelected={isShippingSelected} 
             cartItems={cartItems}
             customerInfo={customerInfo}
             shippingInfo={shippingInfo}
             selectedShipping={selectedShipping}
             shippingRates={shippingRates as any}
             appliedCoupons={appliedCoupons as any}
             />
          </div>
        ) : (
          selectedPaymentMethod && (
            <button
              onClick={handlePlaceOrderClick}
              disabled={isPlacingOrder || isRedirecting || !isShippingSelected}
              className="w-full p-3.5 bg-[#1a1a1a] text-white border-none rounded-lg text-base font-semibold cursor-pointer mt-5 transition-colors duration-200 hover:bg-[#333] disabled:bg-[#cccccc] disabled:cursor-not-allowed disabled:opacity-70 flex justify-center items-center"
            >
              {(isPlacingOrder || isRedirecting) ? (
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
              ) : 'Place Order'}
            </button>
          )
        )}
      </div>
    </div>
    </PayPalScriptProvider>
  );
}