//lib/services/audit-service.ts

import { db } from "@/lib/prisma";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

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

      const sanitize = (data: any) => {
        if (!data) return null;
        const copy = { ...data };
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey'];
        sensitiveKeys.forEach(k => {
          if (copy[k]) copy[k] = '***MASKED***';
        });
        return copy;
      };
      
      const finalUserId = userId && userId !== "system" ? userId : null;

      await db.auditLog.create({
        data: {
          userId: finalUserId,
          action: action,
          tableName: entity,
          recordId: entityId,
          oldValues: sanitize(oldData) ?? Prisma.JsonNull,
          newValues: sanitize(newData) ?? Prisma.JsonNull,
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
      await db.systemLog.create({
        data: {
          level,
          source,
          message,
          context: context ?? Prisma.JsonNull
        }
      });
    } catch (e) {
      console.error("SYSTEM_LOG_FAILED", e);
    }
  }
};