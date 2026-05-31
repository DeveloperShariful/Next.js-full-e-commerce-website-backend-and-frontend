//app/actions/backend/settings/payments/stripe-actions.ts

"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auditService } from "@/lib/audit-service"
import { auth } from "@/auth"
import Stripe from "stripe"
import { Prisma } from "@prisma/client"
import { z } from "zod" // ✅ FIX 1: Missing import added
import { StripeSettingsSchema, StripeSettingsType, SharedGatewaySchema } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { encrypt, decrypt } from "@/app/actions/backend/settings/payments/crypto"

async function getDbUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  return user?.id || null;
}

// 1. UPDATE STRIPE SETTINGS
export async function updateStripeSettings(
  id: string, 
  sharedValues: z.infer<typeof SharedGatewaySchema>, 
  settingsValues: StripeSettingsType
) {
  const userId = await getDbUserId();
  try {
    const validatedShared = SharedGatewaySchema.parse(sharedValues);
    const validatedSettings = StripeSettingsSchema.parse(settingsValues);

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
      userId: userId || "SYSTEM",
      action: "UPDATE_STRIPE_SETTINGS",
      entity: "PaymentGateway",
      entityId: id,
      newData: { mode: validatedShared.mode, isEnabled: validatedShared.isEnabled }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Stripe settings updated successfully." };
  } catch (error: unknown) {
    console.error("Stripe update error:", error);
    return { success: false, error: "Failed to update Stripe settings." };
  }
}

// 2. CONNECT & TEST STRIPE API KEYS
export async function connectStripeKeys(id: string, publicKey: string, secretKey: string) {
  const userId = await getDbUserId();
  try {
    if (!publicKey || !secretKey) throw new Error("Both Public and Secret keys are required.");

    const stripe = new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" as any, typescript: true });
    await stripe.balance.retrieve(); 

    const encryptedSecret = encrypt(secretKey);

    await db.paymentGateway.update({
      where: { id },
      data: {
        publicKey: publicKey,
        encryptedSecret: encryptedSecret,
        isConnected: true
      }
    });

    await auditService.log({
      userId: userId || "SYSTEM", action: "CONNECT_STRIPE_KEYS", entity: "PaymentGateway", entityId: id
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Stripe connected successfully!" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Invalid Stripe API Keys.";
    return { success: false, error: msg };
  }
}

// 3. REFRESH/CREATE STRIPE WEBHOOK
export async function refreshStripeWebhook(id: string) {
  const userId = await getDbUserId();
  try {
    const gateway = await db.paymentGateway.findUnique({ where: { id } });
    if (!gateway || !gateway.encryptedSecret) throw new Error("Stripe is not connected. Save API keys first.");

    const secretKey = decrypt(gateway.encryptedSecret);
    if (!secretKey) throw new Error("Failed to decrypt Stripe secret key.");

    const stripe = new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" as any, typescript: true });

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (appUrl.endsWith("/")) appUrl = appUrl.slice(0, -1);
    if (appUrl.includes("localhost")) throw new Error("Webhooks cannot use 'localhost'.");

    const webhookUrl = `${appUrl}/api/webhook/stripe`;

    const webhooksList = await stripe.webhookEndpoints.list();
    const existing = webhooksList.data.find((w) => w.url === webhookUrl);
    if (existing) await stripe.webhookEndpoints.del(existing.id);

    const newWebhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: ["payment_intent.succeeded", "payment_intent.payment_failed", "charge.refunded", "charge.dispute.created"],
    });

    const encryptedWebhookSecret = encrypt(newWebhook.secret as string);

    await db.paymentGateway.update({
      where: { id },
      data: { webhookUrl: webhookUrl, encryptedWebhook: encryptedWebhookSecret }
    });

    await auditService.log({
      userId: userId || "SYSTEM", action: "REFRESH_STRIPE_WEBHOOK", entity: "PaymentGateway", entityId: id
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Webhook synced successfully!" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Webhook setup failed.";
    return { success: false, error: msg };
  }
}

// 3.5 SAVE MANUAL WEBHOOK SECRET
export async function saveManualWebhook(id: string, webhookSecret: string, webhookUrl: string) {
  const userId = await getDbUserId();
  try {
    const encryptedWebhookSecret = encrypt(webhookSecret);

    await db.paymentGateway.update({
      where: { id },
      data: { 
        webhookUrl: webhookUrl, 
        encryptedWebhook: encryptedWebhookSecret 
      }
    });

    await auditService.log({
      userId: userId || "SYSTEM", action: "MANUAL_WEBHOOK_SAVED", entity: "PaymentGateway", entityId: id
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Manual Webhook saved successfully!" };
  } catch (error: unknown) {
    return { success: false, error: "Failed to save webhook manually." };
  }
}


// 4. DISCONNECT STRIPE
export async function disconnectStripe(id: string) {
  try {
    await db.paymentGateway.update({
      where: { id },
      data: { publicKey: null, encryptedSecret: null, encryptedWebhook: null, webhookUrl: null, isConnected: false, isEnabled: false }
    });
    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Stripe disconnected and keys removed." };
  } catch (error: unknown) {
    return { success: false, error: "Failed to disconnect." };
  }
}