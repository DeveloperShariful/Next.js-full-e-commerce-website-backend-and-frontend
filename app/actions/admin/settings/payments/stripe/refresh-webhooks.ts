//app/actions/settings/payments/stripe/refress-webhook.ts

"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { revalidatePath } from "next/cache"
import { encrypt, decrypt } from "../crypto" // ✅ Import added

export async function refreshStripeWebhooks(paymentMethodId: string) {
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) throw new Error("Config not found")

    // ✅ FIX 1: ডাটাবেস থেকে এনক্রিপ্টেড কি নিয়ে ডিক্রিপ্ট করা হচ্ছে
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    const secretKey = decrypt(encryptedKey ?? "")
    
    if (!secretKey) throw new Error("API Key is missing or invalid. Cannot setup webhook.")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any, 
      typescript: true,
    })

    // ২. URL ডিটেকশন
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log("Attempting Stripe Webhook Setup...");
    
    let appUrl = envUrl || "http://localhost:3000";

    // ✅ Safety check for trailing slash
    if (appUrl.endsWith("/")) {
        appUrl = appUrl.slice(0, -1);
    }

    if (appUrl.includes("localhost")) {
        console.error("Error: Cannot set localhost URL for Stripe Webhook.");
        throw new Error("Invalid URL: Stripe Webhooks cannot use 'localhost'. Set NEXT_PUBLIC_APP_URL in .env.");
    }

    const webhookUrl = `${appUrl}/api/webhooks/stripe`
    console.log("Target Webhook URL:", webhookUrl);

    // ৩. আগের ওয়েবহুক চেক ও ডিলিট
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    if (existingWebhook) {
      console.log("Found existing webhook. Deleting to regenerate secret...");
      await stripe.webhookEndpoints.del(existingWebhook.id);
    }

    // ৪. নতুন ওয়েবহুক তৈরি
    console.log("Creating new webhook...");
    const newWebhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.refunded",
        "charge.dispute.created"
      ],
    })
    
    const rawWebhookSecret = newWebhook.secret as string 
    
    // ✅ FIX 2: সিক্রেট টি ডাটাবেসে সেভ করার আগে এনক্রিপ্ট করা হচ্ছে
    const encryptedWebhookSecret = encrypt(rawWebhookSecret)

    // ৫. ডাটাবেসে আপডেট
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: encryptedWebhookSecret }
        : { liveWebhookSecret: encryptedWebhookSecret }
    })

    revalidatePath("/admin/settings/payments")
    
    return { success: true, webhookUrl }

  } catch (error: any) {
    console.error("Webhook Setup Error Detailed:", error)
    return { success: false, error: error.message || "Failed to setup webhooks" }
  }
}