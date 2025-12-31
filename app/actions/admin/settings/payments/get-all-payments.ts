// app/actions/settings/payments/get-all-payments.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "./crypto" // 👈 Decryption Import

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

    // ডাটাবেস থেকে আসা এনক্রিপ্টেড ডাটাগুলোকে ডিক্রিপ্ট করে ফ্রন্টেন্ডে পাঠাচ্ছি
    const decryptedMethods = methods.map((method) => {
      // 1. Decrypt Stripe Keys
      if (method.stripeConfig) {
        method.stripeConfig.liveSecretKey = decrypt(method.stripeConfig.liveSecretKey ?? "")
        method.stripeConfig.liveWebhookSecret = decrypt(method.stripeConfig.liveWebhookSecret ?? "")
        
        method.stripeConfig.testSecretKey = decrypt(method.stripeConfig.testSecretKey ?? "")
        method.stripeConfig.testWebhookSecret = decrypt(method.stripeConfig.testWebhookSecret ?? "")
      }

      // 2. Decrypt PayPal Secrets
      if (method.paypalConfig) {
        method.paypalConfig.liveClientSecret = decrypt(method.paypalConfig.liveClientSecret ?? "")
        method.paypalConfig.sandboxClientSecret = decrypt(method.paypalConfig.sandboxClientSecret ?? "")
      }

      return method
    })

    return { success: true, data: decryptedMethods }
  } catch (error) {
    console.error("Fetch Payment Methods Error:", error)
    return { success: false, error: "Failed to fetch payment methods" }
  }
}