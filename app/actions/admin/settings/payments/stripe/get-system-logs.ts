//app/actions/settings/payments/stripe/get-system-logs.ts

"use server"

import { db } from "@/lib/prisma"

export async function getStripeLogs() {
  try {
    const logs = await db.systemLog.findMany({
      where: {
        source: "STRIPE" 
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    })

    return { success: true, data: logs }
  } catch (error) {
    return { success: false, data: [] }
  }
}