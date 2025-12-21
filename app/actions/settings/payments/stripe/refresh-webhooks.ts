"use server"

import { db } from "@/lib/db"
import Stripe from "stripe"
import { revalidatePath } from "next/cache"

export async function refreshStripeWebhooks(paymentMethodId: string) {
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) throw new Error("Config not found")

    // ১. সঠিক সিক্রেট কি নির্ধারণ
    const secretKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    
    if (!secretKey) throw new Error("API Key is missing. Cannot setup webhook.")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover" as any,
      typescript: true,
    })

    // ২. তোমার অ্যাপের ওয়েবহুক URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`

    // ৩. চেক করা আগে থেকেই আছে কি না
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    let webhookSecret = ""

    if (existingWebhook) {
      // যদি থাকে, তাহলে আমরা ধরে নিচ্ছি আগেরটাই ঠিক আছে।
      // (Stripe API থেকে সিক্রেট রিট্রিভ করা যায় না, তাই নতুন বানাচ্ছি না যদি না প্রয়োজন হয়)
      // তবে ইউজার ফোর্স করলে আমরা আপডেট করতে পারি।
      
      // আপাতত আমরা নতুন করে বানাচ্ছি যাতে নিশ্চিত হওয়া যায় সিক্রেটটি সঠিক
      await stripe.webhookEndpoints.del(existingWebhook.id);
    }

    // ৪. নতুন ওয়েবহুক তৈরি
    const newWebhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.refunded",
        "charge.dispute.created"
      ],
    })
    webhookSecret = newWebhook.secret as string

    // ৫. সিক্রেট ডাটাবেসে সেভ করা
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: webhookSecret }
        : { liveWebhookSecret: webhookSecret }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error: any) {
    console.error("Webhook Setup Error:", error)
    return { success: false, error: error.message || "Failed to setup webhooks" }
  }
}