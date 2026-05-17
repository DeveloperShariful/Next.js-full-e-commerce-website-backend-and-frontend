// app/actions/storefront/cart/cartActions.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth"; 

export interface CartActionResponse {
  success: boolean;
  items?: any[]; 
  error?: string;
}

// ============================================================================
// 1. SESSION & USER MANAGEMENT (CART MERGING)
// ============================================================================
async function getCartSessionAndUser() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get("cart_session")?.value;
  const session = await auth();
  const userId = session?.user?.id;

  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set("cart_session", sessionId, { maxAge: 60 * 60 * 24 * 30, httpOnly: true });
  }

  let cart = await db.cart.findFirst({
    where: userId ? { userId } : { sessionId }
  });

  if (userId) {
    const guestCart = await db.cart.findFirst({ where: { sessionId, userId: null } });
    if (guestCart) {
      if (cart) {
        const guestItems = await db.cartItem.findMany({ where: { cartId: guestCart.id } });
        for (const item of guestItems) {
          const exist = await db.cartItem.findFirst({
            where: { cartId: cart.id, productId: item.productId, variantId: item.variantId }
          });
          if (exist) {
            await db.cartItem.update({
              where: { id: exist.id },
              data: { quantity: exist.quantity + item.quantity }
            });
          } else {
            await db.cartItem.create({
              data: { cartId: cart.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity }
            });
          }
        }
        await db.cart.delete({ where: { id: guestCart.id } });
      } else {
        cart = await db.cart.update({
          where: { id: guestCart.id },
          data: { userId }
        });
      }
    }
  }

  if (!cart) {
    cart = await db.cart.create({
      data: { sessionId, userId: userId || null }
    });
  }

  return { cart, sessionId, userId };
}

// ============================================================================
// 2. INVENTORY RESERVATION & STOCK VALIDATION (FLASH SALE LOGIC)
// ============================================================================
async function validateStockAndReserve(cartId: string, productId: string, variantId: string | null, requestedQuantity: number) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { valid: false, error: "Product not found." };
  if (product.status !== "ACTIVE") return { valid: false, error: "This product is currently unavailable." };

  let trackQuantity = product.trackQuantity;
  let stock = product.stock;
  let backorderStatus = product.backorderStatus; 

  if (variantId) {
    const variant = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) return { valid: false, error: "Product variant not found." };
    trackQuantity = variant.trackQuantity;
    stock = variant.stock;
  }

  if (trackQuantity && backorderStatus === "DO_NOT_ALLOW") {
    const activeReservations = await db.inventoryReservation.aggregate({
      where: {
        productId,
        variantId,
        expiresAt: { gt: new Date() }, 
        cartId: { not: cartId } 
      },
      _sum: { quantity: true }
    });

    const reservedStock = activeReservations._sum.quantity || 0;
    const availableStock = stock - reservedStock;

    if (requestedQuantity > availableStock) {
      if (availableStock <= 0) {
        return { valid: false, error: "Sorry, this item is currently out of stock or reserved by others." };
      } else {
        return { valid: false, error: `Only ${availableStock} item(s) left in stock!` };
      }
    }
  }

  const defaultLocation = await db.location.findFirst({ where: { isActive: true } });
  if (defaultLocation) {
    await db.inventoryReservation.deleteMany({
      where: { cartId, productId, variantId }
    });
    await db.inventoryReservation.create({
      data: {
        cartId,
        productId,
        variantId,
        locationId: defaultLocation.id,
        quantity: requestedQuantity,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) 
      }
    });
  }

  return { valid: true };
}

// ============================================================================
// 3. UI POSITION FIXER & ADVANCED DATA FORMATTER (DECIMAL FIX)
// ============================================================================
async function getFormattedCartItems(cartId: string) {
  await db.inventoryReservation.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });

  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { id: 'asc' }, 
        include: {
          product: { 
            include: { attributes: true } 
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) return [];

  return cart.items.map((item) => {
    const isVariant = !!item.variant;
    const priceNum = isVariant ? Number(item.variant!.price) : Number(item.product.price);
    const totalNum = priceNum * item.quantity;

    const formatPrice = (amount: number) =>
      new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(amount);

    // ★ Decimal Fix: Prisma Decimal কে Number এ কনভার্ট করা হয়েছে
    const rawWeight = isVariant ? item.variant?.weight : item.product.weight;
    const weightNum = rawWeight ? Number(rawWeight.toString()) : 0;

    return {
      id: item.product.id,
      databaseId: item.product.productCode,
      name: isVariant ? `${item.product.name} - ${item.variant!.name}` : item.product.name,
      slug: item.product.slug,
      price: formatPrice(priceNum),
      image: isVariant && item.variant!.image ? item.variant!.image : item.product.featuredImage,
      quantity: item.quantity,
      key: item.id, 
      total: formatPrice(totalNum),
      
      // Advanced Data for Checkout (All Serializable)
      weight: weightNum,
      isPreOrder: isVariant ? item.variant!.isPreOrder : item.product.isPreOrder,
      isVirtual: item.product.isVirtual,
      taxStatus: item.product.taxStatus,
      shippingClassId: item.product.shippingClassId || null,

      attributes: item.product.attributes.map((attr) => ({
        id: attr.id,
        name: attr.name,
        label: attr.name,
        value: attr.values.join(", "),
      })),
    };
  });
}

// ============================================================================
// 4. MAIN EXPORTED ACTIONS
// ============================================================================
export async function getCartAction(): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    const items = await getFormattedCartItems(cart.id);
    return { success: true, items };
  } catch (error) {
    console.error("[getCartAction] Error:", error);
    return { success: false, items: [], error: "Failed to fetch cart. Please try again." };
  }
}

export async function addToCartAction(productId: string, quantity: number, variantId?: string): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();

    const existingItem = await db.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null },
    });

    const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    
    // ★ Real-time Stock Check
    const stockCheck = await validateStockAndReserve(cart.id, productId, variantId || null, newQuantity);
    if (!stockCheck.valid) {
      return { success: false, error: stockCheck.error }; 
    }

    if (existingItem) {
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await db.cartItem.create({
        data: { cartId: cart.id, productId, variantId: variantId || null, quantity: newQuantity },
      });
    }

    const items = await getFormattedCartItems(cart.id);
    return { success: true, items };
  } catch (error) {
    console.error("[addToCartAction] Error:", error);
    return { success: false, error: "An unexpected error occurred while adding to cart." };
  }
}

export async function updateCartItemQuantityAction(cartItemId: string, quantity: number): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    
    const cartItem = await db.cartItem.findUnique({ where: { id: cartItemId } });
    if (!cartItem) return { success: false, error: "Cart item not found." };

    const stockCheck = await validateStockAndReserve(cart.id, cartItem.productId, cartItem.variantId, quantity);
    if (!stockCheck.valid) {
      return { success: false, error: stockCheck.error };
    }

    await db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
    
    const items = await getFormattedCartItems(cart.id);
    return { success: true, items };
  } catch (error) {
    console.error("[updateCartItemQuantityAction] Error:", error);
    return { success: false, error: "Failed to update quantity." };
  }
}

export async function removeFromCartAction(cartItemId: string): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    
    const cartItem = await db.cartItem.findUnique({ where: { id: cartItemId } });
    if (cartItem) {
      await db.inventoryReservation.deleteMany({
        where: { cartId: cart.id, productId: cartItem.productId, variantId: cartItem.variantId }
      });
      await db.cartItem.delete({ where: { id: cartItemId } });
    }
    
    const items = await getFormattedCartItems(cart.id);
    return { success: true, items };
  } catch (error) {
    console.error("[removeFromCartAction] Error:", error);
    return { success: false, error: "Failed to remove item." };
  }
}

export async function clearCartAction(): Promise<CartActionResponse> {
  try {
    const { cart } = await getCartSessionAndUser();
    await db.inventoryReservation.deleteMany({ where: { cartId: cart.id } });
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    
    return { success: true, items: [] };
  } catch (error) {
    console.error("[clearCartAction] Error:", error);
    return { success: false, error: "Failed to clear cart." };
  }
}