// app/actions/shipment.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- TYPES ---
export interface ShipmentData {
  id: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  courier: string | null;
  shippedDate: Date;
  deliveredDate: Date | null;
  items: any; // JSON
  order: {
    id: string;
    orderNumber: string;
    user: { name: string | null; email: string; phone: string | null } | null;
    shippingAddress: any;
  };
}

// --- 1. GET SHIPMENTS ---
export async function getShipments(query?: string) {
  try {
    const whereCondition: any = query ? {
      OR: [
        { trackingNumber: { contains: query, mode: 'insensitive' } },
        { courier: { contains: query, mode: 'insensitive' } },
        { order: { orderNumber: { contains: query, mode: 'insensitive' } } }
      ]
    } : {};

    const shipments = await db.shipment.findMany({
      where: whereCondition,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            shippingAddress: true,
            user: { select: { name: true, email: true, phone: true } }
          }
        }
      },
      orderBy: { shippedDate: 'desc' },
      take: 50
    });

    return { success: true, data: shipments };

  } catch (error) {
    console.error("GET_SHIPMENTS_ERROR", error);
    return { success: false, data: [] };
  }
}

// --- 2. UPDATE TRACKING INFO ---
export async function updateTracking(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const courier = formData.get("courier") as string;
    const trackingNumber = formData.get("trackingNumber") as string;
    const trackingUrl = formData.get("trackingUrl") as string;

    if (!id) return { success: false, error: "ID required" };

    await db.shipment.update({
      where: { id },
      data: {
        courier,
        trackingNumber,
        trackingUrl
      }
    });

    revalidatePath("/admin/shipments");
    return { success: true, message: "Tracking updated successfully" };
  } catch (error) {
    return { success: false, error: "Update failed" };
  }
}

// --- 3. MARK AS DELIVERED ---
export async function markAsDelivered(id: string) {
  try {
    const shipment = await db.shipment.update({
      where: { id },
      data: { deliveredDate: new Date() }
    });

    // Optional: Update Order Status to DELIVERED if all items shipped
    await db.order.update({
      where: { id: shipment.orderId },
      data: { status: "DELIVERED" }
    });

    revalidatePath("/admin/shipments");
    return { success: true, message: "Marked as Delivered" };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}

// --- 4. DELETE SHIPMENT ---
export async function deleteShipment(id: string) {
  try {
    await db.shipment.delete({ where: { id } });
    revalidatePath("/admin/shipments");
    return { success: true, message: "Shipment record deleted" };
  } catch (error) {
    return { success: false, error: "Delete failed" };
  }
}