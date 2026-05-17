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
  clearCartAction 
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

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (item: ItemToAdd, quantity: number) => Promise<void>;
  updateQuantity: (key: string, newQuantity: number) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isMiniCartOpen: boolean;
  openMiniCart: () => void;
  closeMiniCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  const fetchInitialCart = useCallback(async () => {
    setLoading(true);
    try {
        const response = await getCartAction();
        if (response.success && response.items) {
            setCartItems(response.items);
        } else {
            setCartItems([]);
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

  // --- 🚀 INSTANT TOAST Action: Add to Cart ---
  const addToCart = async (itemToAdd: ItemToAdd, quantity: number) => {
    // 1. Instant Toast Generation (স্ক্রিন ব্লক করবে না)
    const toastId = toast.loading("Adding to cart...");
    const previousItems = [...cartItems];

    // 2. Optimistic UI Update
    setCartItems(prev => {
      const existing = prev.find(i => i.id === itemToAdd.id);
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, {
        id: itemToAdd.id,
        databaseId: itemToAdd.databaseId,
        name: itemToAdd.name,
        slug: itemToAdd.slug,
        price: itemToAdd.price || "$0.00",
        image: itemToAdd.image,
        quantity: quantity,
        key: `temp-${Date.now()}`, 
        attributes: []
      }];
    });

    openMiniCart();

    // 3. Background Database Process
    try {
      const response = await addToCartAction(itemToAdd.id, quantity, itemToAdd.variationId);
      
      // Stock Out বা অন্য কোনো এরর হলে
      if (!response.success || !response.items) {
        throw new Error(response.error || "Action failed");
      }

      setCartItems(response.items);
      
      // 4. Update the toast to SUCCESS
      toast.success(`"${itemToAdd.name}" added to cart!`, { id: toastId });

      // Tracking Logic 
      const priceNum = parseFloat((itemToAdd.price || '0').replace(/[^0-9.]/g, ''));
      const trackingId = itemToAdd.variationId || itemToAdd.databaseId;

      gtmAddToCart({ item_name: itemToAdd.name, item_id: trackingId, price: priceNum, quantity });
      
      const klaviyoItems: KlaviyoItem[] = response.items.map((item: CartItem) => {
          const itemPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
          return {
            ProductID: item.databaseId,
            ProductName: item.name,
            Quantity: item.quantity,
            ItemPrice: itemPrice,
            RowTotal: itemPrice * item.quantity,
            ProductURL: `${window.location.origin}/product/${item.slug}`,
            ImageURL: item.image || ''
          };
      });

      const addedKlaviyoItem = klaviyoItems.find(item => item.ProductID === trackingId || item.ProductID === itemToAdd.databaseId);
      if (addedKlaviyoItem) {
          klaviyoTrackAddedToCart({
              total_price: klaviyoItems.reduce((acc, item) => acc + item.RowTotal, 0),
              item_count: klaviyoItems.reduce((acc, item) => acc + item.Quantity, 0),
              items: klaviyoItems,
              added_item: addedKlaviyoItem
          });
      }

    } catch (error: unknown) {
      // 5. Update the toast to ERROR (Revert UI)
      setCartItems(previousItems);
      const errorMessage = error instanceof Error ? error.message : "Could not add item.";
      toast.error(errorMessage, { id: toastId });
    }
  };

  // --- 🚀 INSTANT TOAST Action: Update Quantity ---
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

  // --- 🚀 INSTANT TOAST Action: Remove Item ---
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
    
    const toastId = toast.loading("Clearing cart...");
    const previousItems = [...cartItems];
    
    setCartItems([]);

    try {
      const response = await clearCartAction();
      if (!response.success) throw new Error(response.error || "Clear failed");
      toast.success("Cart cleared.", { id: toastId });
    } catch (error: unknown) {
      setCartItems(previousItems);
      toast.error("Could not clear the cart.", { id: toastId });
    }
  };

  const value = { cartItems, loading, addToCart, updateQuantity, removeFromCart, clearCart, isMiniCartOpen, openMiniCart, closeMiniCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) { throw new Error('useCart must be used within a CartProvider'); }
  return context;
}