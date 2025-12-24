// File: app/actions/order/update-status.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";

export async function updateOrderStatus(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const status = formData.get("status") as OrderStatus;
    const paymentStatus = formData.get("paymentStatus") as PaymentStatus;
    const fulfillmentStatus = formData.get("fulfillmentStatus") as FulfillmentStatus;

    if (!orderId) return { success: false, error: "Order ID is missing" };

    // 1. Update the Order
    await db.order.update({
      where: { id: orderId },
      data: { 
        status: status || undefined, 
        paymentStatus: paymentStatus || undefined, 
        fulfillmentStatus: fulfillmentStatus || undefined 
      }
    });

    // 2. Create a System Note (Log)
    const changes = [];
    if (status) changes.push(`Status: ${status}`);
    if (paymentStatus) changes.push(`Payment: ${paymentStatus}`);
    if (fulfillmentStatus) changes.push(`Fulfillment: ${fulfillmentStatus}`);

    if (changes.length > 0) {
      await db.orderNote.create({
        data: {
          orderId,
          content: `Updated - ${changes.join(", ")}`,
          isSystem: true,
          notify: false
        }
      });
    }
    
    // 3. Instant Refresh
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Order status updated successfully!" };

  } catch (error) {
    console.error("UPDATE_STATUS_ERROR", error);
    return { success: false, error: "Failed to update order" };
  }
}