// app/actions/settings/payments/get-all-payments.ts
"use server"

import { db } from "@/lib/db"

export async function getAllPaymentMethods() {
  try {
    const methods = await db.paymentMethodConfig.findMany({
      include: {
        stripeConfig: true,
        paypalConfig: true,
        offlineConfig: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    })

    return { success: true, data: methods }
  } catch (error) {
    return { success: false, error: "Failed to fetch payment methods" }
  }
}