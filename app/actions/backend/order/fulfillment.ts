// File Location: app/actions/backend/order/fulfillment.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { sendOrderEmail } from "./order-utils";

export async function addTrackingInfo(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const courier = formData.get("courier") as string;
    const trackingNumber = formData.get("trackingNumber") as string;
    const trackingUrl = formData.get("trackingUrl") as string;

    if (!orderId || !trackingNumber) {
      return { success: false, error: "Tracking number is required" };
    }

    // Fetch order items to store in shipment record
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          select: { id: true, productName: true, sku: true, quantity: true, price: true }
        }
      }
    });

    if (!order) return { success: false, error: "Order not found" };

    const shipmentItems = order.items.map(i => ({
      id: i.id,
      name: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      price: Number(i.price)
    }));

    // 1. Create Shipment Record
    await db.shipment.create({
      data: {
        orderId,
        trackingNumber,
        courier: courier || "Standard Courier",
        trackingUrl,
        items: shipmentItems as unknown as Prisma.InputJsonValue,
        shippedDate: new Date(),
        syncedToGateway: false
      }
    });

    // 2. Update Order Status
    await db.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: "FULFILLED",
        status: "SHIPPED",
        shippingTrackingNumber: trackingNumber,
        shippingTrackingUrl: trackingUrl
      }
    });

    // 3. Add System Note
    await db.orderNote.create({
      data: {
        orderId,
        content: `Shipment added via ${courier || "Standard Courier"}. Tracking: ${trackingNumber}`,
        isSystem: true
      }
    });

    // 4. Notify customer about shipment
    await sendOrderEmail(orderId, "ORDER_SHIPPED");

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Tracking added successfully" };

  } catch (error: unknown) {
    console.error("FULFILLMENT_ERROR", error);
    return { success: false, error: "Failed to add tracking" };
  }
}
