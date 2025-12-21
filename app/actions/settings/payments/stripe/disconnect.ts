// app/actions/settings/payments/stripe/disconnect.ts
"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function disconnectStripe(paymentMethodId: string) {
  try {
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: {
        isConnected: false,
        accountId: null,
        oauthAccessToken: null,
        oauthRefreshToken: null,
        oauthTokenType: null,
        livePublishableKey: null,
        liveSecretKey: null,
        liveWebhookSecret: null
      }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("Stripe disconnect error:", error)
    return { success: false, error: "Failed to disconnect Stripe" }
  }
}