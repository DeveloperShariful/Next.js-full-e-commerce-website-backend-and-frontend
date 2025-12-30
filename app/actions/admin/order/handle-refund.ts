// File Location: app/actions/orders/handle-refund.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function processRefund(orderId: string, amount: number, reason: string) {
  try {
    // ১. অর্ডার চেক করা
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { total: true, refundedAmount: true, paymentStatus: true }
    });

    if (!order) return { success: false, error: "Order not found" };

    // ২. ম্যাক্সিমাম রিফান্ড চেক
    const refundable = order.total - order.refundedAmount;
    
    // ফ্লোটিং পয়েন্ট ক্যালকুলেশন ফিক্স (যেমন: 0.0000001 ইস্যু এড়াতে)
    if (amount > Number(refundable.toFixed(2))) {
      return { success: false, error: `Maximum refundable amount is $${refundable.toFixed(2)}` };
    }

    await db.$transaction(async (tx) => {
      // ৩. Refund টেবিলে এন্ট্রি তৈরি
      await tx.refund.create({
        data: {
          orderId,
          amount,
          reason,
          status: "completed",
        }
      });

      // ৪. অর্ডারের স্ট্যাটাস এবং রিফান্ডেড অ্যামাউন্ট আপডেট
      const newRefundedTotal = order.refundedAmount + amount;
      let newPaymentStatus = order.paymentStatus;
      let newOrderStatus = "PROCESSING"; // ডিফল্ট স্ট্যাটাস যদি ফুল রিফান্ড না হয়

      // স্ট্যাটাস লজিক
      if (newRefundedTotal >= order.total) {
        newPaymentStatus = "REFUNDED";
        newOrderStatus = "REFUNDED";
      } else if (newRefundedTotal > 0) {
        newPaymentStatus = "PARTIALLY_REFUNDED";
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          refundedAmount: { increment: amount },
          paymentStatus: newPaymentStatus,
          // যদি ফুল রিফান্ড হয় তবেই মেইন স্ট্যাটাস চেইঞ্জ হবে, নাহলে আগেরটাই থাকবে বা প্রসেসিং
          ...(newOrderStatus === "REFUNDED" ? { status: "REFUNDED" } : {})
        }
      });

      // ৫. টাইমলাইনে লগ রাখা (OrderNote)
      await tx.orderNote.create({
        data: {
          orderId,
          content: `Refund processed: $${amount}. Reason: ${reason || "N/A"}`,
          isSystem: true
        }
      });
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error("REFUND_ERROR:", error);
    return { success: false, error: "Failed to process refund. Check server logs." };
  }
}