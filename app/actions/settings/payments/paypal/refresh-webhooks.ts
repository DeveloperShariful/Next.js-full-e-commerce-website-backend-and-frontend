"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function refreshPaypalWebhook(paymentMethodId: string) {
  try {
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

    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    
    // Get Access Token
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

    // URL Construction
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${appUrl}/api/webhooks/paypal`

    // Create Webhook
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
          { name: "PAYMENT.CAPTURE.REFUNDED" },
          { name: "CUSTOMER.DISPUTE.CREATED" }
        ]
      })
    })

    const webhookData = await webhookRes.json()
    let webhookId = webhookData.id

    // Handle "Already Exists"
    if (webhookData.name === "WEBHOOK_URL_ALREADY_EXISTS") {
       return { success: false, error: "Webhook URL already exists inside PayPal. Please remove it from PayPal dashboard." }
    }

    if (webhookId) {
      await db.paypalConfig.update({
        where: { paymentMethodId },
        data: { 
          webhookId,
          webhookUrl // Save to DB
        }
      })
      revalidatePath("/admin/settings/payments")
      
      // 👇 FIX: Return the URL to the frontend
      return { success: true, webhookId, webhookUrl } 
    }

    return { success: false, error: webhookData.message || "Failed to create webhook" }

  } catch (error) {
    console.error("Webhook refresh error:", error)
    return { success: false, error: "Internal server error" }
  }
}