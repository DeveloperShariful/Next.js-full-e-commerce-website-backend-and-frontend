// File: app/actions/storefront/product/add-to-cart.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

interface AddToCartParams {
  productId: string;
  quantity: number;
  variantId?: string;
}

export async function addToCart({ productId, quantity, variantId }: AddToCartParams) {
  console.log("\n🟡 [ACTION] Add To Cart Started...");
  
  try {
    const cookieStore = await cookies();
    let cartId = cookieStore.get("cartId")?.value;
    let cart = null;

    console.log("🍪 Checking Cookie Cart ID:", cartId || "None");
    if (cartId) {
      cart = await db.cart.findUnique({
        where: { id: cartId }
      });
      
      if (!cart) {
        console.warn("⚠️ Cookie exists but Cart not found in DB (Stale Cookie).");
      }
    }

    if (!cartId || !cart) {
      console.log("⚙️ Creating new cart...");
      const newCart = await db.cart.create({
        data: {}, 
      });
      cartId = newCart.id;

      cookieStore.set("cartId", cartId, {
        maxAge: 60 * 60 * 24 * 30, 
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true 
      });
      console.log("✅ New Cart Created & Cookie Set:", cartId);
    }

    const product = await db.product.findUnique({ 
        where: { id: productId },
        include: { variants: true } 
    });
    
    if (!product) {
        console.error("❌ Product not found:", productId);
        return { success: false, message: "Product not found" };
    }


    if (variantId) {
        const variantExists = product.variants.find(v => v.id === variantId);
        if (!variantExists) {
            console.error("❌ Invalid Variant:", variantId);
            return { success: false, message: "Invalid variant selected" };
        }
    }

    console.log("🔍 Processing Cart Item...");
  
    const safeVariantId = variantId || null;
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cartId,
        productId: productId,
        variantId: safeVariantId, 
      },
    });

    if (existingItem) {
      console.log("🔄 Updating existing item quantity...");
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      console.log("➕ Creating new cart item...");
      await db.cartItem.create({
        data: {
          cartId: cartId, 
          productId: productId,
          variantId: safeVariantId,
          quantity: quantity,
        },
      });
    }

    console.log("🔄 Revalidating Layout...");
    revalidatePath("/", "layout"); 

    console.log("🟢 [SUCCESS] Item added to cart\n");
    return { success: true, message: "Added to cart successfully" };

  } catch (error: any) {
    console.error("🔥 [ERROR] Add to Cart Failed:", error);
    return { success: false, message: error.message || "Failed to add item." };
  }
}