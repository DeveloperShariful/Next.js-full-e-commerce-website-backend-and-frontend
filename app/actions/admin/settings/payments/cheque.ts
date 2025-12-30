// app/actions/settings/payments/cheque.ts
"use server"

import { db } from "@/lib/prisma"
import { ChequeSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"

export async function updateChequeSettings(
  id: string,
  values: z.infer<typeof ChequeSchema>
) {
  try {
    const validated = ChequeSchema.parse(values)

    await db.$transaction(async (tx) => {
      await tx.paymentMethodConfig.update({
        where: { id },
        data: {
          name: validated.name,
          description: validated.description,
          instructions: validated.instructions,
        },
      })

      await tx.offlinePaymentConfig.update({
        where: { paymentMethodId: id },
        data: {
          chequePayTo: validated.chequePayTo,
          addressInfo: validated.addressInfo,
        },
      })
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("Cheque update error:", error)
    return { success: false, error: "Failed to update cheque settings" }
  }
}