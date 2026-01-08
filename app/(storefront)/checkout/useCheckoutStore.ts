// File: app/(storefront)/checkout/useCheckoutStore.ts

import { create } from "zustand";
import { getCheckoutSummary } from "@/app/actions/storefront/checkout/get-checkout-summary";

interface CheckoutState {
  // Data
  cartId: string | null;
  cart: any | null;
  user: any | null;
  settings: any | null;
  
  // State
  guestEmail: string;
  shippingAddress: any;
  billingAddress: any;
  isSameBilling: boolean;
  customerNote: string;
  
  // Selected Method
  selectedShippingMethod: { 
      id: string; 
      price: number; 
      name: string; 
      type: string;
      carrier?: string;
  } | null;
  
  selectedPaymentMethod: string | null;
  couponCode: string | null;
  
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    surcharge: number; // 🔥 NEW
    total: number;
  };

  isProcessing: boolean;

  // Actions
  initialize: (data: any) => void;
  setGuestEmail: (email: string) => void;
  setShippingAddress: (address: any) => void;
  setBillingAddress: (address: any) => void;
  toggleSameBilling: (val: boolean) => void;
  setCustomerNote: (note: string) => void;
  setShippingMethod: (method: any) => void;
  setPaymentMethod: (method: string) => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  updateTotals: () => Promise<void>;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  // --- Initial State ---
  cartId: null,
  cart: null,
  user: null,
  settings: null,

  guestEmail: "",
  shippingAddress: {},
  billingAddress: {},
  isSameBilling: true,
  customerNote: "",

  selectedShippingMethod: null,
  selectedPaymentMethod: null,
  couponCode: null,

  totals: {
    subtotal: 0,
    shipping: 0,
    tax: 0,
    discount: 0,
    surcharge: 0, // 🔥 Init
    total: 0
  },

  isProcessing: false,

  // --- Actions ---

  initialize: (data) => {
    const combinedSettings = {
        ...data.settings,
        paymentMethods: data.paymentMethods || [] 
    };

    set({
      cartId: data.cart.id,
      cart: data.cart,
      user: data.user,
      guestEmail: data.user?.email || "", 
      settings: combinedSettings,
      
      // Calculate initial subtotal
      totals: {
        subtotal: data.cart.items.reduce((acc: number, item: any) => {
             const price = item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price);
             return acc + (price * item.quantity);
        }, 0),
        shipping: 0,
        tax: 0,
        discount: 0,
        surcharge: 0,
        total: 0 
      }
    });
    
    // Trigger initial calculation
    get().updateTotals();
  },

  setGuestEmail: (email) => set({ guestEmail: email }),

  setShippingAddress: (address) => {
    const currentAddress = get().shippingAddress;
    if (JSON.stringify(currentAddress) === JSON.stringify(address)) return;

    set({ shippingAddress: address });

    if (address.country && address.postcode) {
        get().updateTotals();
    }
  },

  setBillingAddress: (address) => set({ billingAddress: address }),
  
  toggleSameBilling: (val) => set({ isSameBilling: val }),

  setCustomerNote: (note) => set({ customerNote: note }),

  setShippingMethod: (method) => {
    const currentMethod = get().selectedShippingMethod;
    if (currentMethod?.id === method.id) return;

    set({ selectedShippingMethod: method });
    get().updateTotals();
  },

  setPaymentMethod: (methodIdentifier) => {
    set({ selectedPaymentMethod: methodIdentifier });
    // মেথড চেঞ্জ হলে টোটাল রিক্যালকুলেট করতে হবে (Surcharge এর জন্য)
    get().updateTotals();
  },

  applyCoupon: async (code) => {
    set({ couponCode: code });
    await get().updateTotals();
  },

  removeCoupon: async () => {
    set({ couponCode: null });
    await get().updateTotals();
  },

  // 🔥 CORE CALCULATION LOGIC
  updateTotals: async () => {
    const { cartId, shippingAddress, selectedShippingMethod, couponCode, selectedPaymentMethod, settings } = get();
    
    if (!cartId) return;

    set({ isProcessing: true });

    try {
        const res = await getCheckoutSummary({
            cartId,
            shippingAddress: {
                country: shippingAddress.country || "AU",
                state: shippingAddress.state || "",
                postcode: shippingAddress.postcode || "",
                suburb: shippingAddress.suburb || shippingAddress.city || "" 
            },
            shippingMethodId: selectedShippingMethod?.id,
            shippingCost: selectedShippingMethod?.price,
            couponCode: couponCode || undefined
        });

        if (res.success && res.breakdown) {
            
            // 🔥 Calculate Surcharge Client-Side (Faster UI)
            let surcharge = 0;
            const currentSubtotal = res.breakdown.subtotal;
            
            if (selectedPaymentMethod && settings?.paymentMethods) {
                const methodConfig = settings.paymentMethods.find((m: any) => m.identifier === selectedPaymentMethod);
                
                if (methodConfig?.surchargeEnabled) {
                    const amount = methodConfig.surchargeAmount || 0;
                    if (methodConfig.surchargeType === "percentage") {
                        surcharge = (currentSubtotal * amount) / 100;
                    } else {
                        surcharge = amount;
                    }
                }
            }

            set({
                totals: {
                    subtotal: res.breakdown.subtotal,
                    shipping: res.breakdown.shipping,
                    tax: res.breakdown.tax,
                    discount: res.breakdown.discount,
                    surcharge: surcharge, // 🔥 Added
                    total: res.breakdown.total + surcharge // 🔥 Added to Total
                }
            });
        }
    } catch (error) {
        console.error("Failed to update totals:", error);
    } finally {
        set({ isProcessing: false });
    }
  }
}));