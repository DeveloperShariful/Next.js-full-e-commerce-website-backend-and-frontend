//app/(storefront)/checkout/_components/PaymentMethods.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import { PaymentElement } from '@stripe/react-stripe-js';
import ExpressCheckouts from './ExpressCheckouts';

interface PaymentMethodsProps {
  paymentOptions: any[];
  selectedPaymentMethod: string;
  onPaymentMethodChange: (methodId: string) => void
  stripePublishableKey: string;
  total: number;
  cartId: string;
  selectedShippingId: string;
  shippingInfo: any;
  onPlaceOrder: (data?: any) => Promise<any>;
  couponCode?: string;
}

export default function PaymentMethods({
  paymentOptions,
  selectedPaymentMethod,
  onPaymentMethodChange,
  stripePublishableKey,
  total,
  cartId,
  selectedShippingId,
  shippingInfo,
  onPlaceOrder,
  couponCode
}: PaymentMethodsProps) {
  const getGatewayIcon = (option: any) => {
    if (option.provider === 'paypal') return <Image src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" width={60} height={20} className="h-5 w-auto" unoptimized />;
    if (option.id === 'stripe_card') return <span className="text-xs font-bold text-gray-400">VISA / MASTER</span>;
    return null;
  };

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 border-b pb-2">Payment Method</h3>
      {stripePublishableKey && total > 0 && (
        <ExpressCheckouts 
          total={total}
          stripePublishableKey={stripePublishableKey}
          cartId={cartId}
          onOrderPlace={onPlaceOrder}
          isShippingSelected={!!selectedShippingId}
          selectedShippingId={selectedShippingId}
          shippingInfo={shippingInfo}
          couponCode={couponCode}
        />
      )}

      <div className="space-y-4">
        {paymentOptions.map((option) => (
          <div 
            key={option.id} 
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedPaymentMethod === option.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
            }`} 
            onClick={() => onPaymentMethodChange(option.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="payment_method" 
                  checked={selectedPaymentMethod === option.id} 
                  onChange={() => onPaymentMethodChange(option.id)}
                  className="w-4 h-4 accent-black"
                />
                <span className="font-medium text-gray-800">{option.name}</span>
              </div>
              <div>{getGatewayIcon(option)}</div>
            </div>
            
            {selectedPaymentMethod === option.id && (
              <div className="mt-4 pl-7 animate-in fade-in slide-in-from-top-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                {option.description && (
                   <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                )}
                
                {option.provider === 'stripe' && (
                    <div className="mb-2 p-2 bg-white border border-gray-100 rounded">
                        <PaymentElement options={{ layout: 'tabs' }} />
                    </div>
                )}

                {/* PayPal নোটিশ */}
                {option.provider === 'paypal' && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        You will be redirected to PayPal to complete your purchase securely.
                    </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}