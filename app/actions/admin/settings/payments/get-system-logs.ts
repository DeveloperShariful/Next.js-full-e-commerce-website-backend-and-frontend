// app/actions/settings/payments/get-system-logs.ts
"use server"

import { db } from "@/lib/prisma"

export async function getPaymentSystemLogs(source?: string) {
  try {
    const logs = await db.systemLog.findMany({
      where: {
        source: source ? source : { in: ["STRIPE", "PAYPAL", "PAYMENT"] }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    })

    return { success: true, data: logs }
  } catch (error) {
    return { success: false, error: "Failed to fetch logs" }
  }
}