// File: app/actions/settings/payments/payments-section-log.ts
"use server"

import { db } from "@/lib/prisma"

export async function getPaymentSystemLogs(source?: string) {
  try {
    const whereClause = source 
      ? { source } 
      : { source: { in: ["STRIPE", "PAYPAL", "BANK_TRANSFER", "CHEQUE", "COD", "PAYMENT_GENERAL"] } };

    const logs = await db.systemLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    })

    return { success: true, data: logs }
  } catch (error) {
    return { success: false, error: "Failed to fetch logs" , data: [] }
  }
}

