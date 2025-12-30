// app/actions/log.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- 1. GET ACTIVITY LOGS ---
export async function getActivityLogs(page: number = 1, limit: number = 20, query?: string) {
  try {
    const skip = (page - 1) * limit;

    const whereCondition: any = query ? {
      OR: [
        { action: { contains: query, mode: 'insensitive' } },
        { user: { name: { contains: query, mode: 'insensitive' } } },
        { user: { email: { contains: query, mode: 'insensitive' } } }
      ]
    } : {};

    const [logs, totalCount] = await Promise.all([
      db.activityLog.findMany({
        where: whereCondition,
        include: {
          user: {
            select: { name: true, email: true, image: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.activityLog.count({ where: whereCondition })
    ]);

    return { 
      success: true, 
      data: logs,
      meta: { total: totalCount, pages: Math.ceil(totalCount / limit) }
    };

  } catch (error) {
    console.error("GET_LOGS_ERROR", error);
    return { success: false, data: [], meta: { total: 0, pages: 0 } };
  }
}

// --- 2. DELETE SINGLE LOG ---
export async function deleteLog(id: string) {
  try {
    await db.activityLog.delete({ where: { id } });
    revalidatePath("/admin/logs");
    return { success: true, message: "Log entry deleted" };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

// --- 3. CLEAR ALL LOGS (Optional Utility) ---
export async function clearAllLogs() {
  try {
    await db.activityLog.deleteMany({});
    revalidatePath("/admin/logs");
    return { success: true, message: "All logs cleared" };
  } catch (error) {
    return { success: false, error: "Failed to clear logs" };
  }
}