// File Location: app/actions/order/delete-order.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteOrder(orderId: string) {
  try {
    if (!orderId) return { success: false, error: "Order ID missing" };

    await db.order.delete({
      where: { id: orderId }
    });

    revalidatePath("/admin/orders");
    // সফল হলে কিছুই রিটার্ন করছি না, ফ্রন্টএন্ড থেকে রিডাইরেক্ট বা রিফ্রেশ হ্যান্ডেল করা হবে
    return { success: true, message: "Order deleted successfully" };

  } catch (error) {
    console.error("DELETE_ORDER_ERROR", error);
    return { success: false, error: "Failed to delete order" };
  }
}