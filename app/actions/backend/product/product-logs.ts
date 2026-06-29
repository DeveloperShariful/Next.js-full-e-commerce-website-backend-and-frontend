// File: app/actions/backend/product/product-logs.ts

"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export type ActivityLogEntry = Prisma.ActivityLogGetPayload<{
  include: { user: { select: { name: true; email: true; image: true } } };
}>;

async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!dbUser) return null;
  const allowed = ["SUPER_ADMIN", "ADMIN"] as const;
  if (!(allowed as readonly string[]).includes(dbUser.role)) return null;
  return dbUser;
}

// Internal helper — no auth needed, called from background tasks
async function _doCleanupOldLogs() {
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const result = await db.activityLog.deleteMany({
    where: { createdAt: { lt: fifteenDaysAgo } },
  });
  return { success: true, count: result.count };
}

export async function getProductActivityLogs(page = 1, limit = 20, actionFilter?: string, productId?: string) {
  try {
    if (page === 1) {
      _doCleanupOldLogs().catch(err => console.error("Cleanup bg error", err));
    }

    const skip = (page - 1) * limit;

    const whereCondition: Prisma.ActivityLogWhereInput = {
      entityType: "Product",
    };

    if (actionFilter) {
      whereCondition.action = actionFilter;
    }

    if (productId) {
      whereCondition.entityId = productId;
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
        include: {
          user: {
            select: { name: true, email: true, image: true }
          }
        }
      }),
      db.activityLog.count({ where: whereCondition })
    ]);

    const hasMore = skip + logs.length < total;

    return { success: true, data: logs, hasMore, total };
  } catch (error) {
    console.error("LOG_FETCH_ERROR", error);
    return { success: false, data: [], hasMore: false, total: 0 };
  }
}

export async function deleteActivityLogs(ids: string[]) {
  const user = await getAuthUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    await db.activityLog.deleteMany({
      where: { id: { in: ids } },
    });
    return { success: true, message: "Logs deleted successfully" };
  } catch (error) {
    console.error("DELETE_LOGS_ERROR", error);
    return { success: false, message: "Failed to delete logs" };
  }
}

// Public version — requires SUPER_ADMIN/ADMIN (manual trigger from UI)
export async function cleanupOldLogs() {
  const user = await getAuthUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    return await _doCleanupOldLogs();
  } catch (error) {
    console.error("Auto Cleanup Error:", error);
    return { success: false, count: 0 };
  }
}
