"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// ─── WEBHOOK LOGS ─────────────────────────────────────────────────────────────

export interface WebhookLogItem {
  id: string
  provider: string
  eventId: string
  eventType: string
  processed: boolean
  processingError: string | null
  retryCount: number
  createdAt: Date
  payload: unknown
}

export async function getWebhookLogs(daysLimit = 30): Promise<{ success: boolean; data?: WebhookLogItem[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Unauthorized" };

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysLimit);

    const logs = await db.paymentWebhookLog.findMany({
      where: { createdAt: { gte: dateLimit } },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return { success: true, data: logs };
  } catch (error) {
    console.error("Failed to fetch webhook logs:", error);
    return { success: false, error: "Failed to load webhook logs." };
  }
}

export async function bulkDeleteWebhookLogs(ids: string[]): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await db.paymentWebhookLog.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/settings/payments/logs");
    return { success: true, message: `Deleted ${ids.length} webhook logs.` };
  } catch (error) {
    return { success: false, error: "Failed to delete webhook logs." };
  }
}

export async function autoCleanupWebhookLogs(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await db.paymentWebhookLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });

    revalidatePath("/admin/settings/payments/logs");
    return { success: true, message: `Deleted ${deleted.count} old webhook logs.` };
  } catch (error) {
    return { success: false, error: "Failed to cleanup webhook logs." };
  }
}

// 1. Fetch All Logs (Admin Actions + System Errors/Transactions)
export async function getPaymentLogs(daysLimit = 30) {
  try {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Unauthorized" };

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysLimit);

    // Fetch Admin Changes (e.g. "User updated Stripe keys")
    const auditLogs = await db.auditLog.findMany({
      where: {
        tableName: "PaymentGateway",
        createdAt: { gte: dateLimit }
      },
      include: {
        user: { select: { name: true, email: true, image: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    // Fetch System/Transaction Logs (e.g. "Payment Failed: Insufficient Funds")
    const systemLogs = await db.systemLog.findMany({
      where: {
        source: { in: ["STRIPE_API", "PAYPAL_API", "CHECKOUT"] },
        createdAt: { gte: dateLimit }
      },
      orderBy: { createdAt: "desc" },
      take: 300
    });

    // Normalize and merge logs for the frontend table
    const formattedAuditLogs = auditLogs.map(log => ({
      id: log.id,
      type: "ADMIN_ACTION",
      level: "INFO",
      title: log.action,
      message: `Modified ${log.tableName} (ID: ${log.recordId})`,
      user: log.user?.name || log.user?.email || "System",
      context: { old: log.oldValues, new: log.newValues },
      createdAt: log.createdAt
    }));

    const formattedSystemLogs = systemLogs.map(log => ({
      id: log.id,
      type: "TRANSACTION",
      level: log.level, // "ERROR", "WARN", "INFO"
      title: log.source,
      message: log.message,
      user: "System",
      context: log.context,
      createdAt: log.createdAt
    }));

    // Combine and sort by date descending
    const allLogs = [...formattedAuditLogs, ...formattedSystemLogs].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return { success: true, data: allLogs };
  } catch (error) {
    console.error("Failed to fetch payment logs:", error);
    return { success: false, error: "Failed to load logs." };
  }
}

// 2. Delete Single Log
export async function deletePaymentLog(id: string, type: "ADMIN_ACTION" | "TRANSACTION") {
  try {
    if (type === "ADMIN_ACTION") {
      await db.auditLog.delete({ where: { id } });
    } else {
      await db.systemLog.delete({ where: { id } });
    }
    revalidatePath("/admin/settings/payments/logs");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete log." };
  }
}

// 3. Bulk Delete Logs
export async function bulkDeletePaymentLogs(items: { id: string, type: string }[]) {
  try {
    const auditIds = items.filter(i => i.type === "ADMIN_ACTION").map(i => i.id);
    const systemIds = items.filter(i => i.type === "TRANSACTION").map(i => i.id);

    await db.$transaction(async (tx) => {
      if (auditIds.length > 0) {
        await tx.auditLog.deleteMany({ where: { id: { in: auditIds } } });
      }
      if (systemIds.length > 0) {
        await tx.systemLog.deleteMany({ where: { id: { in: systemIds } } });
      }
    });

    revalidatePath("/admin/settings/payments/logs");
    return { success: true, message: `Deleted ${items.length} logs successfully.` };
  } catch (error) {
    return { success: false, error: "Failed to bulk delete logs." };
  }
}

// 4. Auto Cleanup (Delete logs older than 30 days)
export async function autoCleanupOldLogs() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedAudit = await db.auditLog.deleteMany({
      where: { tableName: "PaymentGateway", createdAt: { lt: thirtyDaysAgo } }
    });

    const deletedSystem = await db.systemLog.deleteMany({
      where: { source: { in: ["STRIPE_API", "PAYPAL_API", "CHECKOUT"] }, createdAt: { lt: thirtyDaysAgo } }
    });

    revalidatePath("/admin/settings/payments/logs");
    return { 
      success: true, 
      message: `Cleaned up ${deletedAudit.count + deletedSystem.count} old logs.` 
    };
  } catch (error) {
    return { success: false, error: "Failed to run cleanup task." };
  }
}