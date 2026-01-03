// File: app/(storefront)/checkout/_store/useCheckoutStore.ts

import { create } from "zustand";
import { getCheckoutSummary } from "@/app/actions/storefront/checkout/get-checkout-summary";

interface CheckoutState {
  // Data
  cartId: string | null;
  cart: any | null;
  user: any | null;
  settings: any | null;
  
  // State
  shippingAddress: any;
  billingAddress: any;
  isSameBilling: boolean;
  customerNote: string; // ✅ New: Order Notes
  
  selectedShippingMethod: { id: string; price: number; name: string; type: string } | null;
  
  selectedPaymentMethod: string | null;
  couponCode: string | null;
  
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
    total: number;
  };

  isProcessing: boolean;

  // Actions
  initialize: (data: any) => void;
  setShippingAddress: (address: any) => void;
  setBillingAddress: (address: any) => void;
  toggleSameBilling: (val: boolean) => void;
  setCustomerNote: (note: string) => void; // ✅ New
  setShippingMethod: (method: any) => void;
  setPaymentMethod: (method: string) => void;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  updateTotals: () => Promise<void>;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  cartId: null,
  cart: null,
  user: null,
  settings: null,

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
    total: 0
  },

  isProcessing: false,

  initialize: (data) => {
    // 🔥 FIX: Payment Methods কে সেটিংসের ভেতর মার্জ করা হচ্ছে
    const combinedSettings = {
        ...data.settings,
        paymentMethods: data.paymentMethods || [] 
    };

    set({
      cartId: data.cart.id,
      cart: data.cart,
      user: data.user,
      settings: combinedSettings,
      
      // কার্টের সাবটোটাল ইনিশিয়াল ক্যালকুলেশন
      totals: {
        subtotal: data.cart.items.reduce((acc: number, item: any) => {
             const price = item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price);
             return acc + (price * item.quantity);
        }, 0),
        shipping: 0,
        tax: 0,
        discount: 0,
        total: 0 // updateTotals() এটি ঠিক করবে
      }
    });
    
    // ইনিশিয়াল ডাটা লোড হওয়ার পর ক্যালকুলেশন কল
    get().updateTotals();
  },

  setShippingAddress: (address) => {
    set({ shippingAddress: address });
    // কান্ট্রি বা পোস্টকোড চেঞ্জ হলে টোটাল আপডেট হবে
    if (address.country && address.postcode) {
        get().updateTotals();
    }
  },

  setBillingAddress: (address) => set({ billingAddress: address }),
  
  toggleSameBilling: (val) => set({ isSameBilling: val }),

  setCustomerNote: (note) => set({ customerNote: note }),

  setShippingMethod: (method) => {
    set({ selectedShippingMethod: method });
    get().updateTotals();
  },

  setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

  applyCoupon: async (code) => {
    set({ couponCode: code });
    await get().updateTotals();
  },

  removeCoupon: async () => {
    set({ couponCode: null });
    await get().updateTotals();
  },

  // 🔥 Server-Side Calculation Logic
  updateTotals: async () => {
    const { cartId, shippingAddress, selectedShippingMethod, couponCode } = get();
    
    if (!cartId) return;

    set({ isProcessing: true });

    const res = await getCheckoutSummary({
        cartId,
        shippingAddress: {
            country: shippingAddress.country || "AU",
            state: shippingAddress.state || "",
            postcode: shippingAddress.postcode || "",
            suburb: shippingAddress.suburb || ""
        },
        shippingMethodId: selectedShippingMethod?.id,
        couponCode: couponCode || undefined
    });

    if (res.success && res.breakdown) {
        set({
            totals: {
                subtotal: res.breakdown.subtotal,
                shipping: res.breakdown.shipping,
                tax: res.breakdown.tax,
                discount: res.breakdown.discount,
                total: res.breakdown.total
            }
        });
    }

    set({ isProcessing: false });
  }
}));