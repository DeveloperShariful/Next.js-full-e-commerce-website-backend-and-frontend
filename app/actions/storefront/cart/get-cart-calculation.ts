// app/actions/storefront/checkout/get-cart-calculation.ts
"use server"

import { db } from "@/lib/prisma"

export async function getCartCalculation(cartId: string) {
  try {
    // ১. স্টোর কারেন্সি আনা
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { currency: true }
    });

    const currency = settings?.currency || "AUD";

    // ২. কার্ট ক্যালকুলেশন
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
    })

    if (!cart || !cart.items.length) {
      return { success: false, error: "Cart is empty" }
    }

    let subtotal = 0

    for (const item of cart.items) {
      // ✅ FIX: Get the Decimal Object first
      const priceDecimal = item.variant 
        ? (item.variant.salePrice || item.variant.price) 
        : (item.product.salePrice || item.product.price)
      
      // ✅ FIX: Convert Decimal Object to JavaScript Number before math
      const price = Number(priceDecimal)

      subtotal += (price * item.quantity)
    }

    return { success: true, total: subtotal, currency } 

  } catch (error) {
    console.error("Cart Calculation Error:", error)
    return { success: false, error: "Failed to calculate cart total" }
  }
}