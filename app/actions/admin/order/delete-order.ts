// File Location: app/actions/order/delete-order.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteOrder(orderId: string, force: boolean = false) {
  try {
    if (!orderId) {
      return { success: false, error: "Order ID is required" };
    }

    if (force) {
      // 🔴 Permanent Delete (ফাইল, লগ সব মুছে যাবে)
      await db.order.delete({
        where: { id: orderId }
      });
      revalidatePath("/admin/orders");
      return { success: true, message: "Order permanently deleted" };
    } else {
      // 🟡 Soft Delete (Trash এ পাঠানো)
      await db.order.update({
        where: { id: orderId },
        data: { deletedAt: new Date() } // স্কিমার deletedAt ফিল্ড ব্যবহার করা হচ্ছে
      });
      revalidatePath("/admin/orders");
      return { success: true, message: "Moved to trash" };
    }

  } catch (error) {
    console.error("DELETE_ORDER_ERROR:", error);
    return { success: false, error: "Operation failed" };
  }
}