// app/actions/settings/payments/paypal/save-manual-creds.ts
"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function savePaypalManualCreds(
  paymentMethodId: string,
  data: {
    sandbox: boolean
    clientId: string
    clientSecret: string
    email?: string
  }
) {
  try {
    // Determine which fields to update based on mode
    const updateData = data.sandbox
      ? {
          sandbox: true,
          sandboxClientId: data.clientId,
          sandboxClientSecret: data.clientSecret,
          sandboxEmail: data.email,
        }
      : {
          sandbox: false,
          liveClientId: data.clientId,
          liveClientSecret: data.clientSecret,
          liveEmail: data.email,
        }

    await db.paypalConfig.update({
      where: { paymentMethodId },
      data: {
        ...updateData,
        isOnboarded: false, // Manual setup means not onboarded via Partner API
      }
    })

    // Also update parent mode
    await db.paymentMethodConfig.update({
      where: { id: paymentMethodId },
      data: {
        mode: data.sandbox ? "TEST" : "LIVE"
      }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("PayPal manual creds error:", error)
    return { success: false, error: "Failed to save credentials" }
  }
}