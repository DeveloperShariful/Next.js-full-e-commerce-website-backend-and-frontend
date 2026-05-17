// File: app/actions/storefront/checkout/validate-coupon.ts
"use server";

import { db } from "@/lib/prisma";
import { getCartCalculation } from "./get-cart-calculation";
import { cookies } from "next/headers"; 

export async function validateCoupon(code: string, cartId: string, shouldSetCookie = true) {
  try {
    if (!code) return { success: false, error: "Please enter a code" };

    // ১. কুপন চেক
    const discount = await db.discount.findUnique({
      where: { code: code.toUpperCase() }, 
    });

    if (!discount || !discount.isActive) {
      return { success: false, error: "Invalid coupon code." };
    }

    // ২. ডেট ভ্যালিডেশন
    const now = new Date();
    if (discount.startDate > now || (discount.endDate && discount.endDate < now)) {
      return { success: false, error: "Coupon expired." };
    }

    // ৩. লিমিট চেক
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { success: false, error: "Coupon usage limit reached." };
    }

    // ৪. কার্ট টোটাল চেক
    const cartData = await getCartCalculation(cartId);
    if (!cartData.success || !cartData.total) {
      return { success: false, error: "Cart error." };
    }

    if (discount.minSpend && cartData.total < Number(discount.minSpend)) {
      return { success: false, error: `Min spend $${discount.minSpend} required.` };
    }

    // ৫. ডিসকাউন্ট ক্যালকুলেশন
    let discountAmount = 0;
    if (discount.type === "PERCENTAGE") {
      discountAmount = (cartData.total * Number(discount.value)) / 100;
    } else {
      discountAmount = Number(discount.value);
    }

    if (discountAmount > cartData.total) discountAmount = cartData.total;

    if (shouldSetCookie) {
        const cookieStore = await cookies();
        cookieStore.set("coupon", discount.code, { 
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" 
        });
    }

    return {
      success: true,
      code: discount.code,
      discountAmount,
      message: "Coupon applied!"
    };

  } catch (error) {
    console.error("Coupon Validate Error:", error);
    return { success: false, error: "Validation failed." };
  }
}