// File Location: app/actions/order/restore-order.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function restoreOrder(orderId: string) {
  try {
    if (!orderId) return { success: false, error: "Order ID missing" };

    await db.order.update({
      where: { id: orderId },
      data: { deletedAt: null } // রিস্টোর করা হচ্ছে
    });

    revalidatePath("/admin/orders");
    return { success: true, message: "Order restored successfully" };

  } catch (error) {
    console.error("RESTORE_ORDER_ERROR", error);
    return { success: false, error: "Failed to restore order" };
  }
}