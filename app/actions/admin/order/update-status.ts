// File Location: app/actions/admin/order/update-status.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";
import { restockInventory, updateAnalytics } from "./order-utils"; 

// ✅ FIX: Correct Import Path
import { sendNotification } from "@/app/actions//admin/settings/email/send-notification"; 

export async function updateOrderStatus(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const status = formData.get("status") as OrderStatus;
    const paymentStatus = formData.get("paymentStatus") as PaymentStatus;
    const fulfillmentStatus = formData.get("fulfillmentStatus") as FulfillmentStatus;

    if (!orderId) return { success: false, error: "Order ID is missing" };

    // ১. আগের ডাটা চেক
    const existingOrder = await db.order.findUnique({ 
        where: { id: orderId },
        select: { status: true, paymentStatus: true, fulfillmentStatus: true, total: true, user: true, guestEmail: true }
    });
    if (!existingOrder) return { success: false, error: "Order not found" };

    const recipient = existingOrder.user?.email || existingOrder.guestEmail || "";

    // ২. আপডেট এক্সিকিউট
    await db.order.update({
      where: { id: orderId },
      data: { 
        status: status || undefined, 
        paymentStatus: paymentStatus || undefined, 
        fulfillmentStatus: fulfillmentStatus || undefined 
      }
    });

    // ৩. বিজনেস লজিক
    if ((status === "CANCELLED" || status === "REFUNDED") && existingOrder.status !== "CANCELLED" && existingOrder.status !== "REFUNDED") {
        await restockInventory(orderId);
    }
    if (paymentStatus === "PAID" && existingOrder.paymentStatus !== "PAID") {
        await updateAnalytics(existingOrder.total);
    }

    // ৪. ইমেইল ট্রিগার লজিক (15 Events + Admin Alerts)
    const emailPromises = [];

    // A. Order Status Changed?
    if (status && status !== existingOrder.status) {
        // Customer Email
        emailPromises.push(sendNotification({ trigger: `ORDER_${status}`, recipient, orderId, data: {} }));
        
        // Admin Alert (Only for Cancelled/Pending)
        if (status === 'CANCELLED' || status === 'PENDING') {
            emailPromises.push(sendNotification({ trigger: `ADMIN_ORDER_${status}`, recipient: '', orderId, data: {} }));
        }
    }

    // B. Payment Status Changed?
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
        emailPromises.push(sendNotification({ trigger: `PAYMENT_${paymentStatus}`, recipient, orderId, data: {} }));
        
        if (paymentStatus === 'REFUNDED') {
            emailPromises.push(sendNotification({ trigger: `ADMIN_PAYMENT_${paymentStatus}`, recipient: '', orderId, data: {} }));
        }
    }

    // C. Fulfillment Status Changed?
    if (fulfillmentStatus && fulfillmentStatus !== existingOrder.fulfillmentStatus) {
        let trigger = `FULFILLMENT_${fulfillmentStatus}`;
        if (fulfillmentStatus === 'PARTIALLY_FULFILLED') trigger = 'FULFILLMENT_PARTIALLY_FULFILLED';
        
        emailPromises.push(sendNotification({ trigger: trigger, recipient, orderId, data: {} }));

        if (fulfillmentStatus === 'RETURNED') {
            emailPromises.push(sendNotification({ trigger: `ADMIN_FULFILLMENT_RETURNED`, recipient: '', orderId, data: {} }));
        }
    }

    // Execute all emails
    await Promise.all(emailPromises);

    // ৫. লগ নোট তৈরি
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