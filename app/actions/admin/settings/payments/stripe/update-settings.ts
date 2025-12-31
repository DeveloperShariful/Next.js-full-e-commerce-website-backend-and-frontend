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

    // 1. Real-time Verification (Optional but recommended)
    // আমরা এনক্রিপ্ট করার আগেই একবার চেক করে নিচ্ছি কি-টা ভ্যালিড কি না
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

    // 2. Encrypt Sensitive Data
    // যদি ভ্যালু থাকে তবেই এনক্রিপ্ট হবে, নাল বা এম্পটি স্ট্রিং হলে যা আছে তাই থাকবে
    const liveSecretKey = validated.liveSecretKey ? encrypt(validated.liveSecretKey) : ""
    const liveWebhookSecret = validated.liveWebhookSecret ? encrypt(validated.liveWebhookSecret) : ""
    
    const testSecretKey = validated.testSecretKey ? encrypt(validated.testSecretKey) : ""
    const testWebhookSecret = validated.testWebhookSecret ? encrypt(validated.testWebhookSecret) : ""

    // 3. Save to Database
    await db.$transaction(async (tx) => {
      // Update Parent Config
      await tx.paymentMethodConfig.update({
        where: { id: paymentMethodId },
        data: {
          name: validated.title,
          description: validated.description ?? "",
          mode: validated.testMode ? "TEST" : "LIVE",
          isEnabled: validated.enableStripe ?? false
        }
      })

      // Update Stripe Config
      await tx.stripeConfig.upsert({
        where: { paymentMethodId },
        create: {
          paymentMethodId,
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          
          livePublishableKey: validated.livePublishableKey ?? "",
          liveSecretKey,       // 🔒 Encrypted
          liveWebhookSecret,   // 🔒 Encrypted
          
          testPublishableKey: validated.testPublishableKey ?? "",
          testSecretKey,       // 🔒 Encrypted
          testWebhookSecret,   // 🔒 Encrypted

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
        update: {
          testMode: validated.testMode ?? false,
          title: validated.title,
          description: validated.description ?? "",
          
          livePublishableKey: validated.livePublishableKey ?? "",
          liveSecretKey,       // 🔒 Encrypted
          liveWebhookSecret,   // 🔒 Encrypted
          
          testPublishableKey: validated.testPublishableKey ?? "",
          testSecretKey,       // 🔒 Encrypted
          testWebhookSecret,   // 🔒 Encrypted

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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update Stripe settings" 
    }
  }
}