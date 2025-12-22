// app/actions/settings/payments/stripe/refresh-webhooks.ts

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
      apiVersion: "2025-01-27.acacia" as any, // লেটেস্ট ভার্সন ব্যবহার করাই ভালো
      typescript: true,
    })

    // ২. আপনার অ্যাপের ওয়েবহুক URL তৈরি
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${appUrl}/api/webhooks/stripe`

    // ৩. চেক করা আগে থেকেই আছে কি না (Sync Logic)
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    let webhookSecret = ""

    if (existingWebhook) {
      // যদি আগে থেকেই থাকে, আমরা সেটাকেই ব্যবহার করব (Delete করব না)
      // এতে Signing Secret পরিবর্তন হয় না, ফলে প্রোডাকশনে ডাউনটাইম হয় না
      webhookSecret = existingWebhook.secret as string || "" 
      
      // তবে ইভেন্টগুলো আপডেট করা প্রয়োজন হতে পারে
      await stripe.webhookEndpoints.update(existingWebhook.id, {
        enabled_events: [
          "payment_intent.succeeded",
          "payment_intent.payment_failed",
          "charge.refunded",
          "charge.dispute.created"
        ]
      })
    } else {
      // ৪. না থাকলে নতুন ওয়েবহুক তৈরি
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
    }

    // ৫. সিক্রেট ডাটাবেসে সেভ করা
    // এবং আমরা webhookUrl টিও রিটার্ন করব যাতে ফ্রন্টএন্ডে দেখাতে পারি
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: webhookSecret }
        : { liveWebhookSecret: webhookSecret }
    })

    revalidatePath("/admin/settings/payments")
    
    // 👇 UPDATE: URL টি রিটার্ন করছি (Gap #1 Solution)
    return { success: true, webhookUrl }

  } catch (error: any) {
    console.error("Webhook Setup Error:", error)
    return { success: false, error: error.message || "Failed to setup webhooks" }
  }
}