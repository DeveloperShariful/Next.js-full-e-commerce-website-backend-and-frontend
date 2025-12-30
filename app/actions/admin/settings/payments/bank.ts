// app/actions/settings/payments/bank.ts
"use server"

import { db } from "@/lib/prisma"
import { BankTransferSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"

export async function updateBankTransferSettings(
  id: string,
  values: z.infer<typeof BankTransferSchema>
) {
  try {
    const validated = BankTransferSchema.parse(values)

    await db.$transaction(async (tx) => {
      // Update the main config (Name, Description)
      await tx.paymentMethodConfig.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          instructions: validated.instructions,
        },
      })

      // Update the offline specific config (Bank Details JSON)
      await tx.offlinePaymentConfig.update({
        where: { paymentMethodId: id },
        data: {
          bankDetails: validated.bankDetails,
        },
      })
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("Bank update error:", error)
    return { success: false, error: "Failed to update bank settings" }
  }
}