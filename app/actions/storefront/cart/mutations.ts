"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// --- ADD TO CART ---
export async function addToCart(productId: string, variantId: string | null, quantity: number) {
  try {
    // ✅ FIX: Added 'await' because cookies() is a Promise in Next.js 15
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("cart_session")?.value;

    // 1. Session ID না থাকলে নতুন বানাও
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookieStore.set("cart_session", sessionId, { 
        secure: process.env.NODE_ENV === "production", 
        httpOnly: true, 
        sameSite: "lax", 
        path: '/', 
        maxAge: 60 * 60 * 24 * 30 // 30 Days
      });
    }

    // 2. Cart খোঁজো বা বানাও
    let cart = await db.cart.findFirst({ 
      where: { sessionId } 
    });

    if (!cart) {
      cart = await db.cart.create({ 
        data: { sessionId } 
      });
    }

    // 3. Item Check
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      // ⚠️ FIX: আগে থাকলে Error দিব না, Quantity বাড়িয়ে দিব
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // নতুন অ্যাড করো
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        },
      });
    }

    revalidatePath("/cart");
    return { success: true, message: "Added to cart" };
  } catch (error) {
    console.error("ADD_TO_CART_ERROR", error);
    return { success: false, error: "Failed to add item" };
  }
}

// --- UPDATE QUANTITY ---
export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    if (quantity <= 0) {
      await db.cartItem.delete({ where: { id: itemId } });
    } else {
      await db.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update quantity" };
  }
}

// --- REMOVE ITEM ---
export async function removeFromCart(itemId: string) {
  try {
    await db.cartItem.delete({ where: { id: itemId } });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove item" };
  }
}