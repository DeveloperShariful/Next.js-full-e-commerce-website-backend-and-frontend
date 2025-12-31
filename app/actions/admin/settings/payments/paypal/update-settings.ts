// app/actions/settings/payments/paypal/update-settings.ts
"use server"

import { db } from "@/lib/prisma"
import { PaypalSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { encrypt } from "../crypto" // 👈 Encryption Import

export async function updatePaypalSettings(
  paymentMethodId: string,
  values: z.infer<typeof PaypalSettingsSchema>
) {
  try {
    const validated = PaypalSettingsSchema.parse(values)

    // 🔒 সিক্রেট কি গুলো এনক্রিপ্ট করছি (যদি ইউজার নতুন ভ্যালু দিয়ে থাকে)
    const liveClientSecret = validated.liveClientSecret ? encrypt(validated.liveClientSecret) : undefined
    const sandboxClientSecret = validated.sandboxClientSecret ? encrypt(validated.sandboxClientSecret) : undefined

    await db.$transaction(async (tx) => {
      // 1. Update Parent Config
      await tx.paymentMethodConfig.update({
        where: { id: paymentMethodId },
        data: {
          isEnabled: validated.isEnabled ?? false,
          name: validated.title,
          description: validated.description ?? "",
          mode: validated.sandbox ? "TEST" : "LIVE",
        }
      })

      // 2. Update PayPal Specific Config
      // Prisma তে undefined পাঠালে সেই ফিল্ড আপডেট হয় না (যা আমরা চাই)
      await tx.paypalConfig.update({
        where: { paymentMethodId },
        data: {
          sandbox: validated.sandbox ?? false,
          
          // Credentials (Encrypted)
          liveEmail: validated.liveEmail ?? null,
          liveClientId: validated.liveClientId ?? null,
          liveClientSecret: liveClientSecret, // 🔒 Encrypted or undefined
          
          sandboxEmail: validated.sandboxEmail ?? null,
          sandboxClientId: validated.sandboxClientId ?? null,
          sandboxClientSecret: sandboxClientSecret, // 🔒 Encrypted or undefined

          // General Settings
          title: validated.title,
          description: validated.description ?? "",
          intent: validated.intent ?? "CAPTURE",
          instantPayments: validated.instantPayments ?? false,
          brandName: validated.brandName ?? null,
          landingPage: validated.landingPage ?? "LOGIN",
          disableFunding: validated.disableFunding ?? [],

          // Advanced Card
          advancedCardEnabled: validated.advancedCardEnabled ?? false,
          advancedCardTitle: validated.advancedCardTitle ?? "Debit & Credit Cards",
          vaultingEnabled: validated.vaultingEnabled ?? false,

          // Smart Button Styles
          smartButtonLocations: validated.smartButtonLocations ?? [],
          requireFinalConfirmation: validated.requireFinalConfirmation ?? true,
          buttonLabel: validated.buttonLabel ?? "PAYPAL",
          buttonLayout: validated.buttonLayout ?? "VERTICAL",
          buttonColor: validated.buttonColor ?? "GOLD",
          buttonShape: validated.buttonShape ?? "RECT",

          // Pay Later
          payLaterEnabled: validated.payLaterEnabled ?? true,
          payLaterLocations: validated.payLaterLocations ?? [],
          payLaterMessaging: validated.payLaterMessaging ?? true,
          payLaterMessageTheme: validated.payLaterMessageTheme ?? "light",

          // Advanced / Debug
          subtotalMismatchBehavior: validated.subtotalMismatchBehavior ?? "add_line_item",
          invoicePrefix: validated.invoicePrefix ?? null,
          debugLog: validated.debugLog ?? false,
        }
      })
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("PayPal settings update error:", error)
    return { success: false, error: "Failed to update PayPal settings" }
  }
}