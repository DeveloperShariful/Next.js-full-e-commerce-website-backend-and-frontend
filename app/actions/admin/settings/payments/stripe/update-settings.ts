// app/actions/settings/payments/stripe/update-settings.ts
"use server"

import { db } from "@/lib/prisma"
import { StripeSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import Stripe from "stripe"
import { encrypt } from "../crypto" 

export async function updateStripeSettings(
  paymentMethodId: string,
  values: z.infer<typeof StripeSettingsSchema>
) {
  try {
    const validated = StripeSettingsSchema.parse(values)

    // 1. Stripe Connection Validatiom
    if (validated.enableStripe) {
      const secretKeyToCheck = validated.testMode 
        ? validated.testSecretKey 
        : validated.liveSecretKey

      if (!secretKeyToCheck) {
        return { success: false, error: "Please enter the Secret Key before enabling Stripe." }
      }

      try {
        const stripe = new Stripe(secretKeyToCheck, {
          apiVersion: "2025-01-27.acacia" as any, 
          typescript: true,
        })
        await stripe.balance.retrieve() 
      } catch (error: any) {
        console.error("Stripe Verification Failed:", error.message)
        return { 
          success: false, 
          error: `Authentication Failed: ${error.message}` 
        }
      }
    }

    // 2. Encryption
    const liveSecretKey = validated.liveSecretKey ? encrypt(validated.liveSecretKey) : ""
    const liveWebhookSecret = validated.liveWebhookSecret ? encrypt(validated.liveWebhookSecret) : ""
    
    const testSecretKey = validated.testSecretKey ? encrypt(validated.testSecretKey) : ""
    const testWebhookSecret = validated.testWebhookSecret ? encrypt(validated.testWebhookSecret) : ""

    // 3. Database Transaction with INCREASED TIMEOUT
    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.update({
        where: { id: paymentMethodId },
        data: {
          name: validated.title,
          description: validated.description ?? "",
          mode: validated.testMode ? "TEST" : "LIVE",
          isEnabled: validated.enableStripe ?? false,
          
          minOrderAmount: validated.minOrderAmount,
          maxOrderAmount: validated.maxOrderAmount,
          surchargeEnabled: validated.surchargeEnabled ?? false,
          surchargeType: validated.surchargeType,
          surchargeAmount: validated.surchargeAmount ?? 0,
          taxableSurcharge: validated.taxableSurcharge ?? false
        }
      })

      await tx.stripeConfig.upsert({
        where: { paymentMethodId },
        create: {
          paymentMethodId,
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          
          livePublishableKey: validated.livePublishableKey ?? "",
          liveSecretKey,
          liveWebhookSecret,
          
          testPublishableKey: validated.testPublishableKey ?? "",
          testSecretKey,
          testWebhookSecret,

          paymentAction: validated.paymentAction ?? "CAPTURE",
          statementDescriptor: validated.statementDescriptor ?? "",
          shortStatementDescriptor: validated.shortStatementDescriptor ?? "",
          addOrderNumberToStatement: validated.addOrderNumberToStatement ?? false,
          
          savedCards: validated.savedCards ?? true,
          inlineCreditCardForm: validated.inlineCreditCardForm ?? true,
          
          applePayEnabled: validated.applePayEnabled ?? true,
          googlePayEnabled: validated.googlePayEnabled ?? true,
          paymentRequestButtons: validated.paymentRequestButtons ?? true,
          
          klarnaEnabled: validated.klarnaEnabled ?? false,
          afterpayEnabled: validated.afterpayEnabled ?? false,
          zipEnabled: validated.zipEnabled ?? false,

          buttonTheme: validated.buttonTheme ?? "dark",
          debugLog: validated.debugLog ?? false,
        },
        update: {
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          
          livePublishableKey: validated.livePublishableKey ?? "",
          liveSecretKey,
          liveWebhookSecret,
          
          testPublishableKey: validated.testPublishableKey ?? "",
          testSecretKey,
          testWebhookSecret,

          paymentAction: validated.paymentAction ?? "CAPTURE",
          statementDescriptor: validated.statementDescriptor ?? "",
          shortStatementDescriptor: validated.shortStatementDescriptor ?? "",
          addOrderNumberToStatement: validated.addOrderNumberToStatement ?? false,
          
          savedCards: validated.savedCards ?? true,
          inlineCreditCardForm: validated.inlineCreditCardForm ?? true,
          
          applePayEnabled: validated.applePayEnabled ?? true,
          googlePayEnabled: validated.googlePayEnabled ?? true,
          paymentRequestButtons: validated.paymentRequestButtons ?? true,

          klarnaEnabled: validated.klarnaEnabled ?? false,
          afterpayEnabled: validated.afterpayEnabled ?? false,
          zipEnabled: validated.zipEnabled ?? false,

          buttonTheme: validated.buttonTheme ?? "dark",
          debugLog: validated.debugLog ?? false,
        }
      })
    }, {
        // 🔥 FIX: কানেকশনের জন্য ১০ সেকেন্ড এবং ট্রানজ্যাকশনের জন্য ২০ সেকেন্ড সময় দেওয়া হলো
        maxWait: 10000, // default: 2000
        timeout: 20000  // default: 5000
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("Stripe settings update error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update Stripe settings" 
    }
  }
}