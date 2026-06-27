"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auditService } from "@/lib/audit-service"
import { security } from "@/lib/security"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { PaypalSettingsSchema, PaypalSettingsType, SharedGatewaySchema } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { encrypt, decrypt } from "@/app/actions/backend/settings/payments/crypto"

// 1. UPDATE PAYPAL SETTINGS
export async function updatePaypalSettings(
  id: string,
  sharedValues: z.infer<typeof SharedGatewaySchema>,
  settingsValues: PaypalSettingsType
) {
  const user = await security.assertAdmin();
  try {
    const validatedShared = SharedGatewaySchema.parse(sharedValues);
    const validatedSettings = PaypalSettingsSchema.parse(settingsValues);

    await db.paymentGateway.update({
      where: { id },
      data: {
        name: validatedShared.name,
        title: validatedShared.title,
        description: validatedShared.description,
        isEnabled: validatedShared.isEnabled,
        mode: validatedShared.mode,
        minOrderAmount: validatedShared.minOrderAmount,
        maxOrderAmount: validatedShared.maxOrderAmount,
        surchargeEnabled: validatedShared.surchargeEnabled,
        surchargeAmount: validatedShared.surchargeAmount ?? 0, // ✅ FIX 2: Added fallback to 0 instead of null
        settings: validatedSettings as unknown as Prisma.InputJsonValue 
      }
    });

    await auditService.log({
      userId: user.id, action: "UPDATE_PAYPAL_SETTINGS", entity: "PaymentGateway", entityId: id
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "PayPal settings updated successfully." };
  } catch (error: unknown) {
    console.error("PayPal update error:", error);
    return { success: false, error: "Failed to update PayPal settings." };
  }
}

// 2. CONNECT & TEST PAYPAL API KEYS
export async function connectPaypalKeys(id: string, clientId: string, secretKey: string, isSandbox: boolean) {
  const user = await security.assertAdmin();
  
  try {
    // 1. Basic Validation
    if (!clientId || !secretKey) {
      return { success: false, error: "Both Client ID and Secret are required." };
    }

    // 2. Setup PayPal API URL & Auth
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const authString = Buffer.from(`${clientId}:${secretKey}`).toString("base64");

    // 3. Hit PayPal API
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      cache: "no-store"
    });

    const data = await response.json();

    // 4. Handle PayPal Errors Safely
    if (!response.ok || !data.access_token) {
      console.error("PayPal Auth Error:", data); // ব্যাকএন্ড টার্মিনালে লগ দেখার জন্য
      return { 
        success: false, 
        error: data.error_description || data.error || "Authentication failed with PayPal. Please check your keys." 
      };
    }

    // 5. Encrypt and Save to DB
    const encryptedSecret = encrypt(secretKey);

    await db.paymentGateway.update({
      where: { id },
      data: {
        publicKey: clientId,
        encryptedSecret: encryptedSecret,
        mode: isSandbox ? "TEST" : "LIVE",
        isConnected: true
      }
    });

    await auditService.log({
      userId: user.id,
      action: "CONNECT_PAYPAL_KEYS",
      entity: "PaymentGateway",
      entityId: id
    });

    revalidatePath("/admin/settings/payments");
    
    return { 
      success: true, 
      message: `PayPal ${isSandbox ? 'Sandbox' : 'Live'} connected successfully!` 
    };

  } catch (error: unknown) {
    console.error("PayPal Connection Catch Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network Error: Could not connect to PayPal."
    };
  }
}

// 3. REFRESH/CREATE PAYPAL WEBHOOK
export async function refreshPaypalWebhook(id: string) {
  const user = await security.assertAdmin();
  try {
    const gateway = await db.paymentGateway.findUnique({ where: { id } });
    if (!gateway || !gateway.encryptedSecret || !gateway.publicKey) throw new Error("PayPal is not connected.");

    const clientId = gateway.publicKey;
    const clientSecret = decrypt(gateway.encryptedSecret);
    const isSandbox = gateway.mode === "TEST";

    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST", body: "grant_type=client_credentials",
      headers: { "Authorization": `Basic ${authString}`, "Content-Type": "application/x-www-form-urlencoded" }
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("Authentication failed with PayPal.");

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (appUrl.endsWith("/")) appUrl = appUrl.slice(0, -1);
    const webhookUrl = `${appUrl}/api/webhooks/paypal`;

    const createRes = await fetch(`${baseUrl}/v1/notifications/webhooks`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        event_types: [
          { name: "CHECKOUT.ORDER.APPROVED" },
          { name: "PAYMENT.CAPTURE.COMPLETED" },
          { name: "PAYMENT.CAPTURE.DENIED" },
          { name: "PAYMENT.CAPTURE.DECLINED" },
          { name: "PAYMENT.CAPTURE.REFUNDED" },
          { name: "RISK.DISPUTE.CREATED" },
        ],
      })
    });

    const createData = await createRes.json();
    let finalWebhookId = createData.id;

    if (createData.name === "WEBHOOK_URL_ALREADY_EXISTS") {
      const listRes = await fetch(`${baseUrl}/v1/notifications/webhooks`, { headers: { "Authorization": `Bearer ${tokenData.access_token}` } });
      const listData = await listRes.json();
      const existingHook = (listData.webhooks as Array<{ id: string; url: string }> | undefined)?.find((w) => w.url === webhookUrl);
      if (existingHook) finalWebhookId = existingHook.id;
    }

    if (!finalWebhookId) throw new Error("Failed to extract Webhook ID from PayPal.");
    const encryptedWebhookId = encrypt(finalWebhookId);

    await db.paymentGateway.update({
      where: { id },
      data: { webhookUrl: webhookUrl, encryptedWebhook: encryptedWebhookId }
    });

    await auditService.log({
      userId: user.id, action: "REFRESH_PAYPAL_WEBHOOK", entity: "PaymentGateway", entityId: id
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "PayPal webhook synced!" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to setup webhooks.";
    return { success: false, error: msg };
  }
}

// 3.5 SAVE MANUAL PAYPAL WEBHOOK ID
export async function savePaypalManualWebhook(id: string, webhookId: string, webhookUrl: string) {
  const user = await security.assertAdmin();
  try {
    const encryptedWebhookId = encrypt(webhookId);

    await db.paymentGateway.update({
      where: { id },
      data: { 
        webhookUrl: webhookUrl, 
        encryptedWebhook: encryptedWebhookId 
      }
    });

    await auditService.log({
      userId: user.id, action: "MANUAL_PAYPAL_WEBHOOK_SAVED", entity: "PaymentGateway", entityId: id
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Manual Webhook ID saved successfully!" };
  } catch {
    return { success: false, error: "Failed to save webhook manually." };
  }
}

// 4. DISCONNECT PAYPAL
export async function disconnectPaypal(id: string) {
  const user = await security.assertAdmin();
  try {
    await db.paymentGateway.update({
      where: { id },
      data: { publicKey: null, encryptedSecret: null, encryptedWebhook: null, webhookUrl: null, isConnected: false, isEnabled: false }
    });
    await auditService.log({
      userId: user.id,
      action: "DISCONNECT_PAYPAL",
      entity: "PaymentGateway",
      entityId: id,
      newData: { isConnected: false, isEnabled: false, keysCleared: true }
    });
    revalidatePath("/admin/settings/payments");
    return { success: true, message: "PayPal disconnected successfully." };
  } catch {
    return { success: false, error: "Failed to clear settings" };
  }
}