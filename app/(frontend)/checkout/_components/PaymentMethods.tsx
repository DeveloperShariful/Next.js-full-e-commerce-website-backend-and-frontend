//app/(frontend)/checkout/_components/PaymentMethods.tsx

'use client';

import Image from 'next/image';
import React, { useRef } from 'react';
import ExpressCheckouts from './ExpressCheckouts';
import PayPalPaymentGateway from './PaypalPaymentGateway'; 
import StripePaymentGateway from './StripePaymentGateway'; 
import PayPalMessage from './PayPalMessage';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { PaymentGatewayUI } from '@/app/(backend)/admin/settings/payments/types-and-schemas';
import { Loader2 } from 'lucide-react';

interface ShippingFormData { 
  firstName: string; lastName: string; address1: string; city: string; 
  state: string; postcode: string; email: string; phone: string; 
}

interface PaymentMethodsProps {
  gateways: PaymentGatewayUI[];
  selectedPaymentMethod: string;
  onPaymentMethodChange: (methodId: string) => void;
  onPlaceOrder: (paymentData?: { 
    transaction_id?: string; 
    shippingAddress?: Partial<ShippingFormData>; 
    redirect_needed?: boolean; 
    paymentMethodId?: string; 
  }) => Promise<{ orderId: string; orderNumber: string } | null>;
  isPlacingOrder: boolean;
  isShippingSelected: boolean;
  total: number;
  customerInfo: any;
  cartItems: any[];
  shippingInfo: any;
  selectedShipping: string;
  shippingRates: any[];
  appliedCoupons: any[];
}

export default function PaymentMethods(props: PaymentMethodsProps) {
  const { 
    gateways, selectedPaymentMethod, onPaymentMethodChange, total, onPlaceOrder, 
    isPlacingOrder, isShippingSelected, customerInfo, cartItems, shippingInfo, 
    selectedShipping, shippingRates, appliedCoupons 
  } = props;

  const stripeFormRef = useRef<HTMLFormElement>(null);
  
  // ✅ FIX: .env বাদ দেওয়া হয়েছে। এখন শুধুমাত্র ডাটাবেজ থেকে Client ID নেবে।
  const paypalGateway = gateways.find(g => g.identifier === "paypal");
  const paypalClientId = paypalGateway?.publicKey; 

  const initialOptions = {
    clientId: paypalClientId || "test", // পেপ্যালের রিকোয়ারমেন্ট: যদি Key না থাকে, তবে "test" পাস করতে হয়, নাহলে স্ক্রিপ্ট ক্র্যাশ করে
    currency: "AUD",
    intent: "capture",
    components: "buttons,messages",
  };

  const getGatewayIcon = (id: string): React.ReactNode => {
    if (id === 'paypal') return <Image src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" width={80} height={20} className="h-6 w-auto" unoptimized />;
    if (id.includes('klarna')) return <Image src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg" alt="Klarna" width={50} height={20} className="h-6 w-auto" />;
    if (id.includes('afterpay')) return <Image src="https://static.afterpay.com/integration/logo-afterpay-colour.svg" alt="Afterpay" width={80} height={20} className="h-6 w-auto" unoptimized />;
    if (id.includes('zip')) return <Image src="https://gobikes.au/wp-content/uploads/2026/05/Zip-Pay-Logo.webp" alt="Zip Pay" width={50} height={20} className="h-6 w-auto" unoptimized />;
    if (id === 'stripe') return <Image src="https://gobikes.au/wp-content/uploads/2026/05/Credit-Card-Icons.webp" alt="Visa" width={150} height={40} className="h-7 w-auto rounded-[5px]" unoptimized />;
    return null;
  };

  const handlePlaceOrderClick = () => {
    if (selectedPaymentMethod.includes('stripe') && stripeFormRef.current) {
      stripeFormRef.current.requestSubmit();
    } else {
      onPlaceOrder();
    }
  };

  // ডাইনামিক ফিল্টারিং
  const availableGateways = gateways.filter(gateway => {
    if ((gateway.identifier.includes('afterpay') || gateway.identifier.includes('klarna')) && total > 2000) return false;
    return true;
  });

  // পেপ্যালের স্ক্রিপ্ট শুধু তখনই লোড হবে যদি পেপ্যাল চালু থাকে
  const isPaypalEnabled = !!paypalClientId;

  const content = (
    <div className="w-full flex flex-col gap-4">
      <ExpressCheckouts 
          total={total} 
          onOrderPlace={onPlaceOrder} 
          isShippingSelected={isShippingSelected}
          cartItems={cartItems}
          customerInfo={customerInfo}
          selectedShipping={selectedShipping}
          shippingRates={shippingRates}
          appliedCoupons={appliedCoupons} 
      />
    
      {isPaypalEnabled && <PayPalMessage total={total} />}
    
      <div className="border border-[#e0e0e0] rounded-lg overflow-hidden flex flex-col bg-white">
        {availableGateways.map(gateway => (
          <div key={gateway.id} className="border-b border-[#e0e0e0] last:border-b-0">
            <div 
                className={`flex items-center p-4 cursor-pointer transition-all ${selectedPaymentMethod === gateway.identifier ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`} 
                onClick={() => onPaymentMethodChange(gateway.identifier)}
            >
              <input type="radio" checked={selectedPaymentMethod === gateway.identifier} readOnly className="w-5 h-5 mr-4 accent-blue-600" />
              <label className="font-bold text-gray-800 grow cursor-pointer">{gateway.title}</label>
              <div className="ml-2">{getGatewayIcon(gateway.identifier)}</div>
            </div>

            {selectedPaymentMethod === gateway.identifier && (
              <div className="p-4 bg-gray-50/50 border-t border-[#e0e0e0] animate-in fade-in duration-300">
                {gateway.provider === "STRIPE" ? (
                  <StripePaymentGateway 
                      ref={stripeFormRef} 
                      selectedPaymentMethod={gateway.identifier} 
                      onPlaceOrder={onPlaceOrder} 
                      customerInfo={customerInfo} 
                      total={total}
                      cartItems={cartItems}
                      shippingInfo={shippingInfo}
                      selectedShipping={selectedShipping}
                      appliedCoupons={appliedCoupons} 
                  />
                ) : (
                  <p className="text-sm text-gray-600 m-0">{gateway.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="w-full">
        {selectedPaymentMethod === 'paypal' ? (
          <PayPalPaymentGateway
            total={total}
            isPlacingOrder={isPlacingOrder} 
            onPlaceOrder={onPlaceOrder} 
            isShippingSelected={isShippingSelected} 
            cartItems={cartItems}
            customerInfo={customerInfo}
            shippingInfo={shippingInfo}
            selectedShipping={selectedShipping}
            shippingRates={shippingRates}
            appliedCoupons={appliedCoupons}
           />
        ) : (
          <button
            onClick={handlePlaceOrderClick}
            disabled={isPlacingOrder || !isShippingSelected}
            className="w-full py-4 bg-black text-white rounded-xl text-lg font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-all shadow-lg active:scale-[0.98]"
          >
            {isPlacingOrder ? <Loader2 className="animate-spin mx-auto" /> : `Complete Payment`}
          </button>
        )}
      </div>
    </div>
  );

  // ✅ FIX: PayPal Enabled না থাকলে PayPalScriptProvider লোড করার দরকার নেই, এতে পারফরম্যান্স বাড়বে।
  if (!isPaypalEnabled) {
      return content;
  }

  return (
    <PayPalScriptProvider options={initialOptions as any}>
      {content}
    </PayPalScriptProvider>
  );
}