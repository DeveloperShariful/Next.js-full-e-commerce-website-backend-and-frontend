// File: app/actions/settings/payments/stripe/refresh-delete-webhook.ts
"use server"

import { db } from "@/lib/prisma"
import Stripe from "stripe"
import { revalidatePath } from "next/cache"
import { encrypt, decrypt } from "../crypto"
import { auditService } from "@/lib/services/audit-service"
import { auth } from "@clerk/nextjs/server"

export async function refreshStripeWebhooks(paymentMethodId: string) {
  const { userId } = await auth();
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) throw new Error("Config not found")
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    const secretKey = decrypt(encryptedKey ?? "")
    
    if (!secretKey) throw new Error("API Key is missing or invalid")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any, 
      typescript: true,
    })

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (appUrl.endsWith("/")) appUrl = appUrl.slice(0, -1);

    if (appUrl.includes("localhost")) {
        throw new Error("Invalid URL: Stripe Webhooks cannot use 'localhost'. Set NEXT_PUBLIC_APP_URL.");
    }

    const webhookUrl = `${appUrl}/api/webhooks/stripe`
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    if (existingWebhook) {
      await stripe.webhookEndpoints.del(existingWebhook.id);
    }

    const newWebhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.refunded",
        "charge.dispute.created"
      ],
    })
    
    const encryptedWebhookSecret = encrypt(newWebhook.secret as string)
    
    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: encryptedWebhookSecret }
        : { liveWebhookSecret: encryptedWebhookSecret }
    })

    await auditService.log({
        userId: userId ?? "system",
        action: "REFRESH_STRIPE_WEBHOOK",
        entity: "StripeConfig",
        entityId: config.id,
        newData: { webhookUrl, mode: config.testMode ? "TEST" : "LIVE" }
    });

    revalidatePath("/admin/settings/payments")
    return { success: true, webhookUrl }

  } catch (error: any) {
    await auditService.systemLog("ERROR", "REFRESH_STRIPE_WEBHOOK", error.message);
    return { success: false, error: error.message || "Failed to setup webhooks" }
  }
}

export async function deleteStripeWebhook(paymentMethodId: string) {
  const { userId } = await auth();
  try {
    const config = await db.stripeConfig.findUnique({
      where: { paymentMethodId }
    })

    if (!config) throw new Error("Config not found")
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    const secretKey = decrypt(encryptedKey ?? "")
    
    if (!secretKey) throw new Error("API Key is missing")

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const webhookUrl = `${appUrl}/api/webhooks/stripe`
    
    const webhooks = await stripe.webhookEndpoints.list()
    const existingWebhook = webhooks.data.find(w => w.url === webhookUrl)

    if (existingWebhook) {
      await stripe.webhookEndpoints.del(existingWebhook.id)
    }

    await db.stripeConfig.update({
      where: { paymentMethodId },
      data: config.testMode 
        ? { testWebhookSecret: null } 
        : { liveWebhookSecret: null } 
    })

    await auditService.log({
        userId: userId ?? "system",
        action: "DELETE_STRIPE_WEBHOOK",
        entity: "StripeConfig",
        entityId: config.id,
        oldData: { webhookUrl }
    });

    revalidatePath("/admin/settings/payments")
    return { success: true }

  } catch (error: any) {
    await auditService.systemLog("ERROR", "DELETE_STRIPE_WEBHOOK", error.message);
    return { success: false, error: error.message || "Failed to delete webhook" }
  }
}