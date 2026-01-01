// File: app/actions/storefront/cart/remove-item.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function removeCartItem(itemId: string) {
  try {
    await db.cartItem.delete({
      where: { id: itemId }
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");

    return { success: true, message: "Item removed" };
  } catch (error) {
    console.error("Remove Item Error:", error);
    return { success: false, message: "Failed to remove item" };
  }
}