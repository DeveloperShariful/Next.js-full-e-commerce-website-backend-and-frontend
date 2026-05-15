//app/actions/admin/order/bulk-update.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";

export async function bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus) {
  try {
    if (!orderIds.length) return { success: false, error: "No orders selected" };

    // 1. Update All Orders
    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status }
    });

    // 2. Create Audit Logs (Bulk Note)
    // Prisma createMany currently doesn't support relation connections easily for logs per item 
    // without a loop or raw query, but for performance we can insert logs:
    const notesData = orderIds.map(id => ({
      orderId: id,
      content: `Bulk Action: Status updated to ${status}`,
      isSystem: true,
      notify: false
    }));

    await db.orderNote.createMany({
      data: notesData
    });

    revalidatePath("/admin/orders");
    return { success: true, message: `${orderIds.length} orders updated to ${status}` };

  } catch (error) {
    console.error("BULK_UPDATE_ERROR", error);
    return { success: false, error: "Failed to update orders" };
  }
}

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