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

    // ১. যদি কুকি থাকে, তবে চেক করি ডাটাবেসে সেই কার্ট আসলেই আছে কি না
    if (cartId) {
      cart = await db.cart.findUnique({
        where: { id: cartId }
      });
      
      if (!cart) {
        console.warn("⚠️ Cookie exists but Cart not found in DB (Stale Cookie).");
      }
    }

    // ২. যদি কার্ট আইডি না থাকে অথবা ডাটাবেসে কার্ট না পাওয়া যায় -> নতুন বানাও
    if (!cartId || !cart) {
      console.log("⚙️ Creating new cart...");
      const newCart = await db.cart.create({
        data: {}, 
      });
      cartId = newCart.id;
      
      // কুকি সেট করা / আপডেট করা
      cookieStore.set("cartId", cartId, {
        maxAge: 60 * 60 * 24 * 30, // 30 Days
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true 
      });
      console.log("✅ New Cart Created & Cookie Set:", cartId);
    }

    // ৩. প্রোডাক্ট ভ্যালিডেশন
    const product = await db.product.findUnique({ 
        where: { id: productId },
        include: { variants: true } 
    });
    
    if (!product) {
        console.error("❌ Product not found:", productId);
        return { success: false, message: "Product not found" };
    }

    // ভেরিয়েন্ট ভ্যালিডেশন
    if (variantId) {
        const variantExists = product.variants.find(v => v.id === variantId);
        if (!variantExists) {
            console.error("❌ Invalid Variant:", variantId);
            return { success: false, message: "Invalid variant selected" };
        }
    }

    // ৪. কার্টে আইটেম চেক বা অ্যাড করা
    console.log("🔍 Processing Cart Item...");
    
    // FIX: variantId undefined হলে null পাঠানো, নাহলে Prisma এরর দিতে পারে
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
          cartId: cartId, // এখন আমরা নিশ্চিত যে এই cartId ভ্যালিড
          productId: productId,
          variantId: safeVariantId,
          quantity: quantity,
        },
      });
    }

    // ৫. পেজ রিফ্রেশ
    console.log("🔄 Revalidating Layout...");
    revalidatePath("/", "layout"); 

    console.log("🟢 [SUCCESS] Item added to cart\n");
    return { success: true, message: "Added to cart successfully" };

  } catch (error: any) {
    console.error("🔥 [ERROR] Add to Cart Failed:", error);
    return { success: false, message: error.message || "Failed to add item." };
  }
}