// File: app/actions/settings/payments/paypal/refresh-delete-webhook.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { decrypt } from "../crypto"
import { auditService } from "@/lib/services/audit-service"
import { auth } from "@clerk/nextjs/server"

export async function refreshPaypalWebhook(paymentMethodId: string) {
  const { userId } = await auth();
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
    
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return { success: false, error: "Authentication failed" }

    let envUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    if (envUrl.endsWith("/")) envUrl = envUrl.slice(0, -1);
    if (!envUrl.startsWith("http")) return { success: false, error: "NEXT_PUBLIC_APP_URL invalid" }
    
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
        if (existingHook) finalWebhookId = existingHook.id
    }

    if (finalWebhookId) {
      await db.paypalConfig.update({
        where: { paymentMethodId },
        data: { webhookId: finalWebhookId, webhookUrl }
      })
      
      await auditService.log({
        userId: userId ?? "system",
        action: "REFRESH_PAYPAL_WEBHOOK",
        entity: "PaypalConfig",
        entityId: config.id,
        newData: { webhookUrl, webhookId: finalWebhookId }
      });

      revalidatePath("/admin/settings/payments")
      return { success: true, webhookId: finalWebhookId, webhookUrl } 
    }

    return { success: false, error: createData.message || "Failed to create webhook" }

  } catch (error: any) {
    await auditService.systemLog("ERROR", "REFRESH_PAYPAL_WEBHOOK", error.message);
    return { success: false, error: "Internal server error" }
  }
}

export async function deletePaypalWebhook(paymentMethodId: string) {
  const { userId } = await auth();
  try {
    const config = await db.paypalConfig.findUnique({ where: { paymentMethodId } })
    if (!config || !config.webhookId) return { success: true }

    const isSandbox = config.sandbox
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret
    const clientSecret = decrypt(encryptedSecret ?? "")

    if (clientId && clientSecret) {
        const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
        const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }
        })
        const tokenData = await tokenRes.json()
        if (tokenData.access_token) {
            await fetch(`${baseUrl}/v1/notifications/webhooks/${config.webhookId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${tokenData.access_token}` }
            })
        }
    }

    await db.paypalConfig.update({
      where: { paymentMethodId },
      data: { webhookId: null, webhookUrl: null }
    })

    await auditService.log({
        userId: userId ?? "system",
        action: "DELETE_PAYPAL_WEBHOOK",
        entity: "PaypalConfig",
        entityId: config.id,
        oldData: { webhookId: config.webhookId }
    });

    revalidatePath("/admin/settings/payments")
    return { success: true }

  } catch (error: any) {
    await auditService.systemLog("ERROR", "DELETE_PAYPAL_WEBHOOK", error.message);
    return { success: false, error: "Failed to delete webhook" }
  }
}