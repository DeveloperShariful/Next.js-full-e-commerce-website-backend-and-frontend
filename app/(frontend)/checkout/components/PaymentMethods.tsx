// app/(frontend)/checkout/components/PaymentMethods.tsx
'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { PaymentIntentResult } from '@stripe/stripe-js';
import ExpressCheckouts from './ExpressCheckouts';
import PayPalPaymentGateway from './PayPalPaymentGateway';
import StripePaymentGateway from './StripePaymentGateway';
import PayPalMessage from './PayPalMessage';
import { toast } from 'sonner';

// ============================================================================
// 1. INTERFACES
// ============================================================================
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
  orderNotes: string;
  // Shared Stripe Payment Intent (created once in CheckoutClientComponent)
  stripeClientSecret: string | null;
  stripePaymentIntentId?: string | null;
  stripePublicKey?: string | null;
}

// ============================================================================
// 2. MAIN COMPONENT
// ============================================================================
export default function PaymentMethods(props: PaymentMethodsProps) {
  const {
    gateways,
    selectedPaymentMethod,
    onPaymentMethodChange,
    total,
    onPlaceOrder,
    isPlacingOrder,
    isShippingSelected,
    customerInfo,
    cartItems,
    shippingInfo,
    selectedShipping,
    shippingRates,
    appliedCoupons,
    orderNotes,
    stripeClientSecret,
    stripePaymentIntentId,
    stripePublicKey,
  } = props;

  const stripeFormRef = useRef<HTMLFormElement>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const mainStripeKey = stripePublicKey || gateways.find(g => g.identifier === 'stripe')?.publicKey || '';
  const isPaypalEnabled = gateways.some(g => g.identifier === 'paypal' && g.isEnabled);
  const isPayPalSelected = selectedPaymentMethod === 'paypal';

  // ============================================================
  // GATEWAY ICONS
  // ============================================================
  const getGatewayIcon = (identifier: string): React.ReactNode => {
    if (identifier === 'paypal')
      return (
        <Image
          src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
          alt="PayPal" width={80} height={20} className="h-6 w-auto" unoptimized
        />
      );
    if (identifier === 'stripe_klarna')
      return (
        <Image
          src="https://x.klarnacdn.net/payment-method/assets/badges/generic/klarna.svg"
          alt="Klarna" width={50} height={20} className="h-6 w-auto"
        />
      );
    if (identifier === 'stripe_afterpay')
      return (
        <Image
          src="https://static.afterpay.com/integration/logo-afterpay-colour.svg"
          alt="Afterpay" width={80} height={20} className="h-6 w-auto" unoptimized
        />
      );
    if (identifier === 'stripe_zip')
      return (
        <Image
          src="https://gobikes.au/wp-content/uploads/2026/05/Zip-Pay-Logo.webp"
          alt="Zip Pay" width={50} height={20} className="h-6 w-auto" unoptimized
        />
      );
    if (identifier === 'stripe')
      return (
        <Image
          src="https://gobikes.au/wp-content/uploads/2026/05/Credit-Card-Icons.webp"
          alt="Visa/Mastercard"
          width={300} height={200}
          className="h-7 w-auto rounded-[5px] md:h-[28px]"
          style={{ width: 'auto' }}
        />
      );
    return null;
  };

  // ============================================================
  // PLACE ORDER — handles all non-PayPal flows
  // ============================================================
  const handlePlaceOrderClick = async () => {

    // ── Credit Card (Stripe Payment Element) ─────────────────
    if (selectedPaymentMethod === 'stripe' && stripeFormRef.current) {
      stripeFormRef.current.requestSubmit();
      return;
    }

    // ── BNPL: Klarna / Afterpay / Zip ────────────────────────
    // These methods need explicit payment_method_types on the PI, which is incompatible
    // with the shared PI (automatic_payment_methods used by Express Checkout + Card).
    // Solution: create a fresh dedicated PI for each BNPL payment.
    if (selectedPaymentMethod.startsWith('stripe_')) {
      setIsRedirecting(true);
      toast.loading('Preparing secure redirect...', { id: 'bnpl-redirect' });

      try {
        const orderDetails = await onPlaceOrder({
          redirect_needed: true,
          paymentMethodId: selectedPaymentMethod,
        });
        if (!orderDetails?.orderId) throw new Error('Order creation failed. Please try again.');

        // DB identifier → Stripe API payment method type
        // 'stripe_afterpay' → 'afterpay_clearpay'
        // 'stripe_klarna'   → 'klarna'
        // 'stripe_zip'      → 'zip'
        let paymentMethodType = selectedPaymentMethod.replace('stripe_', '');
        if (paymentMethodType === 'afterpay') paymentMethodType = 'afterpay_clearpay';

        // Create a dedicated PI for this BNPL method with explicit payment_method_types.
        // orderId → server fetches authoritative amount from DB (never trusts frontend).
        const piRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderDetails.orderId,
            payment_method_types: [paymentMethodType],
          }),
        });
        const piData = await piRes.json();
        if (!piRes.ok || !piData.clientSecret) {
          throw new Error(piData.error || 'Could not initialize payment. Please try again.');
        }
        const bnplClientSecret = piData.clientSecret;

        const stripe = await loadStripe(mainStripeKey);
        if (!stripe) throw new Error('Stripe failed to load.');

        const returnUrl = `${window.location.origin}/order-confirmation?order_id=${orderDetails.orderId}&key=${orderDetails.orderKey}`;

        const billingDetails = {
          name: [customerInfo.firstName, customerInfo.lastName].filter(Boolean).join(' ') || undefined,
          email: customerInfo.email || undefined,
          phone: customerInfo.phone || undefined,
          address: {
            line1: customerInfo.address1 || undefined,
            city: customerInfo.city || undefined,
            state: customerInfo.state || undefined,
            postal_code: customerInfo.postcode || undefined,
            country: 'AU' as string,
          },
        };

        let confirmResult: PaymentIntentResult | undefined;

        if (paymentMethodType === 'klarna') {
          confirmResult = await stripe.confirmKlarnaPayment(bnplClientSecret, {
            payment_method: { billing_details: billingDetails },
            return_url: returnUrl,
          });
        } else if (paymentMethodType === 'afterpay_clearpay') {
          confirmResult = await stripe.confirmAfterpayClearpayPayment(bnplClientSecret, {
            payment_method: { billing_details: billingDetails },
            return_url: returnUrl,
          });
        } else if (paymentMethodType === 'zip') {
          confirmResult = await (stripe as any).confirmZipPayment(bnplClientSecret, {
            payment_method: { billing_details: billingDetails },
            return_url: returnUrl,
          });
        }

        if (confirmResult?.error) {
          throw new Error(confirmResult.error.message || 'Payment redirect failed.');
        }

      } catch (error: unknown) {
        toast.dismiss('bnpl-redirect');
        toast.error(error instanceof Error ? error.message : 'Redirect failed. Please try again.');
        setIsRedirecting(false);
      }
      return;
    }

    // ── Offline methods (Bank Transfer, COD) ─────────────────
    onPlaceOrder();
  };

  // ============================================================
  // FILTER & SORT GATEWAYS
  // ============================================================
  const availableGateways = gateways.filter(gateway => {
    if (!gateway.isEnabled) return false;
    // Afterpay hard limit: AUD $4,000
    if (gateway.identifier === 'stripe_afterpay' && total > 4000) return false;
    if (gateway.minOrderAmount && total < gateway.minOrderAmount) return false;
    if (gateway.maxOrderAmount && total > gateway.maxOrderAmount) return false;
    return true;
  });

  const gatewaySortOrder = [
    'paypal',
    'stripe',
    'stripe_afterpay',
    'stripe_zip',
    'stripe_klarna',
    'bank_transfer',
    'cod',
  ];

  availableGateways.sort((a, b) => {
    const ia = gatewaySortOrder.indexOf(a.identifier);
    const ib = gatewaySortOrder.indexOf(b.identifier);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full flex flex-col gap-2.5">

      {/* Express Checkout — Google Pay / Apple Pay */}
      <div className="w-full">
        <ExpressCheckouts
          publicKey={mainStripeKey}
          clientSecret={stripeClientSecret}
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

      {/* PayPal Pay Later message */}
      {isPaypalEnabled && <PayPalMessage total={total} />}

      {/* Payment method radio list */}
      <div className="border border-[#e0e0e0] rounded-lg overflow-hidden flex flex-col">
        {availableGateways.map(gateway => (
          <div key={gateway.identifier} className="border-b border-[#e0e0e0] last:border-b-0">

            {/* Radio row */}
            <div
              className={`flex items-center p-[18px_8px] cursor-pointer transition-colors duration-200 ${
                selectedPaymentMethod === gateway.identifier
                  ? 'bg-blue-50/10'
                  : 'bg-[#f9f9f9] hover:bg-[#f0f0f0]'
              }`}
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
              <label
                htmlFor={gateway.identifier}
                className="font-semibold text-base grow cursor-pointer text-gray-800"
              >
                {gateway.title}
              </label>
              <div className="ml-[15px]">{getGatewayIcon(gateway.identifier)}</div>
            </div>

            {/* Stripe credit card form */}
            {selectedPaymentMethod === gateway.identifier && gateway.identifier === 'stripe' && (
              <div className="p-[10px_5px_5px_5px] bg-[#f9f9f9] border-t border-[#e0e0e0]">
                <StripePaymentGateway
                  ref={stripeFormRef}
                  publicKey={mainStripeKey}
                  clientSecret={stripeClientSecret}
                  stripePaymentIntentId={stripePaymentIntentId || null}
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

            {/* BNPL / Offline: show description text */}
            {selectedPaymentMethod === gateway.identifier &&
              gateway.identifier !== 'stripe' &&
              gateway.description && (
                <div className="p-[15px] bg-[#f9f9f9] border-t border-[#e0e0e0]">
                  <div
                    className="w-full text-sm text-[#555] leading-normal"
                    dangerouslySetInnerHTML={{ __html: gateway.description }}
                  />
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Place Order button / PayPal buttons */}
      <div className="w-full mt-2.5">
        {isPayPalSelected ? (
          <div className="min-h-[150px]">
            <PayPalPaymentGateway
              total={total}
              isPlacingOrder={isPlacingOrder}
              isShippingSelected={isShippingSelected}
              cartItems={cartItems}
              customerInfo={customerInfo}
              shippingInfo={shippingInfo}
              selectedShipping={selectedShipping}
              shippingRates={shippingRates as any}
              appliedCoupons={appliedCoupons as any}
              orderNotes={orderNotes}
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
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                'Place Order'
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}