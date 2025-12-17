import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  cartItemId: string; // Unique ID
  variantId?: string;
  selectedVariantName?: string; 
  // [FIXED] Category Added
  category?: { name: string }; 
}

interface CartStore {
  items: CartItem[];
  shippingCost: number;
  discountAmount: number;
  couponCode?: string; // [FIXED] Coupon Code Added

  addItem: (data: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  // [FIXED] Increment/Decrement Added
  incrementItem: (cartItemId: string) => void;
  decrementItem: (cartItemId: string) => void;
  
  removeAll: () => void;
  setShippingCost: (cost: number) => void;
  setDiscount: (amount: number, code?: string) => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

const useCart = create(
  persist<CartStore>(
    (set, get) => ({
      items: [],
      shippingCost: 0,
      discountAmount: 0,
      couponCode: undefined,

      addItem: (data: CartItem) => {
        const currentItems = get().items;
        // Check if exact same product + variant exists
        const existingItem = currentItems.find((item) => 
          item.id === data.id && item.variantId === data.variantId
        );

        if (existingItem) {
          toast.error("Item already in cart.");
          return;
        }

        set({ items: [...get().items, data] });
        toast.success("Item added to cart.");
      },

      removeItem: (cartItemId: string) => {
        set({ items: [...get().items.filter((item) => item.cartItemId !== cartItemId)] });
        toast.success("Item removed from cart.");
      },

      updateQuantity: (cartItemId: string, quantity: number) => {
        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => 
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },

      // [FIXED] Increment Logic
      incrementItem: (cartItemId: string) => {
        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => 
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
        set({ items: updatedItems });
      },

      // [FIXED] Decrement Logic
      decrementItem: (cartItemId: string) => {
        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => {
          if (item.cartItemId === cartItemId) {
            // Prevent going below 1
            const newQuantity = item.quantity > 1 ? item.quantity - 1 : 1;
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        set({ items: updatedItems });
      },

      removeAll: () => set({ items: [], shippingCost: 0, discountAmount: 0, couponCode: undefined }),

      setShippingCost: (cost: number) => set({ shippingCost: cost }),
      
      setDiscount: (amount: number, code?: string) => set({ discountAmount: amount, couponCode: code }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const shipping = get().shippingCost;
        const discount = get().discountAmount;
        return (subtotal + shipping) - discount;
      }
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCart;