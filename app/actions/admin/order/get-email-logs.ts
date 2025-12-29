// File Location: app/actions/admin/order/get-email-logs.ts

"use server";

import { db } from "@/lib/db";

export async function getEmailLogs(orderId: string) {
  try {
    if (!orderId) return { success: false, data: [] };

    const logs = await db.emailLog.findMany({
      where: { orderId: orderId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        recipient: true,
        status: true,     // SENT, QUEUED, FAILED
        openedAt: true,   // ইমেইল ওপেন হয়েছে কিনা
        createdAt: true,
        templateSlug: true
      }
    });

    return { success: true, data: logs };

  } catch (error) {
    console.error("GET_EMAIL_LOGS_ERROR", error);
    return { success: false, data: [] };
  }
}