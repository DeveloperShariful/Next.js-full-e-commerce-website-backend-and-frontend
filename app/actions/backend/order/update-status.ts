// File Location: app/actions/admin/order/update-status.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";
// 🔥 FIX: Import centralized email utility
import { restockInventory, updateAnalytics, sendOrderEmail } from "./order-utils"; 

export async function updateOrderStatus(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const status = formData.get("status") as OrderStatus;
    const paymentStatus = formData.get("paymentStatus") as PaymentStatus;
    const fulfillmentStatus = formData.get("fulfillmentStatus") as FulfillmentStatus;

    if (!orderId) return { success: false, error: "Order ID is missing" };

    const existingOrder = await db.order.findUnique({ 
        where: { id: orderId },
        select: { status: true, paymentStatus: true, fulfillmentStatus: true, total: true }
    });
    if (!existingOrder) return { success: false, error: "Order not found" };

    // Update
    await db.order.update({
      where: { id: orderId },
      data: { 
        status: status || undefined, 
        paymentStatus: paymentStatus || undefined, 
        fulfillmentStatus: fulfillmentStatus || undefined 
      }
    });

    // Business Logic
    if ((status === "CANCELLED" || status === "REFUNDED") && existingOrder.status !== "CANCELLED" && existingOrder.status !== "REFUNDED") {
        await restockInventory(orderId);
    }
    if (paymentStatus === "PAID" && existingOrder.paymentStatus !== "PAID") {
        await updateAnalytics(Number(existingOrder.total));
    }

    // 🔥 FIXED: Centralized Email Logic
    const emailPromises = [];

    // A. Order Status Changed?
    if (status && status !== existingOrder.status) {
        // Customer Email
        emailPromises.push(sendOrderEmail(orderId, `ORDER_${status}`));
        
        // Admin Alert (Example Logic)
        if (status === 'CANCELLED' || status === 'PENDING') {
            emailPromises.push(sendOrderEmail(orderId, `ADMIN_ORDER_${status}`));
        }
    }

    // B. Payment Status Changed?
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
        emailPromises.push(sendOrderEmail(orderId, `PAYMENT_${paymentStatus}`));
        
        if (paymentStatus === 'REFUNDED') {
            emailPromises.push(sendOrderEmail(orderId, `ADMIN_PAYMENT_${paymentStatus}`));
        }
    }

    // C. Fulfillment Status Changed?
    if (fulfillmentStatus && fulfillmentStatus !== existingOrder.fulfillmentStatus) {
        let trigger = `FULFILLMENT_${fulfillmentStatus}`;
        if (fulfillmentStatus === 'PARTIALLY_FULFILLED') trigger = 'FULFILLMENT_PARTIALLY_FULFILLED';
        
        emailPromises.push(sendOrderEmail(orderId, trigger));

        if (fulfillmentStatus === 'RETURNED') {
            emailPromises.push(sendOrderEmail(orderId, `ADMIN_FULFILLMENT_RETURNED`));
        }
    }

    await Promise.all(emailPromises);

    // Logging
    const changes = [];
    if (status && status !== existingOrder.status) changes.push(`Status: ${status}`);
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) changes.push(`Payment: ${paymentStatus}`);
    if (fulfillmentStatus && fulfillmentStatus !== existingOrder.fulfillmentStatus) changes.push(`Fulfillment: ${fulfillmentStatus}`);

    if (changes.length > 0) {
      await db.orderNote.create({
        data: { orderId, content: `Updated - ${changes.join(", ")}`, isSystem: true, notify: false }
      });
    }
    
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Order updated & notifications sent!" };

  } catch (error) {
    console.error("UPDATE_STATUS_ERROR", error);
    return { success: false, error: "Failed to update order" };
  }
}