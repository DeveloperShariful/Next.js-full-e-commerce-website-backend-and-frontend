// app/actions/settings/payments/cod.ts
"use server"

import { db } from "@/lib/prisma"
import { CodSchema } from "@/app/(admin)/admin/settings/payments/schemas"
import { z } from "zod"
import { revalidatePath } from "next/cache"

export async function updateCodSettings(
  id: string,
  values: z.infer<typeof CodSchema>
) {
  try {
    const validated = CodSchema.parse(values)

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
          enableForShippingMethods: validated.enableForShippingMethods,
        },
      })
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    console.error("COD update error:", error)
    return { success: false, error: "Failed to update COD settings" }
  }
}