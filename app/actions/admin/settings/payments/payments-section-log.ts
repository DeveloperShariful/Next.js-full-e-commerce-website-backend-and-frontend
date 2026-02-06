// File: app/actions/settings/payments/payments-section-log.ts

"use server"

import { db } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function getPaymentAuditLogs() {
  try {
    const { userId } = await auth(); 
    const logs = await db.auditLog.findMany({
      where: {
        tableName: {
          in: ["StripeConfig", "PaypalConfig", "PaymentMethodConfig", "OfflinePaymentConfig"]
        }
      },
      include: {
        user: {
          select: { name: true, email: true, image: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return { success: false, error: "Failed to fetch logs", data: [] }
  }
}

