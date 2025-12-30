"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function deletePaypalWebhook(paymentMethodId: string) {
  try {
    const config = await db.paypalConfig.findUnique({ where: { paymentMethodId } })
    if (!config || !config.webhookId) return { success: false, error: "No webhook found to delete" }

    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const clientSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"

    // ১. টোকেন নেওয়া
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
    })
    const tokenData = await tokenRes.json()

    // ২. PayPal থেকে ডিলিট করা
    if (tokenData.access_token) {
        await fetch(`${baseUrl}/v1/notifications/webhooks/${config.webhookId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${tokenData.access_token}` }
        })
    }

    // ৩. ডাটাবেস থেকে রিমুভ করা
    await db.paypalConfig.update({
      where: { paymentMethodId },
      data: { webhookId: null, webhookUrl: null }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }

  } catch (error) {
    console.error("Webhook delete error:", error)
    return { success: false, error: "Failed to delete webhook" }
  }
}