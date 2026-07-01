//File 1: app/actions/backend/settings/payments/core-actions.ts

"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auditService } from "@/lib/audit-service"
import { security } from "@/lib/security"
import { Prisma, PaymentMode, PaymentProvider } from "@prisma/client"
import { PaymentGatewayUI, StripeSettingsSchema, PaypalSettingsSchema, OfflineSettingsSchema } from "@/app/(backend)/admin/settings/payments/types-and-schemas"
import { decrypt, safeDecrypt } from "@/app/actions/backend/settings/payments/crypto"

// 1. Fetch All Gateways with Type-Safe JSON Parsing & Webhook Decryption
export async function getAllPaymentGateways(): Promise<{ success: boolean; data?: PaymentGatewayUI[]; error?: string }> {
  try {
    const gateways = await db.paymentGateway.findMany({
      orderBy: { displayOrder: "asc" }
    });

    // ★ LOGIC 1: Find the MAIN Stripe Account to inherit its keys for Klarna, Afterpay, Zip
    const mainStripe = gateways.find(g => g.identifier === "stripe");
    const mainStripePublicKey = mainStripe?.publicKey || null;
    const mainStripeIsConnected = mainStripe?.isConnected || false;
    const mainStripeMode = mainStripe?.mode || PaymentMode.TEST;
    const mainStripeWebhookUrl = mainStripe?.webhookUrl || null;
    const mainStripeWebhookSecret = mainStripe?.encryptedWebhook ? safeDecrypt(mainStripe.encryptedWebhook) : null;

    const parsedGateways: PaymentGatewayUI[] = gateways.map((g) => {
      let parsedSettings: PaymentGatewayUI["settings"] = null;

      if (g.settings) {
        try {
          if (g.provider === "STRIPE") parsedSettings = StripeSettingsSchema.parse(g.settings);
          else if (g.provider === "PAYPAL") parsedSettings = PaypalSettingsSchema.parse(g.settings);
          else if (g.provider === "OFFLINE") parsedSettings = OfflineSettingsSchema.parse(g.settings);
        } catch (e) {
          console.error(`Invalid JSON Settings for ${g.identifier}`, e);
          parsedSettings = null; 
        }
      }

      // ★ LOGIC 2: If this is a Stripe Sub-Method (Klarna, Afterpay, Zip), Forcefully Inject Main Stripe's Keys!
      let finalPublicKey = g.publicKey;
      let finalIsConnected = g.isConnected;
      let finalMode = g.mode;
      let finalWebhookUrl = g.webhookUrl;
      let finalWebhookSecret = g.encryptedWebhook ? safeDecrypt(g.encryptedWebhook) : null;

      const isStripeSubMethod = g.provider === "STRIPE" && g.identifier !== "stripe";

      if (isStripeSubMethod) {
          finalPublicKey = mainStripePublicKey;
          finalIsConnected = mainStripeIsConnected;
          finalMode = mainStripeMode; // Mode should also match the main stripe mode
          finalWebhookUrl = mainStripeWebhookUrl;
          finalWebhookSecret = mainStripeWebhookSecret;
      }

      return {
        id: g.id,
        identifier: g.identifier,
        provider: g.provider,
        name: g.name,
        title: g.title,
        description: g.description,
        isEnabled: g.isEnabled,
        isConnected: finalIsConnected, // Used injected status
        mode: finalMode,               // Used injected mode
        publicKey: finalPublicKey,     // Used injected key
        webhookUrl: finalWebhookUrl,
        webhookSecret: finalWebhookSecret,
        minOrderAmount: g.minOrderAmount ? Number(g.minOrderAmount) : null,
        maxOrderAmount: g.maxOrderAmount ? Number(g.maxOrderAmount) : null,
        surchargeEnabled: g.surchargeEnabled,
        surchargeAmount: Number(g.surchargeAmount),
        settings: parsedSettings
      };
    });

    return { success: true, data: parsedGateways };
  } catch (error: unknown) {
    console.error("Failed to fetch gateways:", error);
    return { success: false, error: "Failed to load payment methods." };
  }
}

// 2. Toggle Status (Fully untouched, very robust)
export async function toggleGatewayStatus(id: string, isEnabled: boolean) {
  const user = await security.assertAdmin();
  try {
    const oldData = await db.paymentGateway.findUnique({ where: { id } });
    if (!oldData) throw new Error("Gateway not found");

    await db.paymentGateway.update({ where: { id }, data: { isEnabled } });

    await auditService.log({
        userId: user.id,
        action: isEnabled ? "ENABLE_PAYMENT_GATEWAY" : "DISABLE_PAYMENT_GATEWAY",
        entity: "PaymentGateway",
        entityId: id,
        oldData: { isEnabled: oldData.isEnabled },
        newData: { isEnabled }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update status." };
  }
}

// 3. Reset DB Data (Updated JSON Defaults - Removed Klarna/Afterpay boolean flags inside settings)
export async function resetPaymentGatewaysDB() {
  const user = await security.assertAdmin();
  try {
    await db.$transaction(async (tx) => {
      await tx.paymentGateway.deleteMany({});
      
      const defaultMethods = [
        { identifier: "stripe", provider: PaymentProvider.STRIPE, name: "Credit / Debit Card", title: "Credit / Debit Card", description: "Pay securely with Visa, Mastercard.", isEnabled: true, mode: PaymentMode.TEST, settings: StripeSettingsSchema.parse({}) },
        { identifier: "stripe_klarna", provider: PaymentProvider.STRIPE, name: "Stripe - Klarna", title: "Klarna", description: "Pay in 3 installments.", isEnabled: false, mode: PaymentMode.TEST, settings: StripeSettingsSchema.parse({}) },
        { identifier: "stripe_afterpay", provider: PaymentProvider.STRIPE, name: "Stripe - Afterpay", title: "Afterpay", description: "Pay in 4 installments.", isEnabled: false, mode: PaymentMode.TEST, settings: StripeSettingsSchema.parse({}) },
        { identifier: "stripe_zip", provider: PaymentProvider.STRIPE, name: "Stripe - Zip Pay", title: "Zip Pay", description: "Flexible repayments.", isEnabled: false, mode: PaymentMode.TEST, settings: StripeSettingsSchema.parse({}) },
        { identifier: "paypal", provider: PaymentProvider.PAYPAL, name: "PayPal", title: "PayPal", description: "Pay with PayPal account.", isEnabled: true, mode: PaymentMode.TEST, settings: PaypalSettingsSchema.parse({}) },
        { identifier: "bank_transfer", provider: PaymentProvider.OFFLINE, name: "Bank Transfer", title: "Direct Bank Transfer", description: "Direct bank wire transfer.", isEnabled: false, mode: PaymentMode.LIVE, settings: OfflineSettingsSchema.parse({ instructions: "Transfer money to our bank account." }) },
        { identifier: "cod", provider: PaymentProvider.OFFLINE, name: "Cash on Delivery", title: "Cash on Delivery", description: "Pay upon delivery.", isEnabled: false, mode: PaymentMode.LIVE, settings: OfflineSettingsSchema.parse({ instructions: "Pay with cash upon delivery." }) }
      ];

      for (const [index, m] of defaultMethods.entries()) {
        await tx.paymentGateway.create({ 
            data: { 
                identifier: m.identifier, 
                provider: m.provider, 
                name: m.name, 
                title: m.title, 
                description: m.description, 
                isEnabled: m.isEnabled, 
                mode: m.mode, 
                displayOrder: index, 
                settings: m.settings as Prisma.InputJsonValue 
            } 
        });
      }
    });

    await auditService.log({
        userId: user.id,
        action: "RESET_PAYMENT_GATEWAYS",
        entity: "PaymentGateway",
        entityId: "ALL",
        newData: { status: "Resetted to Modern Hybrid Schema defaults" }
    });

    revalidatePath("/admin/settings/payments");
    return { success: true };
  } catch (err: unknown) {
    console.error("DB Reset Error:", err);
    await auditService.systemLog("CRITICAL", "RESET_DB_ERROR", "Payment DB reset failed", { error: String(err) });
    return { success: false, error: "Failed to reset DB." };
  }
}