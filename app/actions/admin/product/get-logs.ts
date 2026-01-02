// File: app/actions/admin/system/get-logs.ts
"use server";

import { db } from "@/lib/prisma";
import { cleanupOldLogs } from "./delete-log"; // 🔥 Import Cleanup

export async function getProductActivityLogs() {
  try {
    // 🔥 ১. ডাটা আনার আগে অটোমেটিক ক্লিনআপ রান হবে (Background Task)
    // আমরা await দিচ্ছি না যাতে ইউজারের লোডিং টাইম না বাড়ে
    cleanupOldLogs().catch(err => console.error("Cleanup bg error", err));

    // ২. লগ ডাটা আনা
    const logs = await db.activityLog.findMany({
      where: {
        entityType: "Product",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // লাস্ট ১০০টি লগ দেখাবে
      include: {
        user: {
          select: { name: true, email: true, image: true }
        }
      }
    });

    return { success: true, data: logs };
  } catch (error) {
    console.error("LOG_FETCH_ERROR", error);
    return { success: false, data: [] };
  }
}