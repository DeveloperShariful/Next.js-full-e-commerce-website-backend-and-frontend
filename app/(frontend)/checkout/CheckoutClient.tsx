// app/(frontend)/checkout/CheckoutClient.tsx

'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js'; // 🛡️ PayPal Script Provider Imported globally
import { useEffect, useCallback, useReducer, useRef, useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie'; 

// --- Components ---
import OrderNotes from './components/OrderNotes';
import ShippingForm from './components/ShippingForm';
import OrderSummary from './components/OrderSummary';
import PaymentMethods from './components/PaymentMethods';

// --- Server Actions ---
import { 
  getCheckoutDataAction, 
  AddressDTO, 
  CheckoutTotalsDTO, 
  ShippingRateDTO, 
  CouponDTO 
} from '@/app/actions/frontend/checkout/checkoutActions';
import { 
  applyCouponAction, 
  removeCouponAction 
} from '@/app/actions/frontend/cart/cartActions';

// ============================================================================
// 1. STRICT TYPES & INTERFACES
// ============================================================================

export interface PaymentGateway { 
  id: string; 
  identifier: string; 
  provider: string; 
  title: string; 
  description: string | null; 
  isEnabled: boolean; 
  publicKey?: string | null;
}

interface MappedCartData { 
  subtotal: string; 
  total: string; 
  shippingTotal: string; 
  discountTotal: string; 
  appliedCoupons: CouponDTO[]; 
}

type State = { 
  customerInfo: Partial<AddressDTO>; 
  shippingInfo: Partial<AddressDTO>;
  shipToDifferentAddress: boolean;
  shippingRates: ShippingRateDTO[]; 
  selectedShipping: string; 
  selectedPaymentMethod: string; 
  appliedCoupons: CouponDTO[];
  totals: CheckoutTotalsDTO | null; 
  orderNotes: string; 
  addressInputStarted: boolean; 
  loading: { cart: boolean; shipping: boolean; applyingCoupon: boolean; removingCoupon: boolean; order: boolean; }; 
};

type Action = 
  | { type: 'SET_CUSTOMER_INFO'; payload: Partial<AddressDTO> }
  | { type: 'SET_SHIPPING_INFO'; payload: Partial<AddressDTO> }
  | { type: 'SET_SELECTED_SHIPPING'; payload: string }
  | { type: 'SET_SELECTED_PAYMENT_METHOD'; payload: string }
  | { type: 'SET_ORDER_NOTES'; payload: string }
  | { type: 'SET_ADDRESS_INPUT_STARTED'; payload: boolean }
  | { type: 'SET_SHIP_TO_DIFFERENT_ADDRESS'; payload: boolean }
  | { type: 'SET_LOADING'; key: keyof State['loading']; payload: boolean } 
  | { type: 'SET_CHECKOUT_DATA'; payload: { totals: CheckoutTotalsDTO, rates: ShippingRateDTO[], coupons: CouponDTO[], selectedShipping: string } };

const initialState: State = { 
  customerInfo: { country: 'AU' }, 
  shippingInfo: { country: 'AU' },
  shippingRates: [], 
  selectedShipping: '', 
  selectedPaymentMethod: 'paypal', 
  appliedCoupons: [],
  totals: null, 
  orderNotes: '', 
  addressInputStarted: false, 
  shipToDifferentAddress: false,
  loading: { cart: true, shipping: false, applyingCoupon: false, removingCoupon: false, order: false }, 
};

function checkoutReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_CUSTOMER_INFO': return { ...state, customerInfo: { ...state.customerInfo, ...action.payload } };
        case 'SET_SHIPPING_INFO': return { ...state, shippingInfo: { ...state.shippingInfo, ...action.payload } };
        case 'SET_SELECTED_SHIPPING': return { ...state, selectedShipping: action.payload };
        case 'SET_SELECTED_PAYMENT_METHOD': return { ...state, selectedPaymentMethod: action.payload };
        case 'SET_ORDER_NOTES': return { ...state, orderNotes: action.payload };
        case 'SET_ADDRESS_INPUT_STARTED': return { ...state, addressInputStarted: action.payload };
        case 'SET_SHIP_TO_DIFFERENT_ADDRESS': return { ...state, shipToDifferentAddress: action.payload };
        case 'SET_LOADING': return { ...state, loading: { ...state.loading, [action.key]: action.payload } };
        case 'SET_CHECKOUT_DATA':
            return { 
              ...state, 
              totals: action.payload.totals, 
              shippingRates: action.payload.rates, 
              appliedCoupons: action.payload.coupons,
              selectedShipping: action.payload.selectedShipping 
            };
        default: return state;
    }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
};

// ============================================================================
// 2. MAIN COMPONENT (Checkout Forms & Layout)
// ============================================================================

function CheckoutClientComponent({ paymentGateways }: { paymentGateways: PaymentGateway[] }) {
  const router = useRouter();
  const { cartItems, loading: isCartContextLoading } = useCart();
  const [state, dispatch] = useReducer(checkoutReducer, initialState);
  
  const { 
    customerInfo, shippingRates, selectedShipping, selectedPaymentMethod, 
    totals, appliedCoupons, orderNotes, addressInputStarted, loading, 
    shipToDifferentAddress, shippingInfo 
  } = state;
  
  const [orderPlacementInProgress, setOrderPlacementInProgress] = useState<boolean>(false);
  
  const customerInfoRef = useRef(customerInfo);
  useEffect(() => { customerInfoRef.current = customerInfo; }, [customerInfo]);

  const shippingInfoRef = useRef(shippingInfo);
  useEffect(() => { shippingInfoRef.current = shippingInfo; }, [shippingInfo]);

  const shipToDifferentRef = useRef(shipToDifferentAddress);
  useEffect(() => { shipToDifferentRef.current = shipToDifferentAddress; }, [shipToDifferentAddress]);

  const selectedShippingRef = useRef(selectedShipping);
  useEffect(() => { selectedShippingRef.current = selectedShipping; }, [selectedShipping]);

  const lastFetchedAddressKey = useRef<string>('');

  const refetchCartData = useCallback(async (customShippingId?: string, overrideAddress?: Partial<AddressDTO>) => { 
    dispatch({ type: 'SET_LOADING', key: 'cart', payload: true }); 
    
    try { 
      const currentRefAddress = shipToDifferentRef.current ? shippingInfoRef.current : customerInfoRef.current;
      const addressToUse = overrideAddress || currentRefAddress;
      const rateIdToUse = customShippingId !== undefined ? customShippingId : selectedShippingRef.current;

      const addressKey = `${addressToUse.postcode}-${addressToUse.city}-${addressToUse.state}`;

      const response = await getCheckoutDataAction(addressToUse as AddressDTO, rateIdToUse); 
      
      if (response.success && response.totals && response.availableShippingRates) { 
        
        if (addressToUse.postcode && addressToUse.city && addressToUse.state) {
            lastFetchedAddressKey.current = addressKey;
        }

        let newSelectedShipping = rateIdToUse;
        const rateExists = response.availableShippingRates.some(r => r.id === newSelectedShipping);
        
        if (!rateExists && response.availableShippingRates.length > 0) {
          newSelectedShipping = response.availableShippingRates[0].id;
          
          const finalResponse = await getCheckoutDataAction(addressToUse as AddressDTO, newSelectedShipping);
          if (finalResponse.success && finalResponse.totals) {
             dispatch({ 
               type: 'SET_CHECKOUT_DATA', 
               payload: { 
                 totals: finalResponse.totals, 
                 rates: finalResponse.availableShippingRates || [], 
                 coupons: finalResponse.appliedCoupons || [],
                 selectedShipping: newSelectedShipping 
               } 
             });
             return;
          }
        }

        dispatch({ 
          type: 'SET_CHECKOUT_DATA', 
          payload: { 
            totals: response.totals, 
            rates: response.availableShippingRates, 
            coupons: response.appliedCoupons || [],
            selectedShipping: newSelectedShipping 
          } 
        }); 
      } 
    } catch (err) {
      console.error("Error refreshing cart data:", err); 
      toast.error('Could not sync with server.'); 
    } finally { 
      dispatch({ type: 'SET_LOADING', key: 'cart', payload: false }); 
    } 
  }, []); 
  
  useEffect(() => { 
    if (!isCartContextLoading && cartItems.length === 0 && !orderPlacementInProgress) {
      router.push('/cart'); 
    } else if (cartItems.length > 0 && !totals) {
      refetchCartData(); 
    }
  }, [isCartContextLoading, cartItems.length, router, refetchCartData, orderPlacementInProgress, totals]);
  
  const handleAddressChange = useCallback(async (address: Partial<AddressDTO>) => { 
    dispatch({ type: 'SET_CUSTOMER_INFO', payload: address });
    
    if (!addressInputStarted) dispatch({ type: 'SET_ADDRESS_INPUT_STARTED', payload: true });

    const isTransdirectFieldChanged = 
        (address.city !== undefined && address.city !== customerInfoRef.current.city) ||
        (address.postcode !== undefined && address.postcode !== customerInfoRef.current.postcode) ||
        (address.state !== undefined && address.state !== customerInfoRef.current.state);

    if (isTransdirectFieldChanged && !shipToDifferentRef.current && address.city && address.postcode && address.state) { 
        
        const newAddressKey = `${address.postcode}-${address.city}-${address.state}`;
        if (newAddressKey === lastFetchedAddressKey.current) return; 

        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true }); 
        const freshBillingAddress = { ...customerInfoRef.current, ...address };
        await refetchCartData(undefined, freshBillingAddress); 
        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false }); 
    } 
  }, [addressInputStarted, refetchCartData]);

  const handleShippingAddressChange = useCallback(async (address: Partial<AddressDTO>) => { 
    dispatch({ type: 'SET_SHIPPING_INFO', payload: address });

    const isTransdirectFieldChanged = 
        (address.city !== undefined && address.city !== shippingInfoRef.current.city) ||
        (address.postcode !== undefined && address.postcode !== shippingInfoRef.current.postcode) ||
        (address.state !== undefined && address.state !== shippingInfoRef.current.state);

    if (isTransdirectFieldChanged && address.city && address.postcode && address.state) {
        
        const newAddressKey = `${address.postcode}-${address.city}-${address.state}`;
        if (newAddressKey === lastFetchedAddressKey.current) return; 

        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true });
        const freshShippingAddress = { ...shippingInfoRef.current, ...address };
        await refetchCartData(undefined, freshShippingAddress); 
        dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false });
    }
  }, [refetchCartData]);

  const handleToggleShipToDifferent = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    dispatch({ type: 'SET_SHIP_TO_DIFFERENT_ADDRESS', payload: isChecked });
    dispatch({ type: 'SET_LOADING', key: 'shipping', payload: true });
    
    const explicitAddress = isChecked ? shippingInfoRef.current : customerInfoRef.current;
    
    lastFetchedAddressKey.current = ''; 
    await refetchCartData(undefined, explicitAddress);
    dispatch({ type: 'SET_LOADING', key: 'shipping', payload: false });
  };

  // 🛡️ OPTIMISTIC UI + SERVER-SIDE CALCULATION
  const handleShippingSelect = async (rateId: string) => {  
    // 1. Instant UI Update (Zero Loading State)
    dispatch({ type: 'SET_SELECTED_SHIPPING', payload: rateId }); 
    
    const selectedRate = shippingRates.find(rate => rate.id === rateId);
    if (totals && selectedRate) {
        const newShippingCost = selectedRate.cost;
        const newTotal = (totals.subtotal - totals.discountTotal) + newShippingCost + totals.taxTotal;

        dispatch({
            type: 'SET_CHECKOUT_DATA',
            payload: {
                totals: { ...totals, shippingTotal: newShippingCost, total: newTotal },
                rates: shippingRates, 
                coupons: appliedCoupons,
                selectedShipping: rateId
            }
        });
    }

    // 2. Background Server Sync (Silent validation)
    // We intentionally DO NOT set loading to true here to avoid the "Calculating..." flicker
    try {
        const currentRefAddress = shipToDifferentRef.current ? shippingInfoRef.current : customerInfoRef.current;
        const response = await getCheckoutDataAction(currentRefAddress as AddressDTO, rateId);
        
        if (response.success && response.totals) {
            dispatch({
                type: 'SET_CHECKOUT_DATA',
                payload: {
                    totals: response.totals,
                    rates: response.availableShippingRates || shippingRates,
                    coupons: response.appliedCoupons || appliedCoupons,
                    selectedShipping: rateId
                }
            });
        }
    } catch (error) {
        console.error("Silent sync failed:", error);
    }
  };

  const handleApplyCoupon = async (couponCode: string) => { 
    if (appliedCoupons.length > 0) { 
      toast.error("Only one coupon can be applied per order."); 
      return; 
    } 
    dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: true }); 
    toast.loading('Applying coupon...'); 
    
    try { 
      const response = await applyCouponAction(couponCode); 
      toast.dismiss(); 
      if(response.success) {
        toast.success('Coupon applied!'); 
        await refetchCartData(); 
      } else {
        toast.error(response.error || 'Invalid Coupon');
      }
    } catch (error) { 
      toast.dismiss(); 
      toast.error("Failed to apply coupon."); 
    } finally { 
      dispatch({ type: 'SET_LOADING', key: 'applyingCoupon', payload: false }); 
    } 
  };
  
  const handleRemoveCoupon = async (couponCode: string) => { 
    if (loading.removingCoupon) return; 
    dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: true }); 
    toast.loading('Removing coupon...'); 
    
    try { 
      const response = await removeCouponAction(couponCode);
      toast.dismiss(); 
      if(response.success) {
        toast.success('Coupon removed.'); 
        await refetchCartData(); 
      } else {
        toast.error("Could not remove coupon.");
      }
    } catch (error) { 
      toast.dismiss(); 
      toast.error("Error removing coupon"); 
    } finally { 
      dispatch({ type: 'SET_LOADING', key: 'removingCoupon', payload: false }); 
    } 
  };
  
  const handlePlaceOrder = async (paymentData?: { 
    transaction_id?: string; 
    shippingAddress?: Partial<AddressDTO>; 
    redirect_needed?: boolean;
    paymentMethodId?: string;
    is_embedded_redirect?: boolean;
  }) => {
    
    const isExpressCheckout = !!paymentData?.shippingAddress;
    if (!isExpressCheckout && !selectedShipping) {
      toast.error("Please select a shipping method.");
      return null;
    }
  
    const isBillingAddressValid = customerInfoRef.current.firstName && customerInfoRef.current.email;
    const isShippingAddressValid = !shipToDifferentRef.current || (shippingInfoRef.current.firstName && shippingInfoRef.current.email);
  
    if (!paymentData?.shippingAddress && (!isBillingAddressValid || !isShippingAddressValid)) { 
        toast.error("Please fill in all required billing and shipping details."); 
        return null; 
    }
  
    dispatch({ type: 'SET_LOADING', key: 'order', payload: true });
    setOrderPlacementInProgress(true);

    const affiliateId = Cookies.get('solid_affiliate_id');
    const visitId = Cookies.get('solid_affiliate_visit_id');
    const affiliateMetaData: {key: string, value: string}[] = [];
    
    if (affiliateId) affiliateMetaData.push({ key: 'solid_affiliate_id', value: affiliateId });
    if (visitId) affiliateMetaData.push({ key: 'solid_affiliate_visit_id', value: visitId });

    try {
        const billingDetails = paymentData?.shippingAddress && paymentData.shippingAddress.address1
          ? {
              firstName: paymentData.shippingAddress.firstName || '',
              lastName: paymentData.shippingAddress.lastName || '',
              address1: paymentData.shippingAddress.address1 || '',
              city: paymentData.shippingAddress.city || '',
              state: paymentData.shippingAddress.state || '',
              postcode: paymentData.shippingAddress.postcode || '',
              email: paymentData.shippingAddress.email || customerInfoRef.current.email,
              phone: paymentData.shippingAddress.phone || customerInfoRef.current.phone,
          }
          : customerInfoRef.current;
        
        const shippingDetails = shipToDifferentRef.current ? shippingInfoRef.current : billingDetails;

        const orderPayload = {
            cartItems: cartItems,
            customerInfo: billingDetails,
            shippingInfo: shippingDetails,
            selectedShipping,
            shippingRates,
            appliedCoupons: appliedCoupons,
            orderNotes,
            selectedPaymentMethod: paymentData?.paymentMethodId || selectedPaymentMethod,
            affiliateMetaData
        };

        const response = await fetch('/api/stripe/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
        });

        const newOrder = await response.json();

        if (!response.ok || !newOrder.success) {
            throw new Error(newOrder.error || 'Failed to create draft order before payment.');
        }
        
        return { orderId: newOrder.wcOrderId, orderKey: newOrder.wcOrderKey };

    } catch (error: unknown) {
        toast.dismiss();
        if(error instanceof Error) toast.error(error.message);
        else toast.error("An error occurred placing order.");
        
        dispatch({ type: 'SET_LOADING', key: 'order', payload: false });
        setOrderPlacementInProgress(false);
        return null;
    }
  };

  const mappedCartData: MappedCartData | null = totals ? {
    subtotal: formatCurrency(totals.subtotal),
    total: formatCurrency(totals.total),
    shippingTotal: formatCurrency(totals.shippingTotal),
    discountTotal: formatCurrency(totals.discountTotal),
    appliedCoupons: appliedCoupons
  } : null;

  const finalTotalAmount = totals?.total || 0;
  const isShippingSelected = !!selectedShipping;

  if (loading.cart && !totals) { 
    return ( 
      <div className="flex justify-center items-center min-h-[50vh] w-full max-w-[1400px] mx-auto px-4 py-8">
         <div className="w-full animate-pulse flex flex-col md:flex-row gap-10">
           <div className="flex-1 space-y-6">
             <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
             <div className="h-12 bg-gray-200 rounded w-full"></div>
             <div className="h-12 bg-gray-200 rounded w-full"></div>
             <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-gray-200 rounded w-full"></div>
                <div className="h-12 bg-gray-200 rounded w-full"></div>
             </div>
             <div className="h-24 bg-gray-200 rounded w-full"></div>
           </div>
           
           <div className="w-full md:w-[500px] space-y-6 bg-[#f9f9f9] p-6 rounded-lg border border-[#e0e0e0]">
             <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
             <div className="flex gap-4">
                <div className="h-16 w-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
             </div>
             <div className="h-px bg-gray-200 w-full my-4"></div>
             <div className="h-6 bg-gray-200 rounded w-full"></div>
             <div className="h-6 bg-gray-200 rounded w-full"></div>
             <div className="h-12 bg-gray-200 rounded w-full mt-4"></div>
           </div>
         </div>
      </div> 
    ); 
  }

  return (
    <div className="grid grid-cols-1 gap-8 w-full max-w-[1400px] mx-auto px-4 py-4 md:gap-10 lg:grid-cols-[1fr_550px] lg:gap-12">
      <div className="flex flex-col gap-8">
        <ShippingForm
            title={shipToDifferentAddress ? "Billing Details" : "Billing & Shipping Details"}
            onAddressChange={handleAddressChange as any}
            defaultValues={customerInfo as any}
        />
        
        <div className="mt-[5px] p-4 bg-[#f9f9f9] border border-[#ddd]">
            <label htmlFor="ship-to-different-address" className="flex items-center font-semibold cursor-pointer">
                <input
                    type="checkbox"
                    id="ship-to-different-address"
                    checked={shipToDifferentAddress}
                    onChange={handleToggleShipToDifferent}
                    className="mr-3 w-[18px] h-[18px]"
                />
                <span>Ship to a different address?</span>
            </label>
        </div>

        {shipToDifferentAddress && (
            <div className="mt-6">
                <ShippingForm
                    title="Shipping Details"
                    onAddressChange={handleShippingAddressChange as any}
                    defaultValues={shippingInfo as any}
                />
            </div>
        )}

        <OrderNotes notes={orderNotes} onNotesChange={(notes) => dispatch({ type: 'SET_ORDER_NOTES', payload: notes })} />
      </div>
      
      <div className="flex flex-col gap-8">
        <OrderSummary 
          cartItems={cartItems}
          cartData={mappedCartData as any}
          onRemoveCoupon={handleRemoveCoupon}
          isRemovingCoupon={loading.removingCoupon}
          onApplyCoupon={handleApplyCoupon}
          isApplyingCoupon={loading.applyingCoupon}
          rates={shippingRates}
          selectedRateId={selectedShipping}
          onRateSelect={handleShippingSelect} 
          isLoadingShipping={loading.shipping}
          addressEntered={addressInputStarted}
        />
        
        <PaymentMethods 
          gateways={paymentGateways}
          selectedPaymentMethod={selectedPaymentMethod} 
          onPaymentMethodChange={(method) => dispatch({ type: 'SET_SELECTED_PAYMENT_METHOD', payload: method })} 
          onPlaceOrder={handlePlaceOrder} 
          isPlacingOrder={loading.order} 
          total={finalTotalAmount} 
          isShippingSelected={isShippingSelected} 
          customerInfo={customerInfoRef.current as any}
          cartItems={cartItems}
          shippingInfo={shipToDifferentRef.current ? (shippingInfoRef.current as any) : (customerInfoRef.current as any)}
          selectedShipping={selectedShipping}
          shippingRates={shippingRates}
          appliedCoupons={appliedCoupons}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 3. GLOBAL ROUTE WRAPPERS (PRO-LEVEL SECURE FIX)
// ============================================================================
export default function CheckoutClient({ paymentGateways }: { paymentGateways: PaymentGateway[] }) {
    
    // 🛡️ 1. Find Main Stripe Gateway Key
    const stripeGateway = paymentGateways.find(g => g.identifier === 'stripe');
    const stripePublicKey = stripeGateway?.publicKey || null;

    // 🛡️ 2. Find Main PayPal Gateway Client ID
    const paypalGateway = paymentGateways.find(g => g.identifier === 'paypal');
    const paypalClientId = paypalGateway?.publicKey || null;

    // Initialize Stripe securely
    const [stripePromise] = useState(() => 
        stripePublicKey ? loadStripe(stripePublicKey) : null
    );

    // 🛡️ 3. Initialize PayPal options strictly at the root
    // It uses standard "buttons,messages" to completely avoid Stripe HMR conflicts
    const paypalOptions = useMemo(() => ({
        clientId: paypalClientId || "test",
        currency: "AUD",
        intent: "capture",
        components: "buttons,messages", 
    }), [paypalClientId]);

    const stripeOptions = {
        mode: 'payment' as const,
        amount: 100, 
        currency: 'aud',
        appearance: { theme: 'stripe' as const },
    };

    // Render logic wrapping the provider securely at the ROOT.
    // PayPalScriptProvider will NEVER unmount, stopping the "window.paypal is undefined" loop!
    const renderCheckoutTree = () => {
        if (!stripePromise) {
            return <CheckoutClientComponent paymentGateways={paymentGateways} />;
        }
        return (
            <Elements stripe={stripePromise} options={stripeOptions}>
                <CheckoutClientComponent paymentGateways={paymentGateways} />
            </Elements>
        );
    };

    // If PayPal is configured, we wrap the tree. Otherwise, we render Stripe Elements directly.
    if (paypalClientId) {
        return (
            <PayPalScriptProvider options={paypalOptions}>
                {renderCheckoutTree()}
            </PayPalScriptProvider>
        );
    }

    return renderCheckoutTree();
}