import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  cartItemId: string; 
  variantId?: string;
  selectedVariantName?: string; 
  category?: { name: string }; 
}

interface CartStore {
  // Data State
  items: CartItem[];
  shippingCost: number;
  discountAmount: number;
  couponCode?: string;
  
  // UI State (Mini Cart Drawer) - এই অংশটি মিসিং ছিল তাই এরর আসছিল
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;

  // Actions
  addItem: (data: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
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
      
      // UI Logic
      isOpen: false,
      onOpen: () => set({ isOpen: true }),
      onClose: () => set({ isOpen: false }),

      addItem: (data: CartItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => 
          item.id === data.id && item.variantId === data.variantId
        );

        if (existingItem) {
          toast.error("Item already in cart.");
          return;
        }

        set({ items: [...get().items, data], isOpen: true }); // Open cart automatically
        toast.success("Item added to cart.");
      },

      removeItem: (cartItemId: string) => {
        set({ items: [...get().items.filter((item) => item.cartItemId !== cartItemId)] });
        toast.success("Item removed.");
      },

      updateQuantity: (cartItemId: string, quantity: number) => {
        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => 
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },

      incrementItem: (cartItemId: string) => {
        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => 
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
        set({ items: updatedItems });
      },

      decrementItem: (cartItemId: string) => {
        const currentItems = get().items;
        const updatedItems = currentItems.map((item) => {
          if (item.cartItemId === cartItemId) {
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