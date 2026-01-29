//app/(storefront)/checkout/CheckoutClient.tsx

'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Child Components
import OrderNotes from './_components/OrderNotes';
import ShippingForm from './_components/ShippingForm';
import OrderSummary from './_components/OrderSummary';
import PaymentMethods from './_components/PaymentMethods';

// Server Actions
import { createOrder } from '@/app/actions/storefront/checkout/create-order';
import { getShippingRates, ShippingOption } from '@/app/actions/storefront/checkout/get-shipping-rates';

// Types
interface ShippingFormData { 
    firstName: string; 
    lastName: string; 
    address1: string; 
    city: string; 
    state: string; 
    postcode: string; 
    email: string; 
    phone: string; 
}

interface CartItem { 
    id: string; 
    databaseId: string; 
    name: string; 
    price: number; 
    quantity: number; 
    image?: string; 
}

// State Management
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
  
  // Refs to access latest state in async functions without dependency loops
  const customerInfoRef = useRef(customerInfo);
  const shippingInfoRef = useRef(shippingInfo);

  useEffect(() => { customerInfoRef.current = customerInfo; }, [customerInfo]);
  useEffect(() => { shippingInfoRef.current = shippingInfo; }, [shippingInfo]);

  // Set Defaults
  useEffect(() => {
    if (initialPaymentMethods.length > 0 && !selectedPaymentMethod) {
        dispatch({ type: 'SET_SELECTED_PAYMENT_METHOD', payload: initialPaymentMethods[0].id });
    }
    // If we have initial rates (e.g. default pickup), select the first one
    if (shippingRates.length > 0 && !selectedShippingId) {
        dispatch({ type: 'SET_SELECTED_SHIPPING', payload: shippingRates[0].id });
    }
  }, [initialPaymentMethods, shippingRates, selectedPaymentMethod, selectedShippingId]);

  // 🚚 1. Handle Shipping Rate Calculation
  const updateShippingRates = useCallback(async (address: Partial<ShippingFormData>) => {
    if (!address.postcode || !address.city || address.postcode.length < 3) return;

    dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true });

    try {
        const newRates = await getShippingRates({
            cartId: cartId, // 🛡️ Using cartId for server-side validation
            address: {
                city: address.city,
                postcode: address.postcode,
                state: address.state || ""
            }
        });

        dispatch({ type: 'SET_SHIPPING_RATES', payload: newRates });
        
        // Auto-select first option if available
        if (newRates.length > 0) {
            dispatch({ type: 'SET_SELECTED_SHIPPING', payload: newRates[0].id });
        } else {
            dispatch({ type: 'SET_SELECTED_SHIPPING', payload: '' });
        }

    } catch (error) {
        console.error("Failed to update rates:", error);
        toast.error("Could not load shipping rates. Please check address.");
    } finally {
        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false });
    }
  }, [cartId]);

  // 📝 2. Address Handlers
  const handleAddressChange = useCallback((address: Partial<ShippingFormData>) => {
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: address });
    dispatch({ type: 'SET_ADDRESS_INPUT_STARTED', payload: true });

    // If shipping to billing, update rates immediately
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
    
    // Recalculate rates based on the correct address context
    const targetAddress = isChecked ? shippingInfoRef.current : customerInfoRef.current;
    updateShippingRates(targetAddress);
  };

  // 💰 3. Calculate Display Totals (Frontend Only - Server Validates)
  const calculateTotals = () => {
    const subtotal = initialCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const selectedRate = shippingRates.find(r => r.id === selectedShippingId);
    const shippingCost = selectedRate ? selectedRate.cost : 0;
    return { subtotal, shipping: shippingCost, total: subtotal + shippingCost };
  };
  const totals = calculateTotals();

  // 🛒 4. Handle Order Placement
  const handlePlaceOrder = async (paymentData?: { transaction_id?: string; paymentMethodId?: string; shippingAddress?: any }) => {
    
    const currentBilling = customerInfoRef.current;
    
    // Basic Validation
    if (!currentBilling.firstName || !currentBilling.email) { 
        toast.error("Please fill in billing details."); 
        return; 
    }
    
    // For manual/offline payments, shipping must be selected unless it's a virtual product cart (logic simplified here)
    if (shippingRates.length > 0 && !selectedShippingId) {
        toast.error("Please select a shipping method.");
        return;
    }

    dispatch({ type: 'SET_LOADING', key: 'order', payload: true });

    try {
        const finalShippingAddress = paymentData?.shippingAddress || (shipToDifferentAddress ? shippingInfoRef.current : currentBilling);

        // 🔥 CALL SERVER ACTION
        // We do NOT send the total price. The server calculates it from cartId + shippingMethodId.
        const orderRes = await createOrder({
            cartId: cartId, 
            billing: currentBilling, 
            shipping: finalShippingAddress,
            shippingMethodId: selectedShippingId, 
            paymentMethod: paymentData?.paymentMethodId || selectedPaymentMethod, 
            customerNote: orderNotes
        });

        if (!orderRes.success || !orderRes.orderId) {
            throw new Error(orderRes.error || "Failed to create order.");
        }
        
        // A. Offline Payment / COD / Bank Transfer
        if (paymentData?.transaction_id || initialPaymentMethods.find(m => m.id === (paymentData?.paymentMethodId || selectedPaymentMethod))?.provider === 'offline') {
             // Cart is cleared on server for offline payments
             router.push(`/order-success?order_id=${orderRes.orderId}`);
             return;
        }
        
        // B. Stripe Elements
        // Return orderId so StripeGateway can use it in return_url
        return { orderId: orderRes.orderId, orderKey: orderRes.orderKey };

    } catch (error: any) {
        console.error("Order Place Error:", error);
        toast.error(error.message || "Order placement failed. Please try again.");
    } finally {
        dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
    }
  };

  // Empty Cart Check
  if (initialCartItems.length === 0) return (
      <div className="p-10 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <button onClick={() => router.push('/shop')} className="px-6 py-2 bg-black text-white rounded">
              Continue Shopping
          </button>
      </div>
  );

  return (
    <div className="grid grid-cols-1 gap-8 w-full max-w-[1400px] mx-auto px-4 py-4 md:gap-10 lg:grid-cols-[1fr_550px] lg:gap-12">
      
      {/* LEFT COLUMN: Forms */}
      <div className="flex flex-col gap-8">
        <ShippingForm 
            title={shipToDifferentAddress ? "Billing Details" : "Billing & Shipping Details"} 
            onAddressChange={handleAddressChange} 
            defaultValues={customerInfo} 
        />
        
        <div className="mt-[5px] p-4 bg-[#f9f9f9] border border-[#ddd] rounded">
            <label htmlFor="ship-to-different-address" className="flex items-center font-semibold cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    id="ship-to-different-address" 
                    checked={shipToDifferentAddress} 
                    onChange={handleToggleShipToDifferent} 
                    className="mr-3 w-[18px] h-[18px] accent-black" 
                />
                <span>Ship to a different address?</span>
            </label>
        </div>

        {shipToDifferentAddress && (
            <div className="mt-2 animate-fadeIn">
                <ShippingForm 
                    title="Shipping Details" 
                    onAddressChange={handleShippingAddressChange} 
                    defaultValues={shippingInfo} 
                />
            </div>
        )}
        
        <OrderNotes 
            notes={orderNotes} 
            onNotesChange={(notes) => dispatch({ type: 'SET_ORDER_NOTES', payload: notes })} 
        />
      </div>

      {/* RIGHT COLUMN: Summary & Payment */}
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
            
            // 🔥 Passing Vital Props for Server Side Security
            cartId={cartId} 
            shippingInfo={shipToDifferentAddress ? shippingInfoRef.current : customerInfoRef.current}
            selectedShippingId={selectedShippingId}
        />
      </div>
    </div>
  );
}

// Wrapper to load Stripe Context safely
export default function CheckoutClient(props: CheckoutClientProps) {
    const [stripePromise] = useState(() => {
        // Only load Stripe if a Stripe-based method is available and key exists
        const hasStripeMethod = props.initialPaymentMethods.some(m => m.provider === 'stripe');
        if (hasStripeMethod && props.stripePublishableKey) {
            return loadStripe(props.stripePublishableKey);
        }
        return null;
    });
    
    // If Stripe is configured but key is missing
    if (!props.stripePublishableKey && props.initialPaymentMethods.some(m => m.provider === 'stripe')) {
        return <div className="text-red-500 p-10 text-center border border-red-200 bg-red-50 m-4 rounded">System Error: Stripe configuration missing public key.</div>;
    }

    // If Stripe logic is active but promise not resolved yet (rare, usually sync)
    // if (!stripePromise && props.initialPaymentMethods.some(m => m.provider === 'stripe')) return <div>Loading Payment System...</div>;
    
    // Render with Stripe Elements Provider if Stripe is active
    if (stripePromise) {
        return (
            <Elements stripe={stripePromise} options={{ 
                mode: 'payment', 
                currency: 'aud', 
                amount: Math.round(props.initialCartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) * 100) || 1000, // Fallback amount for init
                appearance: { theme: 'stripe' }
            }}>
                <CheckoutClientComponent {...props} />
            </Elements>
        );
    }

    // Render without Stripe (PayPal / Offline only)
    return <CheckoutClientComponent {...props} />;
}