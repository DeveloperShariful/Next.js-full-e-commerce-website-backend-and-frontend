// hooks/use-cart.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { Product, Category, ProductImage } from '@prisma/client';

export type SafeProduct = Product & {
  category: Category | null;
  images: ProductImage[];
};

export interface CartItem extends SafeProduct {
  cartItemId: string; 
  selectedVariantId?: string;
  selectedVariantName?: string;
  quantity: number;
  price: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean; // ✅ New: Cart Open State

  // Financials
  shippingCost: number;
  discountAmount: number;
  couponCode: string | null;

  // Actions
  onOpen: () => void; // ✅ New
  onClose: () => void; // ✅ New
  addItem: (data: SafeProduct, variant?: any) => void;
  removeItem: (cartItemId: string) => void;
  incrementItem: (cartItemId: string) => void;
  decrementItem: (cartItemId: string) => void;
  setShippingCost: (cost: number) => void;
  applyCoupon: (code: string, amount: number) => void;
  removeCoupon: () => void;
  removeAll: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      isOpen: false, // Default closed
      shippingCost: 0,
      discountAmount: 0,
      couponCode: null,

      onOpen: () => set({ isOpen: true }),
      onClose: () => set({ isOpen: false }),

      addItem: (data, variant) => {
        const currentItems = get().items;
        const cartItemId = variant ? `${data.id}-${variant.id}` : data.id;
        const existingItem = currentItems.find((item) => item.cartItemId === cartItemId);

        if (existingItem) {
          const updatedItems = currentItems.map((item) => 
            item.cartItemId === cartItemId 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
          // ✅ Open cart immediately
          set({ items: updatedItems, isOpen: true });
          toast.success("Quantity updated in cart.");
          return;
        }

        const activePrice = variant ? variant.price : (data.salePrice || data.price);
        const displayImage = variant?.image || data.featuredImage || (data.images && data.images.length > 0 ? data.images[0].url : "");

        set({ 
            items: [...get().items, { 
                ...data, 
                cartItemId,
                selectedVariantId: variant?.id,
                selectedVariantName: variant?.name,
                quantity: 1,
                price: Number(activePrice),
                image: displayImage,
            }],
            isOpen: true // ✅ Open cart automatically
        });
        
        toast.success("Added to cart");
      },

      removeItem: (id: string) => {
        set({ items: [...get().items.filter((item) => item.cartItemId !== id)] });
        toast.success("Removed from cart");
      },

      incrementItem: (id: string) => {
        const updatedItems = get().items.map((item) => {
          if (item.cartItemId === id) return { ...item, quantity: item.quantity + 1 };
          return item;
        });
        set({ items: updatedItems });
      },

      decrementItem: (id: string) => {
        const updatedItems = get().items.map((item) => {
          if (item.cartItemId === id && item.quantity > 1) return { ...item, quantity: item.quantity - 1 };
          return item;
        });
        set({ items: updatedItems });
      },

      setShippingCost: (cost: number) => set({ shippingCost: cost }),

      applyCoupon: (code: string, amount: number) => {
        set({ couponCode: code, discountAmount: amount });
        toast.success(`Coupon ${code} applied!`);
      },

      removeCoupon: () => {
        set({ couponCode: null, discountAmount: 0 });
        toast.success("Coupon removed");
      },

      removeAll: () => set({ items: [], shippingCost: 0, discountAmount: 0, couponCode: null }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getTotal: () => {
        return Math.max(0, get().getSubtotal() + get().shippingCost - get().discountAmount);
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount
      }) as any, 
    }
  )
);

export default useCart;