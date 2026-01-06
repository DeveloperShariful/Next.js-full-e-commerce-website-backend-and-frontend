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