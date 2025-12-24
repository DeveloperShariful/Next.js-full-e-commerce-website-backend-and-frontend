"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function refreshPaypalWebhook(paymentMethodId: string) {
  try {
    const config = await db.paypalConfig.findUnique({ where: { paymentMethodId } })
    if (!config) return { success: false, error: "Configuration not found" }

    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const clientSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret

    if (!clientId || !clientSecret) return { success: false, error: "Missing credentials" }

    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    
    // ১. টোকেন নেওয়া
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return { success: false, error: "Authentication failed" }

    // ২. URL বানানো
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${appUrl}/api/webhooks/paypal`

    // ৩. নতুন ওয়েবুক তৈরির চেষ্টা
    const createRes = await fetch(`${baseUrl}/v1/notifications/webhooks`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        event_types: [
          { name: "PAYMENT.CAPTURE.COMPLETED" },
          { name: "PAYMENT.CAPTURE.DENIED" },
          { name: "PAYMENT.CAPTURE.REFUNDED" },
          { name: "CUSTOMER.DISPUTE.CREATED" }
        ]
      })
    })

    const createData = await createRes.json()
    let finalWebhookId = createData.id

    // ৪. যদি আগে থেকেই থাকে (Already Exists), তবে লিস্ট থেকে খুঁজে বের করো (Reconnect Logic)
    if (createData.name === "WEBHOOK_URL_ALREADY_EXISTS") {
        console.log("Webhook exists, fetching list to reconnect...")
        
        const listRes = await fetch(`${baseUrl}/v1/notifications/webhooks`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${tokenData.access_token}` }
        })
        const listData = await listRes.json()
        
        // আমাদের URL এর সাথে মিলে এমন ওয়েবুক খুঁজছি
        const existingHook = listData.webhooks.find((w: any) => w.url === webhookUrl)
        
        if (existingHook) {
            finalWebhookId = existingHook.id
        } else {
            return { success: false, error: "Webhook exists but could not be found. Please delete manually from PayPal." }
        }
    }

    // ৫. ডাটাবেস আপডেট (Save/Sync)
    if (finalWebhookId) {
      await db.paypalConfig.update({
        where: { paymentMethodId },
        data: { webhookId: finalWebhookId, webhookUrl }
      })
      revalidatePath("/admin/settings/payments")
      return { success: true, webhookId: finalWebhookId, webhookUrl } 
    }

    return { success: false, error: createData.message || "Failed to create webhook" }

  } catch (error) {
    console.error("Webhook refresh error:", error)
    return { success: false, error: "Internal server error" }
  }
}