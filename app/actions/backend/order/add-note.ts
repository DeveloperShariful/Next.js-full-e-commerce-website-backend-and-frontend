// File Location: app/actions/backend/order/add-note.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendOrderEmail } from "./order-utils";
import { logActivity } from "@/lib/activity-logger";

export async function addOrderNote(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const content = formData.get("content") as string;
    const notify = formData.get("notify") === "on";

    if (!orderId || !content) {
      return { success: false, error: "Note content is required" };
    }

    await db.orderNote.create({
      data: {
        orderId,
        content,
        isSystem: false,
        notify
      }
    });

    if (notify) {
      await sendOrderEmail(orderId, "ORDER_NOTE");
    }

    await logActivity({
      action: "ORDER_NOTE_ADDED",
      entityType: "Order",
      entityId: orderId,
      details: { notify },
    });

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Note added successfully" };

  } catch (error: unknown) {
    console.error("ADD_NOTE_ERROR", error);
    return { success: false, error: "Failed to add note" };
  }
}
