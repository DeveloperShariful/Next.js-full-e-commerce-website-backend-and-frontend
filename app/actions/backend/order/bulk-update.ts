//File Location: app/actions/admin/order/bulk-update.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { restockInventory, sendOrderEmail } from "./order-utils"; // 🔥 Import added

export async function bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus) {
  try {
    if (!orderIds.length) return { success: false, error: "No orders selected" };

    // 🔥 FETCH OLD ORDERS: To check if Analytics/Restock is needed
    const oldOrders = await db.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true } // Need items for Analytics & Restock
    });

    // 1. Update All Orders (Original Logic intact)
    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status }
    });

    // 2. Create Audit Logs (Original Logic intact)
    const notesData = orderIds.map(id => ({
      orderId: id,
      content: `Bulk Action: Status updated to ${status}`,
      isSystem: true,
      notify: false
    }));

    await db.orderNote.createMany({
      data: notesData
    });

    // 🔥 NEW: Event Triggers based on Status Transition
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);

    for (const order of oldOrders) {
      // 1️⃣ ANALYTICS SYNC: If order is marked as DELIVERED/COMPLETED
      if (status === "DELIVERED" && order.status !== "DELIVERED") {
        const netSales = Number(order.netAmount || 0);
        const grossSales = Number(order.subtotal || 0);
        const totalTax = Number(order.taxTotal || 0);
        const totalShipping = Number(order.shippingTotal || 0);
        const productsSold = order.items.reduce((acc, item) => acc + item.quantity, 0);

        // Update Store Analytics
        await db.analytics.upsert({
          where: { date: todayDate },
          update: { 
            totalOrders: { increment: 1 }, 
            netSales: { increment: netSales },
            grossSales: { increment: grossSales },
            totalTax: { increment: totalTax },
            totalShipping: { increment: totalShipping },
            productsSold: { increment: productsSold }
          },
          create: { 
            date: todayDate, totalOrders: 1, netSales, grossSales, totalTax, totalShipping, productsSold,
            totalDiscounts: 0, totalRefunds: 0, variationsSold: 0, newCustomers: 0, returningCustomers: 0, 
            abandonedCheckouts: 0, recoveredCheckouts: 0, totalVisitors: 0, totalPageViews: 0
          }
        });

        // Update Product Analytics
        for (const item of order.items) {
          if (!item.productId) continue;
          await db.productAnalytics.upsert({
            where: { date_productId: { date: todayDate, productId: item.productId } },
            update: { itemsSold: { increment: item.quantity }, netSales: { increment: Number(item.total) } },
            create: { date: todayDate, productId: item.productId, itemsSold: item.quantity, netSales: Number(item.total) }
          });
        }
      }

      // 2️⃣ RESTOCK LOGIC: If order is CANCELLED, FAILED, or REFUNDED
      if (["CANCELLED", "FAILED", "REFUNDED"].includes(status) && !["CANCELLED", "FAILED", "REFUNDED"].includes(order.status)) {
        await restockInventory(order.id);
      }

      // 3️⃣ EMAIL TRIGGER: Auto send email to customer based on status
      await sendOrderEmail(order.id, `ORDER_${status}`);
    }

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
      await db.order.delete({
        where: { id: orderId }
      });
      revalidatePath("/admin/orders");
      return { success: true, message: "Order permanently deleted" };
    } else {
      await db.order.update({
        where: { id: orderId },
        data: { deletedAt: new Date() } 
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
      data: { deletedAt: null } 
    });

    revalidatePath("/admin/orders");
    return { success: true, message: "Order restored successfully" };

  } catch (error) {
    console.error("RESTORE_ORDER_ERROR", error);
    return { success: false, error: "Failed to restore order" };
  }
}