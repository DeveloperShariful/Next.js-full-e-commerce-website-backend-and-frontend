// File: app/actions/backend/refund/refund.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RefundQueryParams, GetRefundsResponse } from "@/app/(backend)/admin/refunds/types";
import { PaymentStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity-logger";

// --- 1. GET REFUNDS WITH PAGINATION, SEARCH, COUNTS & STATS ---
export async function getRefunds(params: RefundQueryParams): Promise<GetRefundsResponse> {
  try {
    const { search = "", status = "ALL", page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    // Search Logic (Order number, customer name, email, or refund reason)
    if (search) {
      whereCondition.OR = [
        { order: { orderNumber: { contains: search, mode: "insensitive" } } },
        { reason: { contains: search, mode: "insensitive" } },
        { gatewayRefundId: { contains: search, mode: "insensitive" } },
        { order: { user: { name: { contains: search, mode: "insensitive" } } } },
        { order: { user: { email: { contains: search, mode: "insensitive" } } } },
      ];
    }

    if (status !== "ALL") {
      whereCondition.status = status;
    }

    // Parallel Queries (ডেটা, கவுন্ট, এবং Store Settings থেকে কারেন্সি একবারে আনা)
    const [refunds, totalRecords, statusGroup, approvedSum, storeSettings] = await Promise.all([
      db.refund.findMany({
        where: whereCondition,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              paymentStatus: true,
              currency: true,
              guestEmail: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.refund.count({ where: whereCondition }),
      db.refund.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      db.refund.aggregate({
        where: { status: "approved" },
        _sum: { amount: true },
      }),
      db.storeSettings.findFirst({
        select: { currency: true }
      })
    ]);

    // Format Counts
    const counts = { ALL: 0, pending: 0, approved: 0, rejected: 0 };
    statusGroup.forEach((group) => {
      counts[group.status as keyof typeof counts] = group._count.id;
      counts.ALL += group._count.id;
    });

    const stats = {
      totalRefundedAmount: Number(approvedSum._sum.amount || 0),
      pendingCount: counts.pending,
      currency: storeSettings?.currency || "AUD", // 100% Dynamic Currency from Store Settings
    };

    return {
      success: true,
      data: JSON.parse(JSON.stringify(refunds)), // Prisma Decimal to JSON fix
      meta: {
        total: totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        limit,
      },
      counts,
      stats,
    };
  } catch (error) {
    console.error("GET_REFUNDS_ERROR", error);
    return { success: false, error: "Failed to fetch refunds." };
  }
}

// --- 2. UPDATE SINGLE REFUND STATUS (WITH AUDIT TRAIL) ---
export async function updateRefundStatus(id: string, status: string) {
  try {
    const refund = await db.refund.update({
      where: { id },
      data: { status },
      include: { order: true }
    });

    // If approved, update order & create Order Note
    if (status === "approved") {
      await db.$transaction([
        db.order.update({
          where: { id: refund.orderId },
          data: { paymentStatus: PaymentStatus.REFUNDED },
        }),
        db.orderNote.create({
          data: {
            orderId: refund.orderId,
            content: `Refund of ${refund.order.currency} ${refund.amount} has been approved. Reason: ${refund.reason || 'N/A'}`,
            isSystem: true,
          }
        })
      ]);
    } else if (status === "rejected") {
      await db.orderNote.create({
        data: {
          orderId: refund.orderId,
          content: `Refund request of ${refund.order.currency} ${refund.amount} was rejected.`,
          isSystem: true,
        }
      });
    }

    await logActivity({
      action: 'REFUND_STATUS_UPDATED',
      entityType: 'Order',
      entityId: refund.orderId,
      details: { refundId: id, status, amount: Number(refund.amount) },
    });

    revalidatePath("/admin/refunds");
    return { success: true, message: `Refund marked as ${status}.` };
  } catch (error) {
    console.error("UPDATE_REFUND_ERROR", error);
    return { success: false, error: "Failed to update refund status." };
  }
}

// --- 3. BULK ACTIONS (WooCommerce Style) ---
export async function bulkUpdateRefunds(ids: string[], action: string) {
  try {
    if (ids.length === 0) return { success: false, error: "No items selected." };

    if (action === "delete") {
      await db.refund.deleteMany({ where: { id: { in: ids } } });
      
    } else if (action === "approved" || action === "rejected") {
      
      const refundsToUpdate = await db.refund.findMany({
        where: { id: { in: ids } },
        include: { order: true }
      });

      // Prisma Transaction to ensure data consistency
      await db.$transaction(async (tx) => {
        await tx.refund.updateMany({
          where: { id: { in: ids } },
          data: { status: action },
        });

        for (const refund of refundsToUpdate) {
          if (action === "approved") {
            await tx.order.update({
              where: { id: refund.orderId },
              data: { paymentStatus: PaymentStatus.REFUNDED },
            });
            await tx.orderNote.create({
              data: {
                orderId: refund.orderId,
                content: `Bulk Action: Refund of ${refund.order.currency} ${refund.amount} approved.`,
                isSystem: true,
              }
            });
          }
        }
      });
    }

    await logActivity({
      action: 'REFUND_BULK_UPDATED',
      entityType: 'Order',
      details: { count: ids.length, action },
    });

    revalidatePath("/admin/refunds");
    return { success: true, message: "Bulk action applied successfully." };
  } catch (error) {
    console.error("BULK_REFUND_ERROR", error);
    return { success: false, error: "Failed to perform bulk action." };
  }
}

// --- 4. DELETE SINGLE REFUND ---
export async function deleteRefund(id: string) {
  try {
    await db.refund.delete({ where: { id } });

    await logActivity({
      action: 'REFUND_DELETED',
      entityType: 'Order',
      entityId: id,
    });

    revalidatePath("/admin/refunds");
    return { success: true, message: "Record deleted permanently." };
  } catch (error) {
    console.error("DELETE_REFUND_ERROR", error);
    return { success: false, error: "Failed to delete record." };
  }
}