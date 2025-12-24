// File: app/actions/settings/email/email-logs.ts

"use server";

import { db } from "@/lib/db";

export async function getEmailLogs(page: number = 1) {
  try {
    const limit = 20;
    const skip = (page - 1) * limit;

    const logs = await db.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip
    });

    const total = await db.emailLog.count();

    return { success: true, logs, total, pages: Math.ceil(total / limit) };
  } catch (error) {
    return { success: false, logs: [], total: 0, pages: 0 };
  }
}