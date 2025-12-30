// app/actions/settings/payments/toggle-method-status.ts
"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function togglePaymentMethodStatus(id: string, isEnabled: boolean) {
  try {
    await db.paymentMethodConfig.update({
      where: { id },
      data: { isEnabled },
    })

    revalidatePath("/admin/settings/payments")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update status" }
  }
}