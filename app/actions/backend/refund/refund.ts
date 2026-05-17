// app/actions/refund/refund.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface RefundData {
  id: string;
  amount: number; // Schema te Float/Decimal chilo
  reason: string | null;
  status: string; // pending, approved, rejected
  createdAt: Date;
  order: {
    id: string;
    orderNumber: string;
    paymentStatus: string;
    user: { name: string | null; email: string } | null;
  };
}

// --- 1. GET REFUNDS ---
export async function getRefunds(query?: string) {
  try {
    const whereCondition: any = query ? {
      OR: [
        { order: { orderNumber: { contains: query, mode: 'insensitive' } } },
        { reason: { contains: query, mode: 'insensitive' } }
      ]
    } : {};

    const refunds = await db.refund.findMany({
      where: whereCondition,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            paymentStatus: true,
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate Stats
    const totalRefunded = refunds
      .filter(r => r.status === 'approved')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    const pendingCount = refunds.filter(r => r.status === 'pending').length;

    return { 
      success: true, 
      data: refunds,
      stats: { totalRefunded, pendingCount }
    };

  } catch (error) {
    console.error("GET_REFUNDS_ERROR", error);
    return { success: false, data: [], stats: { totalRefunded: 0, pendingCount: 0 } };
  }
}

// --- 2. UPDATE REFUND STATUS ---
export async function updateRefundStatus(id: string, status: string) {
  try {
    // 1. Update Refund Table
    const refund = await db.refund.update({
      where: { id },
      data: { status },
      include: { order: true }
    });

    // 2. If Approved, Update Order Payment Status
    if (status === 'approved') {
      await db.order.update({
        where: { id: refund.orderId },
        data: { paymentStatus: 'REFUNDED' }
      });
      
      // Optional: Add Order Note
      await db.orderNote.create({
        data: {
          orderId: refund.orderId,
          content: `Refund of ৳${refund.amount} approved. Reason: ${refund.reason}`,
          isSystem: true
        }
      });
    }

    revalidatePath("/admin/refunds");
    return { success: true, message: `Refund marked as ${status}` };

  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// --- 3. DELETE REFUND RECORD ---
export async function deleteRefund(id: string) {
  try {
    await db.refund.delete({ where: { id } });
    revalidatePath("/admin/refunds");
    return { success: true, message: "Record deleted" };
  } catch (error) {
    return { success: false, error: "Delete failed" };
  }
}