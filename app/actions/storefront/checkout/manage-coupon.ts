// File: app/actions/storefront/checkout/manage-coupon.ts
"use server";

import { db } from "@/lib/prisma";
// ❌ এই লাইনটি বাদ দিয়েছি, কারণ আমরা এখানেই ক্যালকুলেশন করব
// import { getCartCalculation } from "./get-checkout-summary"; 
import { cookies } from "next/headers"; 
import { currentUser } from "@clerk/nextjs/server"; 

export async function validateCoupon(code: string, cartId: string, shouldSetCookie = true) {
  try {
    if (!code) return { success: false, error: "Please enter a code" };

    // ১. ইউজার ইনফো নেওয়া
    const user = await currentUser();
    let dbUserId = null;
    if (user) {
        const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });
        dbUserId = dbUser?.id;
    }

    // ২. কুপন ফেচ করা
    const discount = await db.discount.findUnique({
      where: { code: code.toUpperCase(), isActive: true }, 
    });

    if (!discount) {
      return { success: false, error: "Invalid coupon code." };
    }

    // ৩. ডেট ভ্যালিডেশন
    const now = new Date();
    if (discount.startDate > now || (discount.endDate && discount.endDate < now)) {
      return { success: false, error: "Coupon expired." };
    }

    // ৪. গ্লোবাল ইউসেজ লিমিট চেক
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { success: false, error: "Coupon usage limit reached." };
    }

    // ৫. ইউজার স্পেসিফিক ইউসেজ চেক
    if (discount.usagePerUser && dbUserId) {
        const userUsageCount = await db.order.count({
            where: {
                userId: dbUserId,
                discountId: discount.id
            }
        });

        if (userUsageCount >= discount.usagePerUser) {
            return { success: false, error: "You have already used this coupon." };
        }
    }

    // ✅ ৬. কার্ট ডাটা আনা (সরাসরি DB থেকে)
    const cart = await db.cart.findUnique({
        where: { id: cartId },
        include: { 
            items: { 
                include: { 
                    product: { select: { price: true, salePrice: true, taxStatus: true, categoryId: true } }, 
                    variant: { select: { price: true, salePrice: true } } 
                } 
            } 
        }
    });

    if (!cart || !cart.items.length) {
      return { success: false, error: "Cart is empty." };
    }

    // কার্ট টোটাল ক্যালকুলেশন
    let cartTotal = 0;
    cart.items.forEach((item) => {
        const price = item.variant 
            ? (item.variant.salePrice || item.variant.price) 
            : (item.product.salePrice || item.product.price);
        
        cartTotal += (price * item.quantity);
    });

    // ৭. Exclude Sale Items Logic
    let applicableTotal = cartTotal;

    if (discount.excludeSaleItems) {
        applicableTotal = cart.items.reduce((acc: number, item: any) => {
            const isOnSale = item.variant?.salePrice || item.product.salePrice;
            if (isOnSale) return acc; // Skip sale items

            const price = item.variant?.price || item.product.price;
            return acc + (price * item.quantity);
        }, 0);

        if (applicableTotal <= 0) {
            return { success: false, error: "This coupon cannot be used with sale items." };
        }
    }

    // ৮. মিনিমাম স্পেন্ড চেক
    if (discount.minSpend && applicableTotal < discount.minSpend) {
      return { success: false, error: `Min spend $${discount.minSpend} required.` };
    }

    // ৯. প্রোডাক্ট/ক্যাটাগরি রেস্ট্রিকশন চেক
    if (discount.productIds && discount.productIds.length > 0) {
        const hasProduct = cart.items.some((item: any) => discount.productIds.includes(item.productId));
        if (!hasProduct) {
            return { success: false, error: "This coupon is not applicable to items in your cart." };
        }
    }

    if (discount.categoryIds && discount.categoryIds.length > 0) {
        const hasCategory = cart.items.some((item: any) => discount.categoryIds.includes(item.product.categoryId));
        if (!hasCategory) {
            return { success: false, error: "This coupon is not applicable to these product categories." };
        }
    }

    // ১০. ডিসকাউন্ট ক্যালকুলেশন
    let discountAmount = 0;
    if (discount.type === "PERCENTAGE") {
      discountAmount = (applicableTotal * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    if (discountAmount > cartTotal) discountAmount = cartTotal;

    // ১১. কুকি সেট করা
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
      message: "Coupon applied successfully!"
    };

  } catch (error) {
    console.error("Coupon Validate Error:", error);
    return { success: false, error: "Validation failed." };
  }
}

export async function removeCoupon() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("coupon");
        return { success: true, message: "Coupon removed" };
    } catch (error) {
        return { success: false, error: "Failed to remove coupon" };
    }
}