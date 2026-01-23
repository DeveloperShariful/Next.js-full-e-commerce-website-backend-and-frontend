// File: app/actions/admin/system/delete-log.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ১. ম্যানুয়াল ডিলিট (সিলেক্টেড লগস)
export async function deleteActivityLogs(ids: string[]) {
  try {
    await db.activityLog.deleteMany({
      where: { id: { in: ids } },
    });
    return { success: true, message: "Logs deleted successfully" };
  } catch (error) {
    return { success: false, message: "Failed to delete logs" };
  }
}

export async function cleanupOldLogs() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo, // Less than 30 days ago
        },
      },
    });
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Auto Cleanup Error:", error);
    return { success: false, count: 0 };
  }
}