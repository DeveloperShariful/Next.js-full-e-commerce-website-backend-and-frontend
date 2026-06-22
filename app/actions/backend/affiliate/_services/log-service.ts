// File: app/actions/backend/affiliate/_services/log-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { protectAction } from "../permission-service";
import { ActionResponse } from "../types";
import { revalidatePath } from "next/cache";

// =========================================
// TYPES
// =========================================
export type AuditLogRecord = Prisma.AuditLogGetPayload<{
  include: { user: { select: { name: true; email: true; image: true; role: true } } };
}>;

export type SystemLogRecord = {
  id: string;
  level: string;
  source: string;
  message: string;
  context: Prisma.JsonValue | null;
  createdAt: Date;
};

export interface LogStats {
  totalAudit: number;
  totalSystem: number;
  todayAudit: number;
  todaySystem: number;
  systemErrors: number;
  topActions: { action: string; count: number }[];
  topEntities: { tableName: string; count: number }[];
  topActors: { userId: string | null; name: string; count: number }[];
  weeklyAudit: { date: string; count: number }[];
  weeklySystem: { date: string; count: number }[];
}

export interface PaginatedLogs<T> {
  logs: T[];
  total: number;
  totalPages: number;
}

// =========================================
// HELPERS
// =========================================
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// =========================================
// STATS — Overview Tab
// =========================================
export async function getLogStats(): Promise<LogStats> {
  await protectAction("MANAGE_CONFIGURATION");

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekAgo = startOfDay(new Date(now));
  weekAgo.setDate(now.getDate() - 6);

  const [
    totalAudit,
    totalSystem,
    todayAudit,
    todaySystem,
    systemErrors,
    topActionsRaw,
    topEntitiesRaw,
    topActorsRaw,
    weekAuditLogs,
    weekSystemLogs,
  ] = await Promise.all([
    db.auditLog.count(),
    db.systemLog.count(),
    db.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
    db.systemLog.count({ where: { createdAt: { gte: todayStart } } }),
    db.systemLog.count({ where: { level: "ERROR" } }),

    db.auditLog.groupBy({
      by: ["action"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),

    db.auditLog.groupBy({
      by: ["tableName"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),

    db.auditLog.groupBy({
      by: ["userId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
      where: { userId: { not: null } },
    }),

    db.auditLog.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),

    db.systemLog.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Resolve actor names
  const actorIds = topActorsRaw
    .map((a) => a.userId)
    .filter((id): id is string => id !== null);

  const actorUsers =
    actorIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const userMap = new Map(actorUsers.map((u) => [u.id, u.name || u.email]));

  // 7-day buckets
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    return d;
  });

  return {
    totalAudit,
    totalSystem,
    todayAudit,
    todaySystem,
    systemErrors,
    topActions: topActionsRaw.map((a) => ({ action: a.action, count: a._count.id })),
    topEntities: topEntitiesRaw.map((e) => ({ tableName: e.tableName, count: e._count.id })),
    topActors: topActorsRaw.map((a) => ({
      userId: a.userId,
      name: userMap.get(a.userId ?? "") ?? "Unknown",
      count: a._count.id,
    })),
    weeklyAudit: days.map((day) => ({
      date: SHORT_DAY[day.getDay()],
      count: weekAuditLogs.filter((l) => isSameDate(new Date(l.createdAt), day)).length,
    })),
    weeklySystem: days.map((day) => ({
      date: SHORT_DAY[day.getDay()],
      count: weekSystemLogs.filter((l) => isSameDate(new Date(l.createdAt), day)).length,
    })),
  };
}

// =========================================
// AUDIT LOGS
// =========================================
export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  tableName?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<PaginatedLogs<AuditLogRecord>> {
  await protectAction("MANAGE_CONFIGURATION");

  const { page = 1, limit = 20, search, action, tableName, dateFrom, dateTo } = params;
  const skip = (page - 1) * limit;

  const endOfDay = (s: string): Date => {
    const d = new Date(s);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const where: Prisma.AuditLogWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { action: { contains: search, mode: "insensitive" } },
              { tableName: { contains: search, mode: "insensitive" } },
              { recordId: { contains: search, mode: "insensitive" } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {},
      action && action !== "ALL" ? { action } : {},
      tableName && tableName !== "ALL" ? { tableName } : {},
      dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
      dateTo ? { createdAt: { lte: endOfDay(dateTo) } } : {},
    ],
  };

  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, image: true, role: true } },
      },
    }),
  ]);

  return { logs, total, totalPages: Math.ceil(total / limit) };
}

// =========================================
// SYSTEM LOGS
// =========================================
export interface GetSystemLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getSystemLogs(
  params: GetSystemLogsParams = {}
): Promise<PaginatedLogs<SystemLogRecord>> {
  await protectAction("MANAGE_CONFIGURATION");

  const { page = 1, limit = 20, search, level, source, dateFrom, dateTo } = params;
  const skip = (page - 1) * limit;

  const endOfDay = (s: string): Date => {
    const d = new Date(s);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const where: Prisma.SystemLogWhereInput = {
    AND: [
      level && level !== "ALL" ? { level } : {},
      source && source !== "ALL"
        ? { source: { contains: source, mode: "insensitive" } }
        : {},
      search
        ? {
            OR: [
              { message: { contains: search, mode: "insensitive" } },
              { source: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
      dateTo ? { createdAt: { lte: endOfDay(dateTo) } } : {},
    ],
  };

  const [total, logs] = await Promise.all([
    db.systemLog.count({ where }),
    db.systemLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { logs, total, totalPages: Math.ceil(total / limit) };
}

// =========================================
// FILTER OPTIONS
// =========================================
export async function getAuditFilterOptions(): Promise<{
  actions: string[];
  entities: string[];
}> {
  await protectAction("MANAGE_CONFIGURATION");
  const [actionsRaw, entitiesRaw] = await Promise.all([
    db.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
    db.auditLog.findMany({
      select: { tableName: true },
      distinct: ["tableName"],
      orderBy: { tableName: "asc" },
    }),
  ]);
  return {
    actions: actionsRaw.map((a) => a.action),
    entities: entitiesRaw.map((e) => e.tableName),
  };
}

export async function getSystemLogSources(): Promise<string[]> {
  await protectAction("MANAGE_CONFIGURATION");
  const rows = await db.systemLog.findMany({
    select: { source: true },
    distinct: ["source"],
    orderBy: { source: "asc" },
  });
  return rows.map((r) => r.source);
}

// =========================================
// DELETE — Bulk
// =========================================
export async function deleteLogsAction(
  ids: string[],
  type: "AUDIT" | "SYSTEM"
): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    if (type === "AUDIT") {
      await db.auditLog.deleteMany({ where: { id: { in: ids } } });
    } else {
      await db.systemLog.deleteMany({ where: { id: { in: ids } } });
      await db.auditLog.create({
        data: {
          userId: actor.id,
          action: "DELETE_LOGS",
          tableName: "SystemLog",
          recordId: "BULK",
          oldValues: { count: ids.length } as unknown as Prisma.InputJsonValue,
          createdAt: new Date(),
        },
      });
    }

    revalidatePath("/admin/affiliate");
    return {
      success: true,
      message: `Deleted ${ids.length} log${ids.length !== 1 ? "s" : ""}.`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete logs.";
    return { success: false, message: msg };
  }
}

// =========================================
// RETENTION — Clear old logs
// =========================================
export async function clearOldLogsAction(
  olderThanDays: number,
  type: "AUDIT" | "SYSTEM" | "ALL"
): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - olderThanDays);

    let deletedAudit = 0;
    let deletedSystem = 0;

    if (type === "AUDIT" || type === "ALL") {
      const r = await db.auditLog.deleteMany({ where: { createdAt: { lt: threshold } } });
      deletedAudit = r.count;
    }
    if (type === "SYSTEM" || type === "ALL") {
      const r = await db.systemLog.deleteMany({ where: { createdAt: { lt: threshold } } });
      deletedSystem = r.count;
    }

    const total = deletedAudit + deletedSystem;

    if (total > 0) {
      await db.auditLog.create({
        data: {
          userId: actor.id,
          action: "PURGE_LOGS",
          tableName: type === "ALL" ? "AuditLog+SystemLog" : `${type}Log`,
          recordId: "RETENTION",
          oldValues: {
            olderThanDays,
            deletedAudit,
            deletedSystem,
            total,
          } as unknown as Prisma.InputJsonValue,
          createdAt: new Date(),
        },
      });
    }

    revalidatePath("/admin/affiliate");

    if (total === 0) {
      return { success: true, message: `No logs older than ${olderThanDays} days found.` };
    }
    return {
      success: true,
      message: `Purged ${total} logs (${deletedAudit} audit + ${deletedSystem} system) older than ${olderThanDays} days.`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to clear logs.";
    return { success: false, message: msg };
  }
}
