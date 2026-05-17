// File: app/actions/storefront/checkout/validate-coupon.ts

"use server";

import { db } from "@/lib/prisma";
import { z } from "zod";
const validateSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  cartId: z.string().min(1, "Cart ID is required"),
});

export async function validateCoupon(code: string, cartId: string) {
  try {
    const result = validateSchema.safeParse({ code, cartId });
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }
    const coupon = await db.discount.findUnique({
      where: { 
        code: code,
      }
    });
    if (!coupon || !coupon.isActive) {
      return { success: false, message: "Invalid or inactive coupon code." };
    }

    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) {
      return { success: false, message: "This coupon is not valid yet." };
    }
    if (coupon.endDate && coupon.endDate < now) {
      return { success: false, message: "This coupon has expired." };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, message: "This coupon has reached its usage limit." };
    }

    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: { 
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      } 
    });

    if (!cart || !cart.items.length) {
      return { success: false, message: "Cart is empty." };
    }
    const cartSubtotal = cart.items.reduce((total, item) => {
        const price = item.variant 
            ? Number(item.variant.salePrice || item.variant.price) 
            : Number(item.product.salePrice || item.product.price);
            
        return total + (price * item.quantity);
    }, 0);

    const minSpend = coupon.minSpend ? Number(coupon.minSpend) : 0;
    
    if (minSpend > 0 && cartSubtotal < minSpend) {
      return { 
        success: false, 
        message: `Minimum spend of $${minSpend.toFixed(2)} required to use this coupon.` 
      };
    }

    let discountAmount = 0;
    const couponValue = Number(coupon.value);

    if (coupon.type === "FIXED_AMOUNT") {
      discountAmount = couponValue;
    } else if (coupon.type === "PERCENTAGE") {
      discountAmount = (cartSubtotal * couponValue) / 100;
    }
    if (discountAmount > cartSubtotal) {
      discountAmount = cartSubtotal;
    }
    return {
      success: true,
      code: coupon.code,
      discountAmount: Number(discountAmount.toFixed(2)),
      type: coupon.type,
      message: "Coupon applied successfully!"
    };

  } catch (error) {
    console.error("Coupon Validation Error:", error);
    return { success: false, message: "Failed to validate coupon." };
  }
}