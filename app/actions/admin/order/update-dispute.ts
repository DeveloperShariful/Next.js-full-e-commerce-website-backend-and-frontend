// File Location: app/actions/admin/order/update-dispute.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DisputeStatus } from "@prisma/client";

export async function updateDisputeStatus(formData: FormData) {
  try {
    const disputeId = formData.get("disputeId") as string;
    const status = formData.get("status") as DisputeStatus;
    const reason = formData.get("reason") as string; // এডমিনের ইন্টারনাল নোট

    if (!disputeId || !status) {
      return { success: false, error: "Dispute ID and Status required" };
    }

    // ১. ডিসপুট আপডেট
    const dispute = await db.dispute.update({
      where: { id: disputeId },
      data: { status, reason } // Reason আপডেট হচ্ছে
    });

    // ২. অটোমেশন: যদি ডিসপুট হেরে যান (LOST), অর্ডারের রিস্ক হাই করা
    if (status === "LOST") {
        await db.order.update({
            where: { id: dispute.orderId },
            data: { riskLevel: "HIGH" }
        });
        
        // নোট রাখা
        await db.orderNote.create({
            data: {
                orderId: dispute.orderId,
                content: `Dispute LOST. Order marked as High Risk.`,
                isSystem: true
            }
        });
    }

    revalidatePath(`/admin/orders/${dispute.orderId}`);
    return { success: true, message: "Dispute status updated" };

  } catch (error) {
    console.error("UPDATE_DISPUTE_ERROR", error);
    return { success: false, error: "Failed to update dispute" };
  }
}