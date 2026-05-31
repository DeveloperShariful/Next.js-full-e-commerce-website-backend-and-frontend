//app/(frontend)/checkout/CheckoutClient.tsx

'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useCallback, useReducer, useRef, useState, useMemo } from 'react';
import { useCart } from '../../../context/CartContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Components
import OrderNotes from './_components/OrderNotes';
import ShippingForm from './_components/ShippingForm';
import OrderSummary from './_components/OrderSummary';
import PaymentMethods from './_components/PaymentMethods';

// Types from our Schema
import { PaymentGatewayUI } from '@/app/(backend)/admin/settings/payments/types-and-schemas';

interface ShippingFormData { 
  firstName: string; lastName: string; address1: string; city: string; 
  state: string; postcode: string; email: string; phone: string; 
}

interface ShippingRate { id: string; label: string; cost: string; }

type State = { 
  customerInfo: Partial<ShippingFormData>; 
  shippingRates: ShippingRate[]; 
  selectedShipping: string; 
  selectedPaymentMethod: string; 
  orderNotes: string; 
  addressInputStarted: boolean; 
  shipToDifferentAddress: boolean;
  shippingInfo: Partial<ShippingFormData>;
  loading: { shipping: boolean; order: boolean; }; 
};

type Action = 
  | { type: 'SET_CUSTOMER_INFO'; payload: Partial<ShippingFormData> }
  | { type: 'SET_SHIPPING_INFO'; payload: Partial<ShippingFormData> }
  | { type: 'SET_SHIPPING_RATES'; payload: ShippingRate[] }
  | { type: 'SET_SELECTED_SHIPPING'; payload: string }
  | { type: 'SET_SELECTED_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_ORDER_NOTES'; payload: string }
  | { type: 'SET_ADDRESS_INPUT_STARTED'; payload: boolean }
  | { type: 'SET_SHIP_TO_DIFFERENT_ADDRESS'; payload: boolean }
  | { type: 'SET_LOADING'; key: keyof State['loading']; payload: boolean };

const initialState: State = { 
  customerInfo: {}, 
  shippingRates: [], 
  selectedShipping: '', 
  selectedPaymentMethod: 'stripe', 
  orderNotes: '', 
  addressInputStarted: false, 
  shipToDifferentAddress: false,
  shippingInfo: {},
  loading: { shipping: false, order: false }, 
};

function checkoutReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_CUSTOMER_INFO': return { ...state, customerInfo: { ...state.customerInfo, ...action.payload } };
        case 'SET_SHIPPING_INFO': return { ...state, shippingInfo: { ...state.shippingInfo, ...action.payload } };
        case 'SET_SHIPPING_RATES': return { ...state, shippingRates: action.payload };
        case 'SET_SELECTED_SHIPPING': return { ...state, selectedShipping: action.payload };
        case 'SET_SELECTED_PAYMENT_METHOD': return { ...state, selectedPaymentMethod: action.payload };
        case 'SET_ORDER_NOTES': return { ...state, orderNotes: action.payload };
        case 'SET_ADDRESS_INPUT_STARTED': return { ...state, addressInputStarted: action.payload };
        case 'SET_SHIP_TO_DIFFERENT_ADDRESS': return { ...state, shipToDifferentAddress: action.payload };
        case 'SET_LOADING': return { ...state, loading: { ...state.loading, [action.key]: action.payload } };
        default: return state;
    }
}

function CheckoutClientComponent({ paymentGateways }: { paymentGateways: PaymentGatewayUI[] }) {
  const router = useRouter();
  const { cartItems, loading: isCartLoading } = useCart();
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  const { customerInfo, shippingRates, selectedShipping, selectedPaymentMethod, orderNotes, addressInputStarted, loading, shipToDifferentAddress, shippingInfo } = state;

  const customerInfoRef = useRef(customerInfo);
  useEffect(() => { customerInfoRef.current = customerInfo; }, [customerInfo]);

  const parsePrice = useCallback((priceStr: string): number => {
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  }, []);

  const fetchShippingRates = useCallback(async (postcode: string, city: string) => {
    if (!postcode || !city) return;
    dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true });
    try {
        const calculatedRates: ShippingRate[] = [
            { id: 'flat_rate', label: 'Standard Delivery', cost: '15.00' },
            { id: 'express', label: 'Express Courier', cost: '35.00' }
        ];
        dispatch({ type: 'SET_SHIPPING_RATES', payload: calculatedRates });
        dispatch({ type: 'SET_SELECTED_SHIPPING', payload: calculatedRates[0].id });
    } catch (e) {
        toast.error("Shipping calculation failed.");
    } finally {
        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false });
    }
  }, []);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + (parsePrice(item.price) * item.quantity), 0);
    const selectedRate = shippingRates.find(r => r.id === selectedShipping);
    const shipping = selectedRate ? parseFloat(selectedRate.cost) : 0;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }, [cartItems, shippingRates, selectedShipping, parsePrice]);

  useEffect(() => {
    if (!isCartLoading && cartItems.length === 0) {
        router.push('/cart');
    }
  }, [isCartLoading, cartItems.length, router]);

  const handleAddressChange = useCallback((address: Partial<ShippingFormData>) => {
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: address });
    if (!addressInputStarted) dispatch({ type: 'SET_ADDRESS_INPUT_STARTED', payload: true });
    if (address.postcode && address.city) {
        fetchShippingRates(address.postcode, address.city);
    }
  }, [addressInputStarted, fetchShippingRates]);

  // ✅ 100% Dynamic API Calling
  const handlePlaceOrder = async (paymentData?: any) => {
    const billingDetails = paymentData?.shippingAddress || customerInfo;
    if (!billingDetails.firstName || !billingDetails.email) {
      toast.error("Please complete your billing details first.");
      return null;
    }

    if (!selectedShipping && !paymentData?.shippingAddress) {
      toast.error("Please select a shipping method.");
      return null;
    }

    dispatch({ type: 'SET_LOADING', key: 'order', payload: true });

    try {
      const finalShippingInfo = shipToDifferentAddress ? shippingInfo : billingDetails;

      const orderPayload = {
        cartItems: cartItems.map(item => ({
            id: item.id,
            databaseId: item.databaseId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            sku: item.slug
        })),
        customerInfo: billingDetails,
        shippingInfo: finalShippingInfo,
        selectedShipping,
        shippingRates,
        appliedCoupons: [],
        orderNotes,
        selectedPaymentMethod: paymentData?.paymentMethodId || selectedPaymentMethod,
      };

      // 🌐 API কল করা হচ্ছে (Create Order)
      const response = await fetch('/api/stripe/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create order. Please try again.');
      }

      return { 
        orderId: result.wcOrderId, 
        orderNumber: result.wcOrderKey 
      };

    } catch (err: any) {
      toast.error(err.message || "Checkout encountered an error.");
      dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
      return null;
    }
  };

  const isShippingSelected = !!selectedShipping;

  if (isCartLoading || cartItems.length === 0) {
    return <div className="flex justify-center items-center min-h-[60vh] text-xl font-bold animate-pulse text-gray-400">Loading Secure Checkout...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 w-full max-w-[1400px] mx-auto px-4 py-6 md:gap-10 lg:grid-cols-[1fr_550px] lg:gap-12">
      <div className="flex flex-col gap-8">
        <ShippingForm title={shipToDifferentAddress ? "Billing Information" : "Contact & Shipping Information"} onAddressChange={handleAddressChange} defaultValues={customerInfo} />
        
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <label className="flex items-center font-bold text-gray-700 cursor-pointer group">
                <input type="checkbox" checked={shipToDifferentAddress} onChange={(e) => dispatch({ type: 'SET_SHIP_TO_DIFFERENT_ADDRESS', payload: e.target.checked })} className="mr-3 w-5 h-5 accent-blue-600 rounded" />
                <span className="group-hover:text-blue-600 transition-colors">Deliver to a different address?</span>
            </label>
        </div>

        {shipToDifferentAddress && (
            <ShippingForm title="Delivery Information" onAddressChange={(addr) => dispatch({ type: 'SET_SHIPPING_INFO', payload: addr })} defaultValues={shippingInfo} />
        )}

        <OrderNotes notes={orderNotes} onNotesChange={(notes) => dispatch({ type: 'SET_ORDER_NOTES', payload: notes })} />
      </div>

      <div className="flex flex-col gap-8">
        <OrderSummary cartItems={cartItems} subtotal={totals.subtotal} total={totals.total} shippingTotal={totals.shipping} rates={shippingRates} selectedRateId={selectedShipping} onRateSelect={(id) => dispatch({ type: 'SET_SELECTED_SHIPPING', payload: id })} isLoadingShipping={loading.shipping} addressEntered={addressInputStarted} />

        <PaymentMethods 
          gateways={paymentGateways}
          selectedPaymentMethod={selectedPaymentMethod} 
          onPaymentMethodChange={(m) => dispatch({ type: 'SET_SELECTED_PAYMENT_METHOD', payload: m })} 
          onPlaceOrder={handlePlaceOrder} 
          isPlacingOrder={loading.order} 
          total={totals.total} 
          isShippingSelected={isShippingSelected} 
          customerInfo={customerInfoRef.current}
          cartItems={cartItems}
          shippingInfo={shipToDifferentAddress ? shippingInfo : customerInfo}
          selectedShipping={selectedShipping}
          shippingRates={shippingRates}
          appliedCoupons={[]}
        />
      </div>
    </div>
  );
}

// Global Provider Wrapper
export default function CheckoutClient({ paymentGateways }: { paymentGateways: PaymentGatewayUI[] }) {
    
    // ১. ডাটাবেজ থেকে আসা Stripe গেটওয়েটি খুঁজে বের করা হচ্ছে
    const stripeGateway = paymentGateways.find(g => g.identifier === 'stripe');
    const stripePublicKey = stripeGateway?.publicKey || null;

    // ২. .env এর বদলে এখন ডাটাবেজ থেকে পাওয়া publicKey ব্যবহার করা হচ্ছে
    const [stripePromise] = useState(() => 
        stripePublicKey ? loadStripe(stripePublicKey) : null
    );

    // ৩. যদি স্ট্রাইপ এনাবল করা না থাকে বা অ্যাডমিন প্যানেলে কী না বসানো থাকে, 
    // তবে চেকআউট পেজ ক্র্যাশ করবে না, শুধু সাধারণ চেকআউট দেখাবে।
    if (!stripePromise) {
        return <CheckoutClientComponent paymentGateways={paymentGateways} />;
    }
    
    // ✅ FIX: Added Stripe options to resolve the IntegrationError. 
    // This tells Stripe we are using the dynamic "payment" mode and will provide clientSecret later.
    const options = {
        mode: 'payment' as const,
        amount: 100, // Dummy amount (required for initialization, overridden by intent later)
        currency: 'aud',
        appearance: { theme: 'stripe' as const },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <CheckoutClientComponent paymentGateways={paymentGateways} />
        </Elements>
    );
}