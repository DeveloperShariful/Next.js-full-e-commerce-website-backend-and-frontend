// app/actions/settings/payments/paypal/clear-database.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function clearPaypalSettings(paymentMethodId: string) {
  try {
    await db.paypalConfig.update({
      where: { paymentMethodId },
      data: {
        isOnboarded: false,
        merchantId: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
        partnerReferralId: null,
        
        liveEmail: null,
        liveClientId: null,
        liveClientSecret: null,
        
        sandboxEmail: null,
        sandboxClientId: null,
        sandboxClientSecret: null,
        
        webhookId: null
      }
    })

    // Disable the method as credentials are gone
    await db.paymentMethodConfig.update({
      where: { id: paymentMethodId },
      data: { isEnabled: false }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("PayPal clear settings error:", error)
    return { success: false, error: "Failed to clear settings" }
  }
}