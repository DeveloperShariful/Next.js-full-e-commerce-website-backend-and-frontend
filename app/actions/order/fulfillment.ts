// File Location: app/actions/order/fulfillment.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addTrackingInfo(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const courier = formData.get("courier") as string;
    const trackingNumber = formData.get("trackingNumber") as string;
    const trackingUrl = formData.get("trackingUrl") as string;

    if (!orderId || !trackingNumber) {
        return { success: false, error: "Tracking number is required" };
    }

    // 1. Create Shipment Record
    await db.shipment.create({
      data: {
        orderId,
        trackingNumber,
        courier: courier || "Standard Courier",
        trackingUrl,
        items: {}, // Future: store specific items fulfilled
        shippedDate: new Date(),
        syncedToGateway: false // Payment gateway integration placeholder
      }
    });

    // 2. Update Order Status automatically
    await db.order.update({
      where: { id: orderId },
      data: { 
        fulfillmentStatus: "FULFILLED",
        status: "SHIPPED", // Auto-move to Shipped
        shippingTrackingNumber: trackingNumber, 
        shippingTrackingUrl: trackingUrl
      }
    });

    // 3. Add Note
    await db.orderNote.create({
      data: {
        orderId,
        content: `Shipment added via ${courier}. Tracking: ${trackingNumber}`,
        isSystem: true
      }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Tracking added successfully" };

  } catch (error) {
    console.error("FULFILLMENT_ERROR", error);
    return { success: false, error: "Failed to add tracking" };
  }
}