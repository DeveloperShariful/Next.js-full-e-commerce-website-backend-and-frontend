"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. ম্যানুয়াল ডিলেট (সিলেক্ট করা গুলো)
export async function deleteEmailLogs(ids: string[]) {
  try {
    await db.emailLog.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    revalidatePath("/admin/settings/email");
    return { success: true, message: "Logs deleted successfully" };
  } catch (error) {
    return { success: false, error: "Failed to delete logs" };
  }
}

// 2. অটোমেটিক ক্লিনআপ (৩০ দিনের পুরনো)
export async function cleanupOldLogs() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.emailLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo // Less than 30 days ago
        }
      }
    });

    revalidatePath("/admin/settings/email");
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Cleanup Error:", error);
    return { success: false, error: "Failed to cleanup old logs" };
  }
}