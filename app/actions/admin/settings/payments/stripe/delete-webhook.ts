// app/actions/settings/payments/stripe/delete-webhook.ts
"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { revalidatePath } from "next/cache"
import { decrypt } from "../crypto" // 👈 Decryption Import

export async function deleteStripeWebhook(paymentMethodId: string) {
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) throw new Error("Config not found")

    // ১. সঠিক এনক্রিপ্টেড কি নির্ধারণ
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    
    // ২. কি ডিক্রিপ্ট করা
    const secretKey = decrypt(encryptedKey ?? "")
    
    if (!secretKey) throw new Error("API Key is missing or invalid.")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })

    // ৩. অ্যাপের ওয়েবহুক URL বের করা
    // এখানে URL জেনারেট করা হচ্ছে যাতে এক্সাক্ট ম্যাচিং ডিলিট করা যায়
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set.")
    
    const webhookUrl = `${appUrl}/api/webhooks/stripe`

    // ৪. Stripe থেকে খুঁজে বের করে ডিলিট করা
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    if (existingWebhook) {
      await stripe.webhookEndpoints.del(existingWebhook.id)
    }

    // ৫. ডাটাবেস আপডেট (Webhook Secret মুছে ফেলা)
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: null } // Clear test secret
        : { liveWebhookSecret: null } // Clear live secret
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }

  } catch (error: any) {
    console.error("Stripe Webhook Delete Error:", error)
    return { success: false, error: error.message || "Failed to delete webhook" }
  }
}