//app/(storefront)/checkout/_components/PaymentMethods.tsx

'use client';

import Image from 'next/image';
import React, { useRef, useMemo } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import ExpressCheckouts from './ExpressCheckouts';
import PayPalPaymentGateway from './PaypalPaymentGateway';
import StripePaymentGateway from './StripePaymentGateway'; 
import { PaymentOption } from '@/app/actions/storefront/checkout/get-available-payments';

interface CustomerInfo { 
  firstName?: string; 
  lastName?: string; 
  email?: string; 
  phone?: string; 
  address1?: string; 
  city?: string; 
  state?: string; 
  postcode?: string; 
}

interface PaymentMethodsProps {
  paymentOptions: PaymentOption[];
  selectedPaymentMethod: string;
  onPaymentMethodChange: (methodId: string) => void;
  onPlaceOrder: (paymentData?: { transaction_id?: string; paymentMethodId?: string; }) => Promise<{ orderId: string; orderKey: string } | void | null>;
  isPlacingOrder: boolean;
  isShippingSelected: boolean;
  total: number;
  customerInfo: CustomerInfo;
  paypalClientId: string;
  stripePublishableKey: string;
  cartId: string;
  shippingInfo: any; 
  selectedShippingId: string;
}

export default function PaymentMethods(props: PaymentMethodsProps) {
  const { 
    paymentOptions, selectedPaymentMethod, onPaymentMethodChange, total, onPlaceOrder, 
    isPlacingOrder, isShippingSelected, customerInfo, paypalClientId, stripePublishableKey,
    cartId, shippingInfo, selectedShippingId
  } = props;

  const stripeFormRef = useRef<HTMLFormElement>(null);

  // 🔥 FIX: PayPal অপশন তৈরি করা (মেমোইজড)
  const initialPayPalOptions = useMemo(() => {
    // যদি আইডি না থাকে তবে নাল রিটার্ন করব, যাতে নিচে চেক করতে পারি
    if (!paypalClientId) return null;
    
    return {
      clientId: paypalClientId,
      currency: "AUD",
      intent: "capture",
      components: "buttons,messages", 
    };
  }, [paypalClientId]);

  const getGatewayIcon = (option: PaymentOption): React.ReactNode => {
    if (option.provider === 'paypal') return <Image src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" width={80} height={20} className="h-6 w-auto" unoptimized />;
    if (option.id === 'stripe_klarna') return <Image src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" alt="Klarna" width={50} height={20} className="h-6 w-auto" />;
    if (option.id.includes('afterpay')) return <Image src="https://static.afterpay.com/integration/logo-afterpay-colour.svg" alt="Afterpay" width={80} height={20} className="h-6 w-auto" unoptimized />;
    if (option.id === 'stripe_card') return <span className="flex items-center gap-1"><Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={30} height={20} className="h-5 w-5 rounded-[2px]" /><Image src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" width={30} height={20} className="h-5 w-5 rounded-[2px]" /></span>;
    return null;
  };

  const handlePlaceOrderClick = () => {
    if (selectedPaymentMethod && selectedPaymentMethod.startsWith('stripe') && stripeFormRef.current) {
      stripeFormRef.current.requestSubmit();
    } else {
      onPlaceOrder({ paymentMethodId: selectedPaymentMethod });
    }
  };

  // --- JSX RENDERING ---

  // কন্টেন্ট রেন্ডার করার ফাংশন (যাতে PayPal Wrapper এর লজিক পরিষ্কার থাকে)
  const renderContent = () => (
    <div className="w-full flex flex-col gap-2.5">
        
        {/* Express Checkouts */}
        {stripePublishableKey && (
            <ExpressCheckouts 
                total={total} 
                onOrderPlace={onPlaceOrder} 
                isShippingSelected={isShippingSelected} 
                stripePublishableKey={stripePublishableKey} 
            />
        )}
        
        {/* Payment Methods List */}
        <div className="border border-[#e0e0e0] rounded-lg overflow-hidden flex flex-col">
          {paymentOptions.map(option => (
            <div key={option.id} className="border-b border-[#e0e0e0] last:border-b-0">
              <div 
                className={`flex items-center p-[18px_20px] cursor-pointer transition-colors duration-200 ${selectedPaymentMethod === option.id ? 'bg-[#f0f0f0]' : 'bg-[#f9f9f9] hover:bg-[#f0f0f0]'}`} 
                onClick={() => onPaymentMethodChange(option.id)}
              >
                <input 
                    type="radio" 
                    id={option.id} 
                    name="payment_method" 
                    value={option.id} 
                    checked={selectedPaymentMethod === option.id} 
                    readOnly 
                    className="w-[18px] h-[18px] mr-[15px] shrink-0 accent-[#333]" 
                />
                <label htmlFor={option.id} className="font-semibold text-base grow cursor-pointer text-[#333]">{option.name}</label>
                <div className="ml-[15px]">{getGatewayIcon(option)}</div>
              </div>
              
              {selectedPaymentMethod === option.id && (
                  <div className="p-[20px] bg-white border-t border-[#e0e0e0]">
                      {option.provider === 'stripe' && (
                        <StripePaymentGateway 
                            ref={stripeFormRef} 
                            selectedPaymentMethod={selectedPaymentMethod} 
                            onPlaceOrder={onPlaceOrder} 
                            customerInfo={customerInfo} 
                            total={total} 
                        />
                      )}
                      {option.provider === 'offline' && option.description && (
                        <p className="text-sm text-[#555] leading-relaxed m-0" dangerouslySetInnerHTML={{ __html: option.description }} />
                      )}
                      {option.provider === 'paypal' && (
                        <p className="text-sm text-[#555] m-0">{option.description || "Pay securely with PayPal."}</p>
                      )}
                  </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="w-full mt-2.5">
          {selectedPaymentMethod === 'paypal' ? (
            <div className="min-h-[150px] mt-4">
                {/* 🔥 চেক: PayPal অপশন থাকলেই কেবল বাটন রেন্ডার হবে */}
                {initialPayPalOptions ? (
                    <PayPalPaymentGateway 
                        total={total} 
                        isPlacingOrder={isPlacingOrder} 
                        onPlaceOrder={onPlaceOrder} 
                        isShippingSelected={isShippingSelected}
                        cartId={cartId}
                        shippingInfo={shippingInfo}
                        selectedShippingId={selectedShippingId}
                        customerInfo={customerInfo}
                        onSuccess={(orderId) => {
                            window.location.href = `/order-success?order_id=${orderId}`;
                        }}
                    />
                ) : (
                    <div className="p-4 text-center text-red-500 bg-red-50 rounded">
                        PayPal is currently unavailable (Missing Configuration).
                    </div>
                )}
            </div>
          ) : (
            selectedPaymentMethod && (
                <button 
                    onClick={handlePlaceOrderClick} 
                    disabled={isPlacingOrder || !isShippingSelected} 
                    className="w-full p-4 bg-[#1a1a1a] text-white border-none rounded-lg text-base font-bold cursor-pointer mt-5 transition-colors duration-200 hover:bg-[#333] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                >
                    {isPlacingOrder ? 'Processing...' : `Place Order`}
                </button>
            )
          )}
        </div>
    </div>
  );

  // 🔥 MAIN FIX: যদি PayPal অপশন ভ্যালিড থাকে, তবেই Provider দিয়ে র‍্যাপ করবে
  if (initialPayPalOptions) {
    return (
        <PayPalScriptProvider options={initialPayPalOptions}>
            {renderContent()}
        </PayPalScriptProvider>
    );
  }

  // PayPal না থাকলে বা ভুল থাকলে সাধারণ ডিভ রিটার্ন করবে (ক্র্যাশ করবে না)
  return renderContent();
}