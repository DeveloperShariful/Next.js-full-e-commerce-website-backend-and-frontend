// File: lib/audit-service.ts

import { db } from "@/lib/prisma";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

// ==========================================
// 1. SAFE DATA SERIALIZATION
// ==========================================
const serializePrismaData = (data: unknown): unknown => {
  if (data === null || data === undefined) return data;

  // Prisma Decimal
  if (
    typeof data === "object" &&
    data !== null &&
    "toNumber" in data &&
    typeof (data as { toNumber: unknown }).toNumber === "function"
  ) {
    return (data as { toNumber: () => number }).toNumber();
  }

  if (typeof data === "bigint") return data.toString();
  if (data instanceof Date) return data.toISOString();
  if (Array.isArray(data)) return data.map((item) => serializePrismaData(item));

  if (typeof data === "object" && data !== null) {
    const newObj: Record<string, unknown> = {};
    const sensitiveKeys = ["password", "token", "secret", "key", "apikey", "creditcard", "cvv"];

    for (const key in data as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
          newObj[key] = "***MASKED***";
        } else {
          newObj[key] = serializePrismaData((data as Record<string, unknown>)[key]);
        }
      }
    }
    return newObj;
  }

  return data;
};

// ==========================================
// 2. DIFFING ALGORITHM
// ==========================================
function calculateDiff(oldData: unknown, newData: unknown) {
  if (!oldData || !newData) return null;
  if (typeof oldData !== "object" || typeof newData !== "object") return null;

  const diff: Record<string, { from: unknown; to: unknown }> = {};
  const allKeys = new Set([
    ...Object.keys(oldData as object),
    ...Object.keys(newData as object),
  ]);
  const ignoredKeys = ["updatedAt", "createdAt", "lastLogin", "version"];

  allKeys.forEach((key) => {
    if (ignoredKeys.includes(key)) return;
    const oldVal = serializePrismaData((oldData as Record<string, unknown>)[key]);
    const newVal = serializePrismaData((newData as Record<string, unknown>)[key]);

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { from: oldVal ?? null, to: newVal ?? null };
    }
  });

  return Object.keys(diff).length > 0 ? diff : null;
}

// ==========================================
// 3. AUDIT SERVICE
// ==========================================

interface AuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  meta?: unknown;
}

export const auditService = {
  async log({ userId, action, entity, entityId, oldData, newData }: AuditParams) {
    const safeOldData = serializePrismaData(oldData);
    const safeNewData = serializePrismaData(newData);
    const finalUserId = userId && userId !== "system" ? userId : null;

    const getRequestInfo = async () => {
      try {
        const headerList = await headers();
        return {
          ip: headerList.get("x-forwarded-for") || "unknown",
          userAgent: headerList.get("user-agent") || "system",
        };
      } catch {
        return { ip: "unknown", userAgent: "system" };
      }
    };

    const { ip, userAgent } = await getRequestInfo();

    try {
      await db.auditLog.create({
        data: {
          userId: finalUserId,
          action,
          tableName: entity,
          recordId: entityId,
          oldValues: (safeOldData ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
          newValues: (safeNewData ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
          ipAddress: ip,
          userAgent,
        },
      });
    } catch (error: unknown) {
      const isPrismaFKError =
        error instanceof Error &&
        (("code" in error && (error as { code?: string }).code === "P2003") ||
          error.message?.includes("Foreign key constraint violated"));

      if (isPrismaFKError) {
        try {
          await db.auditLog.create({
            data: {
              userId: null,
              action,
              tableName: entity,
              recordId: entityId,
              oldValues: (safeOldData ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
              newValues: (safeNewData ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
              ipAddress: ip,
              userAgent,
            },
          });
        } catch (retryError) {
          console.error("❌ AUDIT FATAL:", retryError);
        }
      } else {
        console.error("❌ AUDIT ERROR:", error instanceof Error ? error.message : String(error));
      }
    }
  },

  async systemLog(
    level: "INFO" | "WARN" | "ERROR" | "CRITICAL",
    source: string,
    message: string,
    context?: unknown
  ) {
    try {
      let safeContext: unknown = context;

      if (context instanceof Error) {
        safeContext = {
          name: context.name,
          message: context.message,
          stack: process.env.NODE_ENV === "development" ? context.stack : undefined,
          cause: context.cause,
        };
      } else if (
        typeof context === "object" &&
        context !== null &&
        "error" in context &&
        (context as { error: unknown }).error instanceof Error
      ) {
        const contextObj = context as Record<string, unknown>;
        const err = contextObj.error as Error;
        safeContext = {
          ...contextObj,
          error: {
            message: err.message,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
          },
        };
      }

      safeContext = serializePrismaData(safeContext);

      await db.systemLog.create({
        data: {
          level,
          source,
          message,
          context: (safeContext ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      console.error("SYSTEM_LOG_FAILED", e);
    }
  },
};
