// app/actions/settings/payments/stripe/update-settings.ts
"use server"

import { db } from "@/lib/db"
import { StripeSettingsSchema } from "@/app/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"

export async function updateStripeSettings(
  paymentMethodId: string,
  values: z.infer<typeof StripeSettingsSchema>
) {
  try {
    const validated = StripeSettingsSchema.parse(values)

    await db.$transaction(async (tx) => {
      // 1. Parent Config (PaymentMethodConfig) আপডেট করা
      await tx.paymentMethodConfig.update({
        where: { id: paymentMethodId },
        data: {
          name: validated.title,
          description: validated.description ?? "",
          mode: validated.testMode ? "TEST" : "LIVE",
          isEnabled: validated.enableStripe ?? false
        }
      })

      // 2. Stripe Specific Config (Upsert ব্যবহার করা হয়েছে)
      // 👇 FIX: Changed from .update() to .upsert()
      await tx.stripeConfig.upsert({
        where: { paymentMethodId },
        // যদি ডাটা না থাকে, তবে নতুন তৈরি করবে (Create)
        create: {
          paymentMethodId, // Foreign key link
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          
          livePublishableKey: validated.livePublishableKey ?? "",
          liveSecretKey: validated.liveSecretKey ?? "",
          liveWebhookSecret: validated.liveWebhookSecret ?? "",
          
          testPublishableKey: validated.testPublishableKey ?? "",
          testSecretKey: validated.testSecretKey ?? "",
          testWebhookSecret: validated.testWebhookSecret ?? "",

          paymentAction: validated.paymentAction ?? "CAPTURE",
          statementDescriptor: validated.statementDescriptor ?? "",
          shortStatementDescriptor: validated.shortStatementDescriptor ?? "",
          addOrderNumberToStatement: validated.addOrderNumberToStatement ?? false,
          
          savedCards: validated.savedCards ?? true,
          inlineCreditCardForm: validated.inlineCreditCardForm ?? true,
          
          applePayEnabled: validated.applePayEnabled ?? true,
          googlePayEnabled: validated.googlePayEnabled ?? true,
          paymentRequestButtons: validated.paymentRequestButtons ?? true,
          buttonTheme: validated.buttonTheme ?? "dark",
          
          debugLog: validated.debugLog ?? false,
        },
        // যদি ডাটা থাকে, তবে আপডেট করবে (Update)
        update: {
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          
          livePublishableKey: validated.livePublishableKey ?? "",
          liveSecretKey: validated.liveSecretKey ?? "",
          liveWebhookSecret: validated.liveWebhookSecret ?? "",
          
          testPublishableKey: validated.testPublishableKey ?? "",
          testSecretKey: validated.testSecretKey ?? "",
          testWebhookSecret: validated.testWebhookSecret ?? "",

          paymentAction: validated.paymentAction ?? "CAPTURE",
          statementDescriptor: validated.statementDescriptor ?? "",
          shortStatementDescriptor: validated.shortStatementDescriptor ?? "",
          addOrderNumberToStatement: validated.addOrderNumberToStatement ?? false,
          
          savedCards: validated.savedCards ?? true,
          inlineCreditCardForm: validated.inlineCreditCardForm ?? true,
          
          applePayEnabled: validated.applePayEnabled ?? true,
          googlePayEnabled: validated.googlePayEnabled ?? true,
          paymentRequestButtons: validated.paymentRequestButtons ?? true,
          buttonTheme: validated.buttonTheme ?? "dark",
          
          debugLog: validated.debugLog ?? false,
        }
      })
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("Stripe settings update error:", error)
    // এরর মেসেজটি রিটার্ন করা হচ্ছে যাতে টোস্টে দেখা যায়
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update Stripe settings" 
    }
  }
}