// app/actions/settings/payments/paypal/update-settings.ts
"use server"

import { db } from "@/lib/db"
import { PaypalSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"

export async function updatePaypalSettings(
  paymentMethodId: string,
  values: z.infer<typeof PaypalSettingsSchema>
) {
  try {
    const validated = PaypalSettingsSchema.parse(values)

    await db.$transaction(async (tx) => {
      // 1. Update Parent Config (Enable/Disable handled here)
      await tx.paymentMethodConfig.update({
        where: { id: paymentMethodId },
        data: {
          isEnabled: validated.isEnabled ?? false, // 👈 NEW: Updating status
          name: validated.title,
          description: validated.description ?? "",
          mode: validated.sandbox ? "TEST" : "LIVE",
        }
      })

      // 2. Update PayPal Specific Config
      await tx.paypalConfig.update({
        where: { paymentMethodId },
        data: {
          sandbox: validated.sandbox ?? false,
          
          // Credentials
          liveEmail: validated.liveEmail ?? null,
          liveClientId: validated.liveClientId ?? null,
          liveClientSecret: validated.liveClientSecret ?? null,
          sandboxEmail: validated.sandboxEmail ?? null,
          sandboxClientId: validated.sandboxClientId ?? null,
          sandboxClientSecret: validated.sandboxClientSecret ?? null,

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