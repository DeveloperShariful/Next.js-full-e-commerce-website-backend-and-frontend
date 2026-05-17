// File Location: app/actions/admin/order/update-return.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReturnStatus } from "@prisma/client";
import { restockInventory, sendOrderEmail } from "./order-utils"; // আপনার তৈরি করা ইউটিলিটি

export async function updateReturnRequest(formData: FormData) {
  try {
    const returnId = formData.get("returnId") as string;
    const status = formData.get("status") as ReturnStatus;
    const adminNote = formData.get("adminNote") as string;
    const doRestock = formData.get("restock") === "on"; // চেকবক্স থেকে আসবে

    if (!returnId || !status) {
      return { success: false, error: "Return ID and Status are required" };
    }

    // ১. রিটার্ন আপডেট
    const returnReq = await db.returnRequest.update({
      where: { id: returnId },
      data: {
        status,
        adminNote,
        // যদি রিসিভ করা হয়, তবে রিফান্ড স্ট্যাটাস আপডেট করার অপশন থাকতে পারে
      }
    });

    // ২. অটোমেশন: ইনভেন্টরি রিস্টক (যদি Approved হয় এবং এডমিন চায়)
    if (status === "APPROVED" && doRestock) {
        await restockInventory(returnReq.orderId);
    }

    // ৩. অটোমেশন: ইমেইল ট্রিগার
    if (status === "APPROVED") {
        await sendOrderEmail(returnReq.orderId, "RETURN_APPROVED");
    } else if (status === "REJECTED") {
        await sendOrderEmail(returnReq.orderId, "RETURN_REJECTED");
    }

    // ৪. অর্ডারে নোট রাখা
    await db.orderNote.create({
      data: {
        orderId: returnReq.orderId,
        content: `Return Request #${returnId.slice(-4)} marked as ${status}. ${doRestock ? "(Inventory Restocked)" : ""}`,
        isSystem: true
      }
    });

    revalidatePath(`/admin/orders/${returnReq.orderId}`);
    return { success: true, message: "Return request updated successfully" };

  } catch (error) {
    console.error("UPDATE_RETURN_ERROR", error);
    return { success: false, error: "Failed to update return request" };
  }
}