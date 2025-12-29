// File: app/actions/storefront/cart/use-cart.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "react-hot-toast";

// কার্ট আইটেমের টাইপ ডেফিনিশন
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  cartItemId: string; // Unique ID (Product ID + Variant ID)
  variantId?: string;
  selectedVariantName?: string;
  category?: {
    name: string;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (data: CartItem) => void;
  removeItem: (id: string) => void;
  removeAll: () => void;
}

const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      
      // ✅ Add Item Action
      addItem: (data: CartItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.cartItemId === data.cartItemId);

        if (existingItem) {
          // যদি আইটেমটি অলরেডি থাকে, তাহলে কোয়ান্টিটি বাড়াও
          set({
            items: currentItems.map((item) =>
              item.cartItemId === data.cartItemId
                ? { ...item, quantity: item.quantity + data.quantity }
                : item
            ),
          });
          toast.success("Item quantity updated in cart.");
        } else {
          // নতুন আইটেম হলে লিস্টে যোগ করো
          set({ items: [...get().items, data] });
          toast.success("Item added to cart.");
        }
      },

      // ✅ Remove Item Action
      removeItem: (id: string) => {
        set({ items: [...get().items.filter((item) => item.cartItemId !== id)] });
        toast.success("Item removed from cart.");
      },

      // ✅ Clear Cart Action
      removeAll: () => set({ items: [] }),
    }),
    {
      name: "cart-storage", // LocalStorage Key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCart;