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

    // ১. সিক্রেট কি চেক
    const secretKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    
    if (!secretKey) throw new Error("API Key is missing. Cannot setup webhook.")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any, 
      typescript: true,
    })

    // ২. URL ডিটেকশন (Localhost Fix সহ)
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    console.log("Attempting Stripe Webhook Setup...");
    
    // লোকালহোস্ট হলে এরর দিব, কিন্তু টেস্ট মোডে বাইপাস করার অপশন রাখব না কারণ স্ট্রাইপ সাপোর্ট করে না
    let appUrl = envUrl || "http://localhost:3000";

    if (appUrl.includes("localhost")) {
        console.error("Error: Cannot set localhost URL for Stripe Webhook.");
        throw new Error("Invalid URL: Stripe Webhooks cannot use 'localhost'. Please make sure NEXT_PUBLIC_APP_URL is set in .env or Netlify.");
    }

    const webhookUrl = `${appUrl}/api/webhooks/stripe`
    console.log("Target Webhook URL:", webhookUrl);

    // ৩. আগের ওয়েবহুক চেক করা
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    let webhookSecret = ""

    // 👇 MAIN FIX: যদি আগে থাকে, তবে সেটা ডিলিট করে নতুন বানাবো।
    // কারণ: পুরনো ওয়েবহুক থেকে Stripe 'Secret Key' রিটার্ন করে না।
    if (existingWebhook) {
      console.log("Found existing webhook. Deleting to regenerate secret...");
      await stripe.webhookEndpoints.del(existingWebhook.id);
    }

    // ৪. নতুন ওয়েবহুক তৈরি (Create New)
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
    
    // নতুন তৈরি করার সময়ই কেবল সিক্রেট পাওয়া যায়
    webhookSecret = newWebhook.secret as string 

    // ৫. ডাটাবেসে সেভ
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: webhookSecret }
        : { liveWebhookSecret: webhookSecret }
    })

    revalidatePath("/admin/settings/payments")
    
    return { success: true, webhookUrl }

  } catch (error: any) {
    console.error("Webhook Setup Error Detailed:", error)
    return { success: false, error: error.message || "Failed to setup webhooks" }
  }
}