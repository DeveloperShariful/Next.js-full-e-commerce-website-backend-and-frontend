//app/actions/storefront/cart/clear-cart.ts

"use server"

import { db } from "@/lib/prisma"
import { cookies } from "next/headers"

export async function clearCart() {
  try {
    const cookieStore = await cookies()
    const cartId = cookieStore.get("cartId")?.value

    if (cartId) {
      await db.cart.delete({
        where: { id: cartId }
      })
      // কুকি ডিলেট করার দরকার নেই, নেক্সট টাইম ভিজিট করলে নতুন আইডি জেনারেট হবে
    }
    return { success: true }
  } catch (error) {
    console.error("Clear Cart Error:", error)
    return { success: false }
  }
}