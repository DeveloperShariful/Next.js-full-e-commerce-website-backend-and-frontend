// File: app/actions/settings/email/email-logs.ts

"use server";

import { db } from "@/lib/prisma";

export async function getEmailLogs(page: number = 1, search: string = "") {
  try {
    const limit = 20;
    const skip = (page - 1) * limit;
    const trimmed = search.trim();

    const where = trimmed
      ? {
          OR: [
            { recipient: { contains: trimmed, mode: "insensitive" as const } },
            { subject: { contains: trimmed, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      db.emailLog.count({ where }),
    ]);

    return { success: true, logs, total, pages: Math.ceil(total / limit) };
  } catch (error) {
    return { success: false, logs: [], total: 0, pages: 0 };
  }
}