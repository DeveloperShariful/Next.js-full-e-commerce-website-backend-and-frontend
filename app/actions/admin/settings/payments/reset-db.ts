// app/actions/settings/payments/reset-db.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PaymentMode } from "@prisma/client" // Enum Import

export async function resetPaymentMethodsDB() {
  try {
    await db.$transaction(async (tx) => {
      // 1. Delete all existing configs safely
      // Cascade delete will handle related tables (StripeConfig, PaypalConfig, etc.)
      await tx.paymentMethodConfig.deleteMany({})

      // 2. Define standard methods
      const methods = [
        { identifier: "stripe", name: "Credit / Debit Card", description: "Pay securely with Visa, Mastercard.", isEnabled: true, mode: "TEST" },
        { identifier: "paypal", name: "PayPal", description: "Pay with PayPal account.", isEnabled: true, mode: "TEST" },
        { identifier: "bank_transfer", name: "Bank Transfer", description: "Direct bank wire transfer.", isEnabled: false, mode: "LIVE" },
        { identifier: "cheque", name: "Cheque Payment", description: "Pay by sending a cheque.", isEnabled: false, mode: "LIVE" },
        { identifier: "cod", name: "Cash on Delivery", description: "Pay upon delivery.", isEnabled: false, mode: "LIVE" }
      ]

      // 3. Create methods one by one inside transaction
      for (const m of methods) {
        const config = await tx.paymentMethodConfig.create({
          data: {
            identifier: m.identifier,
            name: m.name,
            description: m.description,
            isEnabled: m.isEnabled,
            mode: m.mode as PaymentMode
          }
        })

        // Create empty sub-configs based on identifier
        if (m.identifier === "stripe") {
            await tx.stripeConfig.create({ data: { paymentMethodId: config.id } })
        } 
        else if (m.identifier === "paypal") {
            await tx.paypalConfig.create({ data: { paymentMethodId: config.id } })
        } 
        else {
            await tx.offlinePaymentConfig.create({ data: { paymentMethodId: config.id } })
        }
      }
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("Reset DB Error:", error)
    return { success: false, error: "Failed to reset DB. Check server logs." }
  }
}