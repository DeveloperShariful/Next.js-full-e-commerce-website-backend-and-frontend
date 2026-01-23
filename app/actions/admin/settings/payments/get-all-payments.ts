// app/actions/admin/settings/payments/get-all-payments.ts

"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "./crypto"

export async function getAllPaymentMethods() {
  try {
    const methods = await db.paymentMethodConfig.findMany({
      include: {
        stripeConfig: true,
        paypalConfig: true,
        offlineConfig: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    })

    const decryptedMethods = methods.map((method) => {
      if (method.stripeConfig) {
        method.stripeConfig.liveSecretKey = decrypt(method.stripeConfig.liveSecretKey ?? "")
        method.stripeConfig.liveWebhookSecret = decrypt(method.stripeConfig.liveWebhookSecret ?? "")
        
        method.stripeConfig.testSecretKey = decrypt(method.stripeConfig.testSecretKey ?? "")
        method.stripeConfig.testWebhookSecret = decrypt(method.stripeConfig.testWebhookSecret ?? "")
      }

      if (method.paypalConfig) {
        method.paypalConfig.liveClientSecret = decrypt(method.paypalConfig.liveClientSecret ?? "")
        method.paypalConfig.sandboxClientSecret = decrypt(method.paypalConfig.sandboxClientSecret ?? "")
      }

      return method
    })

    const serializedMethods = JSON.parse(JSON.stringify(decryptedMethods))

    return { success: true, data: serializedMethods }
  } catch (error) {
    console.error("Fetch Payment Methods Error:", error)
    return { success: false, error: "Failed to fetch payment methods" }
  }
}