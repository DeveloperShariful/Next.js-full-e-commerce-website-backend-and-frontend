// File: app/actions/storefront/cart/get-cart-details.ts
"use server";

import { db } from "@/lib/prisma";
import { cookies } from "next/headers";
import { validateCoupon } from "./validate-coupon"; 

export async function getCartDetails(cartId: string | undefined) {
  try {
    if (!cartId) {
        return { success: false, message: "No cart ID found", data: null, appliedCoupon: null };
    }

    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          orderBy: { id: "asc" }, 
          include: {
            product: {
              select: {
                id: true, name: true, slug: true, price: true, salePrice: true,
                featuredImage: true, stock: true, 
                images: { take: 1, select: { url: true } }
              }
            },
            variant: {
              select: {
                id: true, name: true, price: true, salePrice: true,
                image: true, stock: true, sku: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
        return { success: false, message: "Cart not found", data: null, appliedCoupon: null };
    }

    // --- COUPON LOGIC (Safe Mode) ---
    const cookieStore = await cookies();
    const savedCoupon = cookieStore.get("coupon")?.value;
    let appliedCoupon = null;

    if (savedCoupon) {
        try {
            // 🔥 UPDATE: এখানে আমরা 'false' পাঠাচ্ছি।
            // এর মানে হলো: "ভ্যালিডেট করো, কিন্তু কুকি সেট করতে যেও না।"
            // এটি পেজ রিফ্রেশের সময় কুকি এরর আটকাতে সাহায্য করবে।
            const res = await validateCoupon(savedCoupon, cart.id, false);

            if (res.success) {
                appliedCoupon = {
                    code: res.code,
                    amount: res.discountAmount
                };
            } 
        } catch (e) {
            console.error("Coupon Validation Error:", e);
        }
    }

    return { success: true, data: cart, appliedCoupon };

  } catch (error) {
    console.error("Get Cart Error:", error);
    return { success: false, message: "Failed to fetch cart details", data: null, appliedCoupon: null };
  }
}