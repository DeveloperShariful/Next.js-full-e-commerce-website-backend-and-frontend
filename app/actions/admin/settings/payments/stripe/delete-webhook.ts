"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { revalidatePath } from "next/cache"

export async function deleteStripeWebhook(paymentMethodId: string) {
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) throw new Error("Config not found")

    // ১. সঠিক সিক্রেট কি নির্ধারণ
    const secretKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    
    if (!secretKey) throw new Error("API Key is missing.")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })

    // ২. অ্যাপের ওয়েবহুক URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${appUrl}/api/webhooks/stripe`

    // ৩. Stripe থেকে খুঁজে বের করে ডিলিট করা
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    if (existingWebhook) {
      await stripe.webhookEndpoints.del(existingWebhook.id)
    }

    // ৪. ডাটাবেস থেকে সিক্রেট মুছে ফেলা
    // (আমরা শুধু Webhook Secret নাল করব, API Key নয়)
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: "" } // Clear test secret
        : { liveWebhookSecret: "" } // Clear live secret
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }

  } catch (error: any) {
    console.error("Webhook Delete Error:", error)
    return { success: false, error: error.message || "Failed to delete webhook" }
  }
}