// File: app/actions/backend/product/product-logs.ts

"use server";

import { db } from "@/lib/prisma";

export async function getProductActivityLogs(page = 1, limit = 20, actionFilter?: string, productId?: string) {
  try {
    if (page === 1) {
        cleanupOldLogs().catch(err => console.error("Cleanup bg error", err));
    }

    const skip = (page - 1) * limit;

    const whereCondition: any = {
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