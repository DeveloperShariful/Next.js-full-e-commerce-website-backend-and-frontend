// File: lib/services/audit-service.ts

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
        try {
          const copy = JSON.parse(JSON.stringify(data)); 
          const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apikey', 'creditcard', 'cvv'];
          
          const clean = (obj: any) => {
            for (const key in obj) {
              if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                obj[key] = '***MASKED***';
              } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                clean(obj[key]);
              }
            }
          };
          clean(copy);
          return copy;
        } catch (e) {
          return "Data sanitization failed"; 
        }
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