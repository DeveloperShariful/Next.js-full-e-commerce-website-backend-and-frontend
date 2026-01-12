'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import OrderNotes from './_components/OrderNotes';
import ShippingForm from './_components/ShippingForm';
import OrderSummary from './_components/OrderSummary';
import PaymentMethods from './_components/PaymentMethods';

import { createOrder } from '@/app/actions/storefront/checkout/create-order';
import { clearCart } from '@/app/actions/storefront/cart/clear-cart';
import { getShippingRates, ShippingOption } from '@/app/actions/storefront/checkout/get-shipping-rates';

// Types
interface ShippingFormData { firstName: string; lastName: string; address1: string; city: string; state: string; postcode: string; email: string; phone: string; }
interface CartItem { id: string; databaseId: string; name: string; price: number; quantity: number; image?: string; }

type State = { 
  customerInfo: Partial<ShippingFormData>; 
  shippingRates: ShippingOption[]; 
  selectedShippingId: string; 
  selectedPaymentMethod: string; 
  orderNotes: string; 
  addressInputStarted: boolean; 
  shipToDifferentAddress: boolean;
  shippingInfo: Partial<ShippingFormData>;
  loading: { order: boolean; shipping: boolean }; 
};

type Action = 
  | { type: 'SET_CUSTOMER_INFO'; payload: Partial<ShippingFormData> }
  | { type: 'SET_SHIPPING_INFO'; payload: Partial<ShippingFormData> }
  | { type: 'SET_SHIPPING_RATES'; payload: ShippingOption[] }
  | { type: 'SET_SELECTED_SHIPPING'; payload: string }
  | { type: 'SET_SELECTED_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_ORDER_NOTES'; payload: string }
  | { type: 'SET_ADDRESS_INPUT_STARTED'; payload: boolean }
  | { type: 'SET_SHIP_TO_DIFFERENT_ADDRESS'; payload: boolean }
  | { type: 'SET_LOADING'; key: keyof State['loading']; payload: boolean };

const initialState: State = { 
    customerInfo: {}, 
    shippingRates: [], 
    selectedShippingId: '', 
    selectedPaymentMethod: '', 
    orderNotes: '', 
    addressInputStarted: false, 
    shipToDifferentAddress: false, 
    shippingInfo: {}, 
    loading: { order: false, shipping: false }, 
};

function checkoutReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_CUSTOMER_INFO': return { ...state, customerInfo: { ...state.customerInfo, ...action.payload } };
        case 'SET_SHIPPING_INFO': return { ...state, shippingInfo: { ...state.shippingInfo, ...action.payload } };
        case 'SET_SHIPPING_RATES': return { ...state, shippingRates: action.payload };
        case 'SET_SELECTED_SHIPPING': return { ...state, selectedShippingId: action.payload };
        case 'SET_SELECTED_PAYMENT_METHOD': return { ...state, selectedPaymentMethod: action.payload };
        case 'SET_ORDER_NOTES': return { ...state, orderNotes: action.payload };
        case 'SET_ADDRESS_INPUT_STARTED': return { ...state, addressInputStarted: action.payload };
        case 'SET_SHIP_TO_DIFFERENT_ADDRESS': return { ...state, shipToDifferentAddress: action.payload };
        case 'SET_LOADING': return { ...state, loading: { ...state.loading, [action.key]: action.payload } };
        default: return state;
    }
}

interface CheckoutClientProps { 
    initialPaymentMethods: any[]; 
    initialShippingRates: ShippingOption[]; 
    initialCartItems: CartItem[]; 
    stripePublishableKey: string; 
    paypalClientId: string; 
    cartId: string;
}

function CheckoutClientComponent({ 
    initialPaymentMethods, 
    initialShippingRates, 
    initialCartItems, 
    stripePublishableKey, 
    paypalClientId,
    cartId
}: CheckoutClientProps) {
  
  const router = useRouter();
  const [state, dispatch] = useReducer(checkoutReducer, {
      ...initialState,
      shippingRates: initialShippingRates
  });
  
  const { customerInfo, shippingRates, selectedShippingId, selectedPaymentMethod, orderNotes, loading, shipToDifferentAddress, shippingInfo } = state;
  const customerInfoRef = useRef(customerInfo);
  const shippingInfoRef = useRef(shippingInfo);

  useEffect(() => { customerInfoRef.current = customerInfo; }, [customerInfo]);
  useEffect(() => { shippingInfoRef.current = shippingInfo; }, [shippingInfo]);

  useEffect(() => {
    if (initialPaymentMethods.length > 0 && !selectedPaymentMethod) {
        dispatch({ type: 'SET_SELECTED_PAYMENT_METHOD', payload: initialPaymentMethods[0].id });
    }
    if (shippingRates.length > 0 && !selectedShippingId) {
        dispatch({ type: 'SET_SELECTED_SHIPPING', payload: shippingRates[0].id });
    }
  }, [initialPaymentMethods, shippingRates, selectedPaymentMethod, selectedShippingId]);

  const updateShippingRates = useCallback(async (address: Partial<ShippingFormData>) => {
    if (!address.postcode || !address.city || address.postcode.length < 3) return;

    dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true });

    try {
        const newRates = await getShippingRates({
            cartId: cartId,
            address: {
                city: address.city,
                postcode: address.postcode,
                state: address.state || ""
            }
        });

        dispatch({ type: 'SET_SHIPPING_RATES', payload: newRates });
        
        if (newRates.length > 0) {
            dispatch({ type: 'SET_SELECTED_SHIPPING', payload: newRates[0].id });
        }

    } catch (error) {
        console.error("Failed to update rates:", error);
        toast.error("Could not load shipping rates.");
    } finally {
        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false });
    }
  }, [cartId]);

  const handleAddressChange = useCallback((address: Partial<ShippingFormData>) => {
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: address });
    dispatch({ type: 'SET_ADDRESS_INPUT_STARTED', payload: true });

    if (!shipToDifferentAddress) {
        updateShippingRates(address);
    }
  }, [updateShippingRates, shipToDifferentAddress]);

  const handleShippingAddressChange = useCallback((address: Partial<ShippingFormData>) => {
    dispatch({ type: 'SET_SHIPPING_INFO', payload: address });
    updateShippingRates(address);
  }, [updateShippingRates]);

  const handleToggleShipToDifferent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    dispatch({ type: 'SET_SHIP_TO_DIFFERENT_ADDRESS', payload: isChecked });
    const targetAddress = isChecked ? shippingInfoRef.current : customerInfoRef.current;
    updateShippingRates(targetAddress);
  };

  const calculateTotals = () => {
    const subtotal = initialCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const selectedRate = shippingRates.find(r => r.id === selectedShippingId);
    const shippingCost = selectedRate ? selectedRate.cost : 0;
    return { subtotal, shipping: shippingCost, total: subtotal + shippingCost };
  };
  const totals = calculateTotals();

  const handlePlaceOrder = async (paymentData?: { transaction_id?: string; paymentMethodId?: string; }) => {
    const billingValid = customerInfoRef.current.firstName && customerInfoRef.current.email;
    if (!paymentData?.transaction_id && !billingValid) { 
        toast.error("Please fill in billing details."); 
        return; 
    }
    dispatch({ type: 'SET_LOADING', key: 'order', payload: true });

    try {
        const orderRes = await createOrder({
            billing: customerInfoRef.current, 
            shipping: shipToDifferentAddress ? shippingInfoRef.current : customerInfoRef.current,
            items: initialCartItems.map((item) => ({ productId: item.id, name: item.name, price: item.price, quantity: item.quantity, image: item.image })),
            shippingMethodId: selectedShippingId, 
            paymentMethod: paymentData?.paymentMethodId || selectedPaymentMethod, 
            total: totals.total, 
            customerNote: orderNotes
        });

        if (!orderRes.success || !orderRes.orderId) throw new Error(orderRes.error || "Failed to create order.");
        
        if (paymentData?.transaction_id || initialPaymentMethods.find(m => m.id === (paymentData?.paymentMethodId || selectedPaymentMethod))?.provider === 'offline') {
             await clearCart(); 
             router.push(`/order-success?order_id=${orderRes.orderId}`);
             return;
        }
        return { orderId: orderRes.orderId, orderKey: orderRes.orderKey };
    } catch (error: any) {
        toast.error(error.message || "Order placement failed.");
    } finally {
        dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
    }
  };

  if (initialCartItems.length === 0) return <div className="p-10 text-center">Your cart is empty.</div>;

  return (
    <div className="grid grid-cols-1 gap-8 w-full max-w-[1400px] mx-auto px-4 py-4 md:gap-10 lg:grid-cols-[1fr_550px] lg:gap-12">
      <div className="flex flex-col gap-8">
        <ShippingForm title={shipToDifferentAddress ? "Billing Details" : "Billing & Shipping Details"} onAddressChange={handleAddressChange} defaultValues={customerInfo} />
        
        <div className="mt-[5px] p-4 bg-[#f9f9f9] border border-[#ddd]">
            <label htmlFor="ship-to-different-address" className="flex items-center font-semibold cursor-pointer">
                <input type="checkbox" id="ship-to-different-address" checked={shipToDifferentAddress} onChange={handleToggleShipToDifferent} className="mr-3 w-[18px] h-[18px]" />
                <span>Ship to a different address?</span>
            </label>
        </div>

        {shipToDifferentAddress && <div className="mt-6"><ShippingForm title="Shipping Details" onAddressChange={handleShippingAddressChange} defaultValues={shippingInfo} /></div>}
        <OrderNotes notes={orderNotes} onNotesChange={(notes) => dispatch({ type: 'SET_ORDER_NOTES', payload: notes })} />
      </div>

      <div className="flex flex-col gap-8">
        <OrderSummary 
            cartItems={initialCartItems} 
            totals={totals} 
            rates={shippingRates} 
            selectedRateId={selectedShippingId} 
            onRateSelect={(id) => dispatch({ type: 'SET_SELECTED_SHIPPING', payload: id })}
            isLoadingShipping={loading.shipping} 
        />
        
        <PaymentMethods 
            paymentOptions={initialPaymentMethods} 
            selectedPaymentMethod={selectedPaymentMethod} 
            onPaymentMethodChange={(method) => dispatch({ type: 'SET_SELECTED_PAYMENT_METHOD', payload: method })} 
            onPlaceOrder={handlePlaceOrder} 
            isPlacingOrder={loading.order} 
            total={totals.total} 
            isShippingSelected={!!selectedShippingId} 
            customerInfo={customerInfoRef.current} 
            paypalClientId={paypalClientId} 
            stripePublishableKey={stripePublishableKey}
            
            // 🔥 FIXED: Missing Prop Passed Here
            cartId={cartId} 
            shippingInfo={shipToDifferentAddress ? shippingInfoRef.current : customerInfoRef.current}
            selectedShippingId={selectedShippingId}
        />
      </div>
    </div>
  );
}

export default function CheckoutClient(props: CheckoutClientProps) {
    const [stripePromise] = useState(() => props.stripePublishableKey ? loadStripe(props.stripePublishableKey) : null);
    
    if (!props.stripePublishableKey && props.initialPaymentMethods.some(m => m.provider === 'stripe')) {
        return <div className="text-red-500 p-10 text-center">Stripe Key Missing!</div>;
    }
    if (!stripePromise && props.initialPaymentMethods.some(m => m.provider === 'stripe')) return <div>Loading...</div>;
    if (!stripePromise) return <CheckoutClientComponent {...props} />;
    
    return (
        <Elements stripe={stripePromise} options={{ mode: 'payment', currency: 'aud', amount: 1000 }}>
            <CheckoutClientComponent {...props} />
        </Elements>
    );
}