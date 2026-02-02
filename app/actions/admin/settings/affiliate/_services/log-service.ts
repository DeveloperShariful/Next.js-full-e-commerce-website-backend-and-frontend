//File: app/actions/admin/settings/affiliate/_services/log-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { protectAction } from "../permission-service";

// =========================================
// AUDIT LOGS (User Actions)
// =========================================
export async function getAuditLogs(
  page: number = 1, 
  limit: number = 20, 
  search?: string,
  dateRange?: { from: Date; to: Date } 
) {
  await protectAction("MANAGE_CONFIGURATION"); 

  const skip = (page - 1) * limit;
  
  const where: Prisma.AuditLogWhereInput = {
    AND: [
        search ? {
            OR: [
                { action: { contains: search, mode: "insensitive" } },
                { tableName: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { recordId: { contains: search, mode: "insensitive" } } 
            ]
        } : {},
        dateRange ? {
            createdAt: {
                gte: dateRange.from,
                lte: dateRange.to
            }
        } : {}
    ]
  };

  const [total, data] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, image: true, role: true }
        }
      }
    })
  ]);

  return { logs: data, total, totalPages: Math.ceil(total / limit) };
}

// =========================================
// SYSTEM LOGS (Errors & Events)
// =========================================
export async function getSystemLogs(
    page: number = 1, 
    limit: number = 20, 
    level?: string,
    search?: string 
) {
  await protectAction("MANAGE_CONFIGURATION");

  const skip = (page - 1) * limit;
  
  const where: Prisma.SystemLogWhereInput = {
    AND: [
        (level && level !== "ALL") ? { level } : {},
        search ? {
            OR: [
                { message: { contains: search, mode: "insensitive" } },
                { source: { contains: search, mode: "insensitive" } }
            ]
        } : {}
    ]
  };

  const [total, data] = await Promise.all([
    db.systemLog.count({ where }),
    db.systemLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" }
    })
  ]);

  return { logs: data, total, totalPages: Math.ceil(total / limit) };
}

export async function deleteLogsAction(ids: string[], type: "AUDIT" | "SYSTEM") {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION"); 

    if (type === "AUDIT") {
      await db.auditLog.deleteMany({
        where: { id: { in: ids } }
      });
    } else {
      await db.systemLog.deleteMany({
        where: { id: { in: ids } }
      });
    }
    
    if (type !== "AUDIT") { 
       await db.auditLog.create({
         data: {
           userId: actor.id,
           action: "DELETE_LOGS",
           tableName: "SystemLog",
           recordId: "BULK",
           oldValues: { count: ids.length, ids },
           createdAt: new Date()
         }
       });
    }

    return { success: true, message: `Successfully deleted ${ids.length} logs.` };

  } catch (error: any) {
    return { success: false, message: "Failed to delete logs." };
  }
}