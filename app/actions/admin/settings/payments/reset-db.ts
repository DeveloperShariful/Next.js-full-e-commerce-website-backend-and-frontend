// app/actions/settings/payments/reset-db.ts
"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function resetPaymentMethodsDB() {
  try {
    // 1. Delete all existing configs
    await db.paymentMethodConfig.deleteMany({})

    // 2. Re-create the 5 standard methods
    const methods = [
      { identifier: "stripe", name: "Credit / Debit Card", description: "Pay securely with Visa, Mastercard.", isEnabled: true, mode: "TEST" },
      { identifier: "paypal", name: "PayPal", description: "Pay with PayPal account.", isEnabled: true, mode: "TEST" },
      { identifier: "bank_transfer", name: "Bank Transfer", description: "Direct bank wire transfer.", isEnabled: false, mode: "LIVE" },
      { identifier: "cheque", name: "Cheque Payment", description: "Pay by sending a cheque.", isEnabled: false, mode: "LIVE" },
      { identifier: "cod", name: "Cash on Delivery", description: "Pay upon delivery.", isEnabled: false, mode: "LIVE" }
    ]

    for (const m of methods) {
      const config = await db.paymentMethodConfig.create({
        data: {
          identifier: m.identifier,
          name: m.name,
          description: m.description,
          isEnabled: m.isEnabled,
          mode: m.mode as any
        }
      })

      // Create empty sub-configs
      if (m.identifier === "stripe") await db.stripeConfig.create({ data: { paymentMethodId: config.id } })
      else if (m.identifier === "paypal") await db.paypalConfig.create({ data: { paymentMethodId: config.id } })
      else await db.offlinePaymentConfig.create({ data: { paymentMethodId: config.id } })
    }

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to reset DB" }
  }
}