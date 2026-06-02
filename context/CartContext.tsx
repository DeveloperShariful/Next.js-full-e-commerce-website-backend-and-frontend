// context/CartContext.tsx

"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { gtmAddToCart, gtmRemoveFromCart } from '../lib/gtm';
import { klaviyoTrackAddedToCart } from '../lib/klaviyo';
import { 
  getCartAction, 
  addToCartAction, 
  updateCartItemQuantityAction, 
  removeFromCartAction, 
  clearCartAction,
  applyCouponAction,   // ✅ NEW: Import new action
  removeCouponAction   // ✅ NEW: Import new action
} from '@/app/actions/frontend/cart/cartActions';

export interface CartItemAttribute {
    id: string;
    label: string;
    value: string;
    name: string;
}

export interface CartItem {
  id: string; 
  databaseId: number; 
  name: string;
  slug: string;
  price: string;
  image?: string | null;
  quantity: number;
  key: string; 
  total?: string;
  weight?: number;
  isPreOrder?: boolean;
  isVirtual?: boolean;
  taxStatus?: string;
  shippingClassId?: string | null;
  attributes: CartItemAttribute[];
}

export interface ItemToAdd {
    id: string; 
    databaseId: number; 
    variationId?: string; 
    name: string;
    price?: string | null;
    image?: string | null;
    slug: string;
}

interface KlaviyoItem {
    ProductID: number | string;
    ProductName: string;
    Quantity: number;
    ItemPrice: number;
    RowTotal: number;
    ProductURL: string;
    ImageURL: string;
}

export interface AppliedCoupon {
    code: string;
    amount: number;
}

interface CartContextType {
  cartItems: CartItem[];
  appliedCoupons: AppliedCoupon[]; 
  loading: boolean;
  addToCart: (item: ItemToAdd, quantity: number) => Promise<void>;
  updateQuantity: (key: string, newQuantity: number) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: (code: string) => Promise<void>;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  const fetchInitialCart = useCallback(async () => {
    setLoading(true);
    try {
        const response = await getCartAction();
        if (response.success && response.items) {
            setCartItems(response.items);
            if (response.appliedCoupons) {
                setAppliedCoupons(response.appliedCoupons);
            }
        } else {
            setCartItems([]);
            setAppliedCoupons([]);
        }
    } catch (error) { 
        console.error("Failed to fetch initial cart", error); 
    } finally { 
        setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchInitialCart();
  }, [fetchInitialCart]);

  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);

  // --- 🚀 Add to Cart ---
  const addToCart = async (itemToAdd: ItemToAdd, quantity: number) => {
    const toastId = toast.loading("Adding to cart...");
    const previousItems = [...cartItems];

    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemToAdd.id);
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        id: itemToAdd.id, databaseId: itemToAdd.databaseId, name: itemToAdd.name, slug: itemToAdd.slug,
        price: itemToAdd.price || "$0.00", image: itemToAdd.image, quantity: quantity,
        key: `temp-${Date.now()}`, attributes: []
      }];
    });

    openMiniCart();

    try {
      const response = await addToCartAction(itemToAdd.id, quantity, itemToAdd.variationId);
      if (!response.success || !response.items) throw new Error(response.error || "Action failed");

      setCartItems(response.items);
      toast.success(`"${itemToAdd.name}" added to cart!`, { id: toastId });

      const priceNum = parseFloat((itemToAdd.price || '0').replace(/[^0-9.]/g, ''));
      const trackingId = itemToAdd.variationId || itemToAdd.databaseId;

      gtmAddToCart({ item_name: itemToAdd.name, item_id: trackingId, price: priceNum, quantity });
      
      const klaviyoItems: KlaviyoItem[] = response.items.map((item: CartItem) => {
          const itemPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
          return {
            ProductID: item.databaseId, ProductName: item.name, Quantity: item.quantity,
            ItemPrice: itemPrice, RowTotal: itemPrice * item.quantity,
            ProductURL: `${window.location.origin}/product/${item.slug}`, ImageURL: item.image || ''
          };
      });

      const addedKlaviyoItem = klaviyoItems.find(item => item.ProductID === trackingId || item.ProductID === itemToAdd.databaseId);
      if (addedKlaviyoItem) {
          klaviyoTrackAddedToCart({
              total_price: klaviyoItems.reduce((acc, item) => acc + item.RowTotal, 0),
              item_count: klaviyoItems.reduce((acc, item) => acc + item.Quantity, 0),
              items: klaviyoItems, added_item: addedKlaviyoItem
          });
      }
    } catch (error: unknown) {
      setCartItems(previousItems);
      const errorMessage = error instanceof Error ? error.message : "Could not add item.";
      toast.error(errorMessage, { id: toastId });
    }
  };

  // --- 🚀 Update Quantity ---
  const updateQuantity = async (key: string, newQuantity: number) => {
    if (newQuantity < 1) { await removeFromCart(key); return; }
    
    const toastId = toast.loading("Updating quantity...");
    const previousItems = [...cartItems];
    
    setCartItems(prev => prev.map(i => i.key === key ? { ...i, quantity: newQuantity } : i));

    try {
        const response = await updateCartItemQuantityAction(key, newQuantity);
        if (!response.success || !response.items) throw new Error(response.error || "Update failed");
        setCartItems(response.items);
        toast.success("Cart updated!", { id: toastId });
    } catch (error: unknown) {
        setCartItems(previousItems);
        const errorMessage = error instanceof Error ? error.message : "Could not update quantity.";
        toast.error(errorMessage, { id: toastId });
    }
  };

  // --- 🚀 Remove Item ---
  const removeFromCart = async (key: string) => {
    const itemToRemove = cartItems.find(item => item.key === key);
    if (!itemToRemove) return;

    const toastId = toast.loading("Removing item...");
    const previousItems = [...cartItems];
    
    setCartItems(prev => prev.filter(i => i.key !== key));

    try {
      const response = await removeFromCartAction(key);
      if (!response.success || !response.items) throw new Error(response.error || "Remove failed");
      
      setCartItems(response.items);
      toast.success("Removed from cart.", { id: toastId });

      const priceNum = parseFloat(itemToRemove.price?.replace(/[^0-9.]/g, '') || '0');
      gtmRemoveFromCart({ item_name: itemToRemove.name, item_id: itemToRemove.databaseId, price: priceNum, quantity: itemToRemove.quantity });
    } catch (error: unknown) { 
      setCartItems(previousItems);
      toast.error("Could not remove item.", { id: toastId });
    }
  };

  // --- Action: Clear Cart ---
  const clearCart = async () => { 
    if (cartItems.length === 0) return; 
    
    const previousItems = [...cartItems];
    const previousCoupons = [...appliedCoupons];
    
    setCartItems([]);
    setAppliedCoupons([]); 

    try {
      const response = await clearCartAction();
      if (!response.success) throw new Error(response.error || "Clear failed");
    } catch (error: unknown) {
      setCartItems(previousItems);
      setAppliedCoupons(previousCoupons);
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    if (!code || code.trim() === "") {
        toast.error("Please enter a coupon code.");
        return false;
    }

    if (appliedCoupons.length > 0) {
      toast.error("Only one coupon can be applied at a time.");
      return false;
    }
    
    try {
      // আসল ব্যাকএন্ড ডাটাবেজ একশন কল করা হচ্ছে
      const response = await applyCouponAction(code);
      
      if (response.success && response.appliedCoupons) {
        setAppliedCoupons(response.appliedCoupons);
        return true; // সাকসেস মেসেজ CheckoutClient থেকে দেখাবে
      } else {
        toast.error(response.error || "Invalid coupon code.");
        return false;
      }
    } catch (error) {
      toast.error("Failed to verify coupon. Please try again.");
      return false;
    }
  };

  // --- ✅ Action: Remove Coupon ---
  const removeCoupon = async (code: string) => {
    const toastId = toast.loading("Removing coupon...");
    try {
      const response = await removeCouponAction(code);
      if (response.success && response.appliedCoupons) {
        setAppliedCoupons(response.appliedCoupons);
        toast.success("Coupon removed.", { id: toastId });
      } else {
        throw new Error(response.error || "Failed to remove coupon.");
      }
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  const value = { 
    cartItems, appliedCoupons, loading, addToCart, updateQuantity, 
    removeFromCart, clearCart, applyCoupon, removeCoupon, 
    isMiniCartOpen, openMiniCart, closeMiniCart 
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) { throw new Error('useCart must be used within a CartProvider'); }
  return context;
}