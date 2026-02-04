// File: app/actions/settings/payments/stripe/update-settings.ts

"use server"

import { db } from "@/lib/prisma"
import { StripeSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import Stripe from "stripe"
import { encrypt } from "../crypto" 
import { auditService } from "@/lib/services/audit-service"
import { auth } from "@clerk/nextjs/server"

export async function updateStripeSettings(
  paymentMethodId: string,
  values: z.infer<typeof StripeSettingsSchema>
) {
  const { userId } = await auth();
  
  try {
    const validated = StripeSettingsSchema.parse(values)   
    const oldConfig = await db.stripeConfig.findUnique({
        where: { paymentMethodId },
        include: { paymentMethod: true }
    });

    if (validated.enableStripe) {
      const secretKeyToCheck = validated.testMode 
        ? validated.testSecretKey 
        : validated.liveSecretKey

      const isKeyChanged = validated.testMode 
          ? (secretKeyToCheck && (!oldConfig?.testSecretKey || secretKeyToCheck !== oldConfig.testSecretKey))
          : (secretKeyToCheck && (!oldConfig?.liveSecretKey || secretKeyToCheck !== oldConfig.liveSecretKey));

      if (isKeyChanged) {
          try {
            const stripe = new Stripe(secretKeyToCheck!, { apiVersion: "2025-01-27.acacia" as any });
            await stripe.balance.retrieve(); // Test connection
          } catch (error: any) {
            return { success: false, error: `Stripe Connection Failed: ${error.message}` };
          }
      }
    }

    const liveSecretKey = validated.liveSecretKey ? encrypt(validated.liveSecretKey) : undefined;
    const liveWebhookSecret = validated.liveWebhookSecret ? encrypt(validated.liveWebhookSecret) : undefined;
    const testSecretKey = validated.testSecretKey ? encrypt(validated.testSecretKey) : undefined;
    const testWebhookSecret = validated.testWebhookSecret ? encrypt(validated.testWebhookSecret) : undefined;

    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.update({
        where: { id: paymentMethodId },
        data: {
          name: validated.title,
          description: validated.description ?? "",
          isEnabled: validated.enableStripe ?? false,
          mode: validated.testMode ? "TEST" : "LIVE",
          minOrderAmount: validated.minOrderAmount ? Number(validated.minOrderAmount) : null,
          maxOrderAmount: validated.maxOrderAmount ? Number(validated.maxOrderAmount) : null,         
          surchargeEnabled: validated.surchargeEnabled ?? false,
          surchargeType: validated.surchargeType ?? "fixed", // 'fixed' or 'percentage'
          surchargeAmount: validated.surchargeAmount ? Number(validated.surchargeAmount) : 0,
          taxableSurcharge: validated.taxableSurcharge ?? false
        }
      });

      const newConfig = await tx.stripeConfig.upsert({
        where: { paymentMethodId },
        create: {
          paymentMethodId,
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          livePublishableKey: validated.livePublishableKey ?? "",
          liveSecretKey: liveSecretKey || "",
          liveWebhookSecret: liveWebhookSecret || "",
          testPublishableKey: validated.testPublishableKey ?? "",
          testSecretKey: testSecretKey || "",
          testWebhookSecret: testWebhookSecret || "",
          paymentAction: validated.paymentAction ?? "CAPTURE",
          statementDescriptor: validated.statementDescriptor ?? "",
          shortStatementDescriptor: validated.shortStatementDescriptor ?? "",
          addOrderNumberToStatement: validated.addOrderNumberToStatement ?? false,
          savedCards: validated.savedCards ?? true,
          inlineCreditCardForm: validated.inlineCreditCardForm ?? true,
          applePayEnabled: validated.applePayEnabled ?? true,
          googlePayEnabled: validated.googlePayEnabled ?? true,
          klarnaEnabled: validated.klarnaEnabled ?? false,
          afterpayEnabled: validated.afterpayEnabled ?? false,
          zipEnabled: validated.zipEnabled ?? false,
          paymentRequestButtons: validated.paymentRequestButtons ?? true,
          buttonTheme: validated.buttonTheme ?? "dark",
          debugLog: validated.debugLog ?? false,
        },
        update: {
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          livePublishableKey: validated.livePublishableKey ?? "",
          ...(liveSecretKey && { liveSecretKey }),
          ...(liveWebhookSecret && { liveWebhookSecret }),
          testPublishableKey: validated.testPublishableKey ?? "",
          ...(testSecretKey && { testSecretKey }),
          ...(testWebhookSecret && { testWebhookSecret }),
          paymentAction: validated.paymentAction ?? "CAPTURE",
          statementDescriptor: validated.statementDescriptor ?? "",
          shortStatementDescriptor: validated.shortStatementDescriptor ?? "",
          addOrderNumberToStatement: validated.addOrderNumberToStatement ?? false,
          savedCards: validated.savedCards ?? true,
          inlineCreditCardForm: validated.inlineCreditCardForm ?? true,
          applePayEnabled: validated.applePayEnabled ?? true,
          googlePayEnabled: validated.googlePayEnabled ?? true,
          klarnaEnabled: validated.klarnaEnabled ?? false,
          afterpayEnabled: validated.afterpayEnabled ?? false,
          zipEnabled: validated.zipEnabled ?? false,
          paymentRequestButtons: validated.paymentRequestButtons ?? true,
          buttonTheme: validated.buttonTheme ?? "dark",
          debugLog: validated.debugLog ?? false,
        }
      });

      // 6. Audit Logging
      await auditService.log({
          userId: userId ?? "system",
          action: "UPDATE_STRIPE_SETTINGS",
          entity: "StripeConfig",
          entityId: newConfig.id,
          oldData: {
            enabled: oldConfig?.paymentMethod.isEnabled,
            mode: oldConfig?.testMode
          },
          newData: {
            enabled: validated.enableStripe,
            mode: validated.testMode ? "TEST" : "LIVE",
            surcharge: validated.surchargeEnabled ? `${validated.surchargeAmount} (${validated.surchargeType})` : "Disabled"
          }
      });
    });

    revalidatePath("/admin/settings/payments");
    return { success: true, message: "Stripe settings updated successfully." };

  } catch (error: any) {
    await auditService.systemLog("ERROR", "UPDATE_STRIPE_ACTION", "Failed to update", { error });
    return { success: false, error: "Failed to update settings. Check logs." };
  }
}