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
        skip: skip,
        // ✅ htmlBody ইচ্ছাকৃতভাবে বাদ — বড় হতে পারে, তালিকা পেজের speed-এর
        // জন্য শুধু preview খোলার সময় আলাদা করে getEmailLogPreview() দিয়ে আনা হয়
        select: {
          id: true, recipient: true, subject: true, templateSlug: true,
          status: true, errorMessage: true, metadata: true, openedAt: true,
          orderId: true, userId: true, createdAt: true,
        },
      }),
      db.emailLog.count({ where }),
    ]);

    return { success: true, logs, total, pages: Math.ceil(total / limit) };
  } catch (error) {
    return { success: false, logs: [], total: 0, pages: 0 };
  }
}

// একটামাত্র log-এর পুরো রেন্ডার হওয়া HTML আনা — শুধু preview খোলার সময় কল হয়
export async function getEmailLogPreview(id: string) {
  try {
    const log = await db.emailLog.findUnique({
      where: { id },
      select: { id: true, subject: true, recipient: true, createdAt: true, htmlBody: true, status: true },
    });
    if (!log) return { success: false, error: "Log not found" };
    return { success: true, log };
  } catch (error) {
    return { success: false, error: "Failed to load preview" };
  }
}