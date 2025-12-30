//app/actions/settings/payments/stripe/get-system-logs.ts

"use server"

import { db } from "@/lib/prisma"

export async function getStripeLogs() {
  try {
    // ডাটাবেস থেকে শেষ ১০টি লগ নিয়ে আসছি যেখানে source = 'STRIPE'
    // তোমার Prisma Schema তে SystemLog বা Log নামে মডেল থাকতে হবে
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