"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function refreshPaypalWebhook(paymentMethodId: string) {
  try {
    // ১. ডাটাবেস থেকে কনফিগারেশন নেওয়া
    const config = await db.paypalConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) return { success: false, error: "Configuration not found" }

    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const clientSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret

    if (!clientId || !clientSecret) {
      return { success: false, error: "Missing credentials" }
    }

    // ২. অ্যাক্সেস টোকেন নেওয়া
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return { success: false, error: "Authentication failed" }

    // ৩. ওয়েবহুক তৈরি করা (Create Webhook)
    // নোট: Localhost এ এটি কাজ করবে না কারণ PayPal লোকালহোস্টে হিট করতে পারে না।
    // লাইভ সার্ভারে বা Ngrok ব্যবহার করলে এটি কাজ করবে।
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${appUrl}/api/webhooks/paypal`

    const webhookRes = await fetch(`${baseUrl}/v1/notifications/webhooks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: webhookUrl,
        event_types: [
          { name: "PAYMENT.CAPTURE.COMPLETED" },
          { name: "PAYMENT.CAPTURE.DENIED" },
          { name: "PAYMENT.CAPTURE.REFUNDED" }
        ]
      })
    })

    const webhookData = await webhookRes.json()

    // ৪. যদি সফল হয় বা আগের কোনো ওয়েবহুক থাকে
    let webhookId = webhookData.id

    // যদি এরর দেয় যে "Webhook already exists", তাহলে আমাদের লিস্ট থেকে আইডি খুঁজে বের করতে হবে
    if (webhookData.name === "WEBHOOK_URL_ALREADY_EXISTS") {
       // এখানে সিম্পল রাখার জন্য আমরা ধরে নিচ্ছি ইউজার ম্যানুয়ালি আইডি বসাবে বা আমরা শুধু সাকসেস মেসেজ দিব
       // অথবা আগের আইডিটিই রেখে দিব
       return { success: false, error: "Webhook URL already exists inside PayPal. Please delete it from PayPal dashboard first or use the existing ID." }
    }

    if (webhookId) {
      await db.paypalConfig.update({
        where: { paymentMethodId },
        data: { webhookId }
      })
      revalidatePath("/admin/settings/payments")
      return { success: true, webhookId }
    }

    return { success: false, error: webhookData.message || "Failed to create webhook" }

  } catch (error) {
    console.error("Webhook refresh error:", error)
    return { success: false, error: "Internal server error" }
  }
}