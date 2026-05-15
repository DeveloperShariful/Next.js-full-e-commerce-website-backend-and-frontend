// File Location: app/actions/admin/all-activity-log/all-activity-log.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// --- 1. GET ACTIVITY LOGS (WITH ADVANCED FILTERS) ---
export async function getActivityLogs({
  page = 1,
  limit = 20,
  query,
  action,
  entityType,
  userId,
  startDate,
  endDate
}: {
  page?: number;
  limit?: number;
  query?: string;
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const skip = (page - 1) * limit;

    // ✅ STRICT PRISMA WHERE INPUT
    const whereCondition: Prisma.ActivityLogWhereInput = {
      AND: [
        // 1. Search Query (Action name, User name, User email, IP Address)
        query ? {
          OR: [
            { action: { contains: query, mode: 'insensitive' } },
            { ipAddress: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } }
          ]
        } : {},

        // 2. Exact Match Filters
        action && action !== 'all' ? { action: action } : {},
        entityType && entityType !== 'all' ? { entityType: entityType } : {},
        userId && userId !== 'all' ? { userId: userId } : {},

        // 3. Date Range Filter
        startDate ? { createdAt: { gte: new Date(startDate) } } : {},
        endDate ? { createdAt: { lte: new Date(endDate) } } : {}
      ]
    };

    // Parallel fetching for performance
    const [logs, totalCount] = await Promise.all([
      db.activityLog.findMany({
        where: whereCondition,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.activityLog.count({ where: whereCondition })
    ]);

    // Safely Serialize JSON data
    const serializedLogs = JSON.parse(JSON.stringify(logs));

    return { 
      success: true, 
      data: serializedLogs,
      meta: { total: totalCount, pages: Math.ceil(totalCount / limit) }
    };

  } catch (error) {
    console.error("GET_LOGS_ERROR", error);
    return { success: false, data: [], meta: { total: 0, pages: 0 }, error: "Failed to fetch logs" };
  }
}

// --- 2. GET FILTER OPTIONS (100% DYNAMIC) ---
// This function dynamically fetches all unique Actions, EntityTypes, and Admin Users 
// directly from the DB to populate the WooCommerce style dropdown filters.
export async function getLogFilterOptions() {
    try {
        const [actions, entityTypes, users] = await Promise.all([
            db.activityLog.findMany({
                distinct: ['action'],
                select: { action: true },
                where: { action: { not: '' } }
            }),
            db.activityLog.findMany({
                distinct: ['entityType'],
                select: { entityType: true },
                where: { entityType: { not: null } }
            }),
            db.user.findMany({
                where: { activityLogs: { some: {} } }, // Only users who have logs
                select: { id: true, name: true, email: true },
                orderBy: { name: 'asc' }
            })
        ]);

        return {
            success: true,
            data: {
                actions: actions.map(a => a.action),
                entityTypes: entityTypes.map(e => e.entityType).filter(Boolean),
                users: users
            }
        };
    } catch (error) {
        console.error("GET_LOG_FILTERS_ERROR", error);
        return { success: false, data: { actions: [], entityTypes: [], users: [] } };
    }
}

// --- 3. DELETE SINGLE LOG ---
export async function deleteLog(id: string) {
  try {
    if (!id) return { success: false, error: "ID is required" };
    
    await db.activityLog.delete({ where: { id } });
    revalidatePath("/admin/logs");
    return { success: true, message: "Log entry deleted permanently" };
  } catch (error) {
    console.error("DELETE_LOG_ERROR", error);
    return { success: false, error: "Failed to delete log" };
  }
}

// --- 4. BULK DELETE LOGS ---
export async function deleteBulkLogs(ids: string[]) {
    try {
      if (!ids || ids.length === 0) return { success: false, error: "No logs selected" };
      
      await db.activityLog.deleteMany({ where: { id: { in: ids } } });
      revalidatePath("/admin/logs");
      return { success: true, message: `${ids.length} logs deleted permanently` };
    } catch (error) {
      console.error("BULK_DELETE_LOGS_ERROR", error);
      return { success: false, error: "Failed to delete logs" };
    }
}

// --- 5. CLEAR ALL LOGS (WARNING: DESTRUCTIVE) ---
export async function clearAllLogs() {
  try {
    await db.activityLog.deleteMany({});
    revalidatePath("/admin/logs");
    return { success: true, message: "All activity history cleared successfully" };
  } catch (error) {
    console.error("CLEAR_LOGS_ERROR", error);
    return { success: false, error: "Failed to clear logs" };
  }
}