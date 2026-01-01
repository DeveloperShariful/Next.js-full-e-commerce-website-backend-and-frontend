// app/actions/storefront/checkout/validate-coupon.ts
"use server"

import { db } from "@/lib/prisma"
import { getCartCalculation } from "./get-cart-calculation"

export async function validateCoupon(code: string, cartId: string) {
  try {
    // ১. কুপন কোড ডাটাবেসে খোঁজা
    const discount = await db.discount.findUnique({
      where: { code: code.toUpperCase() }, // Case insensitive
    })

    if (!discount || !discount.isActive) {
      return { success: false, error: "Invalid or expired coupon code." }
    }

    // ২. শর্ত চেক করা (Validity Checks)
    const now = new Date()
    if (discount.startDate > now || (discount.endDate && discount.endDate < now)) {
      return { success: false, error: "This coupon is expired." }
    }

    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { success: false, error: "Coupon usage limit reached." }
    }

    // ৩. কার্ট টোটাল চেক করা (Min Spend)
    const cartData = await getCartCalculation(cartId)
    if (!cartData.success || !cartData.total) {
      return { success: false, error: "Could not validate cart total." }
    }

    if (discount.minSpend && cartData.total < discount.minSpend) {
      return { success: false, error: `Minimum spend of $${discount.minSpend} required.` }
    }

    // ৪. ডিসকাউন্ট অ্যামাউন্ট হিসাব করা
    let discountAmount = 0
    if (discount.type === "PERCENTAGE") {
      discountAmount = (cartData.total * discount.value) / 100
    } else if (discount.type === "FIXED_CART" || discount.type === "FIXED_AMOUNT") {
      discountAmount = discount.value
    }

    // টোটালের চেয়ে ডিসকাউন্ট বেশি হতে পারবে না
    if (discountAmount > cartData.total) {
      discountAmount = cartData.total
    }

    const newTotal = cartData.total - discountAmount

    return {
      success: true,
      discountId: discount.id,
      code: discount.code,
      discountAmount: discountAmount,
      newTotal: newTotal,
      message: "Coupon applied successfully!"
    }

  } catch (error) {
    console.error("Coupon Validation Error:", error)
    return { success: false, error: "Failed to apply coupon." }
  }
}