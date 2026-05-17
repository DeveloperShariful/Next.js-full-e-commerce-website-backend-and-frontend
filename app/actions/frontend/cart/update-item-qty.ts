// File: app/actions/storefront/cart/update-item-qty.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateItemQuantity(itemId: string, newQuantity: number) {
  try {
    if (newQuantity < 1) {
      return { success: false, message: "Quantity must be at least 1" };
    }

    // ১. আইটেমটি এবং তার স্টক খুঁজে বের করা
    const item = await db.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: { select: { stock: true, trackQuantity: true } },
        variant: { select: { stock: true, trackQuantity: true } }
      }
    });

    if (!item) {
      return { success: false, message: "Item not found" };
    }

    // ২. স্টক ভ্যালিডেশন
    // ভেরিয়েন্ট থাকলে ভেরিয়েন্টের স্টক চেক হবে, না হলে প্রোডাক্টের
    const stockAvailable = item.variantId 
      ? item.variant?.stock 
      : item.product.stock;

    const shouldTrack = item.variantId 
      ? item.variant?.trackQuantity 
      : item.product.trackQuantity;

    if (shouldTrack && stockAvailable !== undefined && newQuantity > stockAvailable) {
      return { 
        success: false, 
        message: `Sorry, only ${stockAvailable} items available in stock.` 
      };
    }

    // ৩. আপডেট করা
    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity: newQuantity }
    });

    // ৪. UI রিফ্রেশ
    revalidatePath("/cart");
    revalidatePath("/checkout"); // চেকআউটের টোটালও যেন আপডেট হয়

    return { success: true, message: "Cart updated" };

  } catch (error) {
    console.error("Update Qty Error:", error);
    return { success: false, message: "Failed to update quantity" };
  }
}