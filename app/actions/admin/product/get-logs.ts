// File: app/actions/admin/product/get-logs.ts

"use server";

import { db } from "@/lib/prisma";
import { cleanupOldLogs } from "./delete-log"; 

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