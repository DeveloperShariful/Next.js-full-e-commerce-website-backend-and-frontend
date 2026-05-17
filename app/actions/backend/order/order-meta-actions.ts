// File Location: app/actions/admin/order/order-meta-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUniqueMetaKeys() {
  try {
    const result = await db.$queryRaw<{ key: string }[]>`
      SELECT DISTINCT jsonb_object_keys(metadata) as key 
      FROM "Order" 
      WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb;
    `;

    const keys = result.map(r => r.key);
    const systemKeys = ['downloadable_permissions', 'stripe_intent', 'paypal_id'];
    const filteredKeys = keys.filter(k => !systemKeys.includes(k));

    return { success: true, data: filteredKeys };
  } catch (error) {
    console.error("GET_META_KEYS_ERROR", error);
    // ✅ FIXED: Removed { not: null } to fix Prisma JSON type error
    try {
        const recentOrders = await db.order.findMany({
            select: { metadata: true },
            orderBy: { createdAt: 'desc' },
            take: 500
        });
        const keySet = new Set<string>();
        recentOrders.forEach(o => {
            // JS level null check instead of Prisma level
            if (o.metadata && typeof o.metadata === 'object' && !Array.isArray(o.metadata)) {
                Object.keys(o.metadata).forEach(k => keySet.add(k));
            }
        });
        const systemKeys = ['downloadable_permissions', 'stripe_intent', 'paypal_id'];
        return { success: true, data: Array.from(keySet).filter(k => !systemKeys.includes(k)) };
    } catch (fallbackError) {
        return { success: false, data: [] };
    }
  }
}

export async function updateOrderMetadata(orderId: string, metaKey: string, metaValue: any) {
  try {
    if (!orderId || !metaKey) return { success: false, error: "Order ID and Meta Key are required" };

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { metadata: true }
    });

    if (!order) return { success: false, error: "Order not found" };

    const currentMetadata = typeof order.metadata === 'object' && order.metadata !== null 
      ? (order.metadata as Record<string, any>) 
      : {};

    const updatedMetadata = { ...currentMetadata, [metaKey]: metaValue };

    await db.order.update({
      where: { id: orderId },
      data: { metadata: updatedMetadata }
    });

    await db.orderNote.create({
      data: { orderId, content: `Custom field '${metaKey}' updated.`, isSystem: true }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Custom field updated successfully." };

  } catch (error) {
    console.error("UPDATE_METADATA_ERROR", error);
    return { success: false, error: "Failed to update custom field." };
  }
}

export async function deleteOrderMetadata(orderId: string, metaKey: string) {
  try {
    if (!orderId || !metaKey) return { success: false, error: "Order ID and Meta Key are required" };

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { metadata: true }
    });

    if (!order) return { success: false, error: "Order not found" };

    const currentMetadata = typeof order.metadata === 'object' && order.metadata !== null 
      ? (order.metadata as Record<string, any>) 
      : {};

    if (metaKey in currentMetadata) {
      delete currentMetadata[metaKey];
    }

    await db.order.update({
      where: { id: orderId },
      data: { metadata: currentMetadata }
    });

    await db.orderNote.create({
        data: { orderId, content: `Custom field '${metaKey}' deleted.`, isSystem: true }
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Custom field deleted." };

  } catch (error) {
    console.error("DELETE_METADATA_ERROR", error);
    return { success: false, error: "Failed to delete custom field." };
  }
}