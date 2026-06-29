//File Location: app/actions/admin/order/bulk-update.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { restockInventory, sendOrderEmail } from "./order-utils";
import { logActivity } from "@/lib/activity-logger";

// সাকসেস স্ট্যাটাস এরে (টাইপ সেফ)
const SUCCESS_STATUSES: OrderStatus[] = [
  "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "READY_FOR_PICKUP", "PARTIALLY_PAID"
];

// 🔥 HIGH-LEVEL HELPER: ট্র্যাশ বা রিস্টোর করার সময় অ্যানালিটিক্স প্লাস/মাইনাস করার লজিক (No any used)
async function adjustAnalyticsForOrder(orderId: string, sign: 1 | -1) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) return;

  // যদি অর্ডারটি সাকসেস স্ট্যাটাসের না হয়, তবে অ্যানালিটিক্সে হাত দেওয়ার দরকার নেই
  if (!SUCCESS_STATUSES.includes(order.status)) return;

  const statDate = new Date(order.orderDate);
  statDate.setUTCHours(0, 0, 0, 0); // UTC midnight-এ অ্যানালিটিক্স ডেট সেট করা হলো

  const netSales = (Number(order.netAmount) || 0) * sign;
  const grossSales = (Number(order.subtotal) || 0) * sign;
  const totalTax = (Number(order.taxTotal) || 0) * sign;
  const totalShipping = (Number(order.shippingTotal) || 0) * sign;
  const productsSold = order.items.reduce((acc, item) => acc + item.quantity, 0) * sign;

  // ১. গ্লোবাল অ্যানালিটিক্স প্লাস/মাইনাস করা
  await db.analytics.upsert({
    where: { date: statDate },
    update: {
      totalOrders: { increment: 1 * sign },
      netSales: { increment: netSales },
      grossSales: { increment: grossSales },
      totalTax: { increment: totalTax },
      totalShipping: { increment: totalShipping },
      productsSold: { increment: productsSold }
    },
    create: {
      date: statDate,
      totalOrders: sign === 1 ? 1 : 0,
      netSales: sign === 1 ? netSales : 0,
      grossSales: sign === 1 ? grossSales : 0,
      totalTax: sign === 1 ? totalTax : 0,
      totalShipping: sign === 1 ? totalShipping : 0,
      productsSold: sign === 1 ? productsSold : 0,
      totalDiscounts: 0, totalRefunds: 0, variationsSold: 0, newCustomers: 0, returningCustomers: 0,
      abandonedCheckouts: 0, recoveredCheckouts: 0, totalVisitors: 0, totalPageViews: 0
    }
  });

  // প্রোডাক্ট ক্যাটাগরির ম্যাপ তৈরি (Leaderboards মাইনাস/প্লাস করার জন্য)
  const products = await db.product.findMany({
    select: { id: true, categories: { select: { id: true }, take: 1 } }
  });
  const productCategoryMap: Record<string, string | null> = {};
  products.forEach(p => {
    productCategoryMap[p.id] = p.categories.length > 0 ? p.categories[0].id : null;
  });

  // ২. প্রোডাক্ট অ্যানালিটিক্স প্লাস/মাইনাস করা
  for (const item of order.items) {
    if (!item.productId) continue;
    const itemsSold = item.quantity * sign;
    const itemNetSales = (Number(item.total) || 0) * sign;
    const categoryId = productCategoryMap[item.productId] || null;

    await db.productAnalytics.upsert({
      where: { date_productId: { date: statDate, productId: item.productId } },
      update: {
        itemsSold: { increment: itemsSold },
        netSales: { increment: itemNetSales }
      },
      create: {
        date: statDate,
        productId: item.productId,
        categoryId,
        itemsSold: sign === 1 ? itemsSold : 0,
        netSales: sign === 1 ? itemNetSales : 0
      }
    });
  }
}

export async function bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus) {
  try {
    if (!orderIds.length) return { success: false, error: "No orders selected" };

    const oldOrders = await db.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true }
    });

    // 1. Update All Orders
    await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status }
    });

    // 2. Create Audit Logs
    const notesData = orderIds.map(id => ({
      orderId: id,
      content: `Bulk Action: Status updated to ${status}`,
      isSystem: true,
      notify: false
    }));

    await db.orderNote.createMany({
      data: notesData
    });

    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);

    for (const order of oldOrders) {
      if (status === "DELIVERED" && order.status !== "DELIVERED") {
        const netSales = Number(order.netAmount || 0);
        const grossSales = Number(order.subtotal || 0);
        const totalTax = Number(order.taxTotal || 0);
        const totalShipping = Number(order.shippingTotal || 0);
        const productsSold = order.items.reduce((acc, item) => acc + item.quantity, 0);

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

        for (const item of order.items) {
          if (!item.productId) continue;
          await db.productAnalytics.upsert({
            where: { date_productId: { date: todayDate, productId: item.productId } },
            update: { itemsSold: { increment: item.quantity }, netSales: { increment: Number(item.total) } },
            create: { date: todayDate, productId: item.productId, itemsSold: item.quantity, netSales: Number(item.total) }
          });
        }
      }

      if (["CANCELLED", "FAILED", "REFUNDED"].includes(status) && !["CANCELLED", "FAILED", "REFUNDED"].includes(order.status)) {
        await restockInventory(order.id);
      }

      await sendOrderEmail(order.id, `ORDER_${status}`);
    }

    await logActivity({
      action: "ORDER_BULK_UPDATED",
      entityType: "Order",
      details: { count: orderIds.length, status, orderIds },
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
      // 🔴 Permanent Delete (ইতিমধ্যে ট্র্যাশে পাঠানো হয়েছে, তাই নতুন করে অ্যানালিটিক্স মাইনাস হবে না)
      await db.order.delete({ where: { id: orderId } });

      await logActivity({
        action: "ORDER_DELETED",
        entityType: "Order",
        entityId: orderId,
        details: { permanent: true },
      });

      revalidatePath("/admin/orders");
      return { success: true, message: "Order permanently deleted" };
    } else {
      // 🟡 Soft Delete (Move to trash)
      // ট্র্যাশে পাঠানোর সাথে সাথে ওই অর্ডারের টাকা ও কোয়ান্টিটি মাইনাস (-1) করে দেওয়া হবে
      await adjustAnalyticsForOrder(orderId, -1);

      await db.order.update({
        where: { id: orderId },
        data: { deletedAt: new Date() },
      });

      await logActivity({
        action: "ORDER_TRASHED",
        entityType: "Order",
        entityId: orderId,
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

    // 🟢 Restore Order
    // ট্র্যাশ থেকে রিস্টোর করার সাথে সাথে অর্ডারের টাকা ও কোয়ান্টিটি পুনরায় প্লাস (+1) করে দেওয়া হবে
    await adjustAnalyticsForOrder(orderId, 1);

    await db.order.update({
      where: { id: orderId },
      data: { deletedAt: null },
    });

    await logActivity({
      action: "ORDER_RESTORED",
      entityType: "Order",
      entityId: orderId,
    });

    revalidatePath("/admin/orders");
    return { success: true, message: "Order restored successfully" };

  } catch (error) {
    console.error("RESTORE_ORDER_ERROR", error);
    return { success: false, error: "Failed to restore order" };
  }
}