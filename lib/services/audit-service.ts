// File: lib/services/audit-service.ts

import { db } from "@/lib/prisma";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

// ==========================================
// 1. SAFE DATA SERIALIZATION (New Helper)
// ==========================================

const serializePrismaData = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data === "object" && "toNumber" in data) {
    return data.toNumber(); 
  }

  if (typeof data === "bigint") {
    return data.toString(); 
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map((item) => serializePrismaData(item));
  }
  
  if (typeof data === "object") {
    const newObj: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apikey', 'creditcard', 'cvv'];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
          newObj[key] = '***MASKED***';
        } else {
          newObj[key] = serializePrismaData(data[key]);
        }
      }
    }
    return newObj;
  }
  return data;
};

// ==========================================
// 2. SMART DIFFING ALGORITHM (New Helper)
// ==========================================

function calculateDiff(oldData: any, newData: any) {
  if (!oldData || !newData) return null;
  const diff: Record<string, { from: any; to: any }> = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  const ignoredKeys = ['updatedAt', 'createdAt', 'lastLogin', 'version'];

  allKeys.forEach(key => {
    if (ignoredKeys.includes(key)) return;
    const oldVal = serializePrismaData(oldData[key]);
    const newVal = serializePrismaData(newData[key]);
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { from: oldVal ?? null, to: newVal ?? null };
    }
  });

  return Object.keys(diff).length > 0 ? diff : null;
}

// ==========================================
// 3. AUDIT SERVICE IMPLEMENTATION
// ==========================================

interface AuditParams {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: any;
  newData?: any;
  meta?: any;
}

export const auditService = {
  async log({ userId, action, entity, entityId, oldData, newData, meta }: AuditParams) {
    try {
      const headerList = await headers();
      const ip = headerList.get("x-forwarded-for") || "unknown";
      const userAgent = headerList.get("user-agent") || "system";
      const changes = (oldData && newData) ? calculateDiff(oldData, newData) : null;
      const finalMeta = {
        ...meta,
        ...(changes ? { changes } : {})
      };

      const safeOldData = serializePrismaData(oldData);
      const safeNewData = serializePrismaData(newData);    
      const finalUserId = userId && userId !== "system" ? userId : null;

      await db.auditLog.create({
        data: {
          userId: finalUserId,
          action: action,
          tableName: entity,
          recordId: entityId,
          oldValues: safeOldData ?? Prisma.JsonNull,
          newValues: safeNewData ?? Prisma.JsonNull,
          ipAddress: ip,
          userAgent: userAgent,
        }
      });

    } catch (error) {
      console.error("AUDIT_LOG_FAILED", error);
    }
  },

  async systemLog(level: "INFO" | "WARN" | "ERROR" | "CRITICAL", source: string, message: string, context?: any) {
    try {
      let safeContext = context;
      if (context instanceof Error) {
        safeContext = {
            name: context.name,
            message: context.message,
            stack: process.env.NODE_ENV === 'development' ? context.stack : undefined,
            cause: (context as any).cause
        };
      } else if (typeof context === 'object' && context?.error instanceof Error) {
         safeContext = {
            ...context,
            error: {
                message: context.error.message,
                stack: process.env.NODE_ENV === 'development' ? context.error.stack : undefined
            }
         };
      }
      safeContext = serializePrismaData(safeContext);

      await db.systemLog.create({
        data: {
          level,
          source,
          message,
          context: safeContext ?? Prisma.JsonNull
        }
      });
    } catch (e) {
      console.error("SYSTEM_LOG_FAILED", e);
    }
  }
};