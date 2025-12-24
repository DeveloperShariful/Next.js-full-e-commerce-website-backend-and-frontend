// File Location: app/actions/order/add-note.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addOrderNote(formData: FormData) {
  try {
    const orderId = formData.get("orderId") as string;
    const content = formData.get("content") as string;
    // Checkbox returns "on" if checked, otherwise null
    const notify = formData.get("notify") === "on"; 

    if (!orderId || !content) {
      return { success: false, error: "Note content is required" };
    }

    await db.orderNote.create({
      data: {
        orderId,
        content,
        isSystem: false, // এটা মানুষের লেখা নোট, সিস্টেমের নয়
        notify: notify
      }
    });

    // TODO: If notify is true, trigger email sending function here later

    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: "Note added successfully" };

  } catch (error) {
    console.error("ADD_NOTE_ERROR", error);
    return { success: false, error: "Failed to add note" };
  }
}