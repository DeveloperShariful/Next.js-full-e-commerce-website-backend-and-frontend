// app/actions/settings/payments/paypal/update-settings.ts

"use server"

import { db } from "@/lib/prisma"
import { PaypalSettingsSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { encrypt } from "../crypto"

export async function updatePaypalSettings(
  paymentMethodId: string,
  values: z.infer<typeof PaypalSettingsSchema>
) {
  try {
    const validated = PaypalSettingsSchema.parse(values)

    const liveClientSecret = validated.liveClientSecret ? encrypt(validated.liveClientSecret) : undefined
    const sandboxClientSecret = validated.sandboxClientSecret ? encrypt(validated.sandboxClientSecret) : undefined

    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.update({
        where: { id: paymentMethodId },
        data: {
          isEnabled: validated.isEnabled ?? false,
          name: validated.title,
          description: validated.description ?? "",
          mode: validated.sandbox ? "TEST" : "LIVE",

          minOrderAmount: validated.minOrderAmount,
          maxOrderAmount: validated.maxOrderAmount,
          surchargeEnabled: validated.surchargeEnabled ?? false,
          surchargeType: validated.surchargeType,
          surchargeAmount: validated.surchargeAmount ?? 0,
          taxableSurcharge: validated.taxableSurcharge ?? false
        }
      })

      await tx.paypalConfig.update({
        where: { paymentMethodId },
        data: {
          sandbox: validated.sandbox ?? false,
          
          liveEmail: validated.liveEmail ?? null,
          liveClientId: validated.liveClientId ?? null,
          liveClientSecret: liveClientSecret,
          
          sandboxEmail: validated.sandboxEmail ?? null,
          sandboxClientId: validated.sandboxClientId ?? null,
          sandboxClientSecret: sandboxClientSecret,

          title: validated.title,
          description: validated.description ?? "",
          intent: validated.intent ?? "CAPTURE",
          instantPayments: validated.instantPayments ?? false,
          brandName: validated.brandName ?? null,
          landingPage: validated.landingPage ?? "LOGIN",
          disableFunding: validated.disableFunding ?? [],

          advancedCardEnabled: validated.advancedCardEnabled ?? false,
          advancedCardTitle: validated.advancedCardTitle ?? "Debit & Credit Cards",
          vaultingEnabled: validated.vaultingEnabled ?? false,

          smartButtonLocations: validated.smartButtonLocations ?? [],
          requireFinalConfirmation: validated.requireFinalConfirmation ?? true,
          buttonLabel: validated.buttonLabel ?? "PAYPAL",
          buttonLayout: validated.buttonLayout ?? "VERTICAL",
          buttonColor: validated.buttonColor ?? "GOLD",
          buttonShape: validated.buttonShape ?? "RECT",

          payLaterEnabled: validated.payLaterEnabled ?? true,
          payLaterLocations: validated.payLaterLocations ?? [],
          payLaterMessaging: validated.payLaterMessaging ?? true,
          payLaterMessageTheme: validated.payLaterMessageTheme ?? "light",

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