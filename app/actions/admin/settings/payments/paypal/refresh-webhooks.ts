// app/actions/settings/payments/paypal/refresh-webhook.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { decrypt } from "../crypto" // 

export async function refreshPaypalWebhook(paymentMethodId: string) {
  try {
    const config = await db.paypalConfig.findUnique({ where: { paymentMethodId } })
    if (!config) return { success: false, error: "Configuration not found" }

    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const clientSecret = decrypt(encryptedSecret ?? "")

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
    if (!tokenData.access_token) return { success: false, error: "Authentication failed. Check Client ID/Secret." }

    const envUrl = process.env.NEXT_PUBLIC_APP_URL || "";

    if (!envUrl.startsWith("http")) {
       return { success: false, error: "NEXT_PUBLIC_APP_URL is not set correctly in .env" }
    }
    
    const webhookUrl = `${envUrl}/api/webhooks/paypal`

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
    
    if (createData.name === "WEBHOOK_URL_ALREADY_EXISTS") {
        const listRes = await fetch(`${baseUrl}/v1/notifications/webhooks`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${tokenData.access_token}` }
        })
        const listData = await listRes.json()
        const existingHook = listData.webhooks.find((w: any) => w.url === webhookUrl)
        
        if (existingHook) {
            finalWebhookId = existingHook.id
        } else {
            return { success: false, error: "Webhook URL exists on PayPal but couldn't be retrieved." }
        }
    }

    // ৫. ডাটাবেস আপডেট
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