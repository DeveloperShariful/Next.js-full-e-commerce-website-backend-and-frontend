// app/actions/admin/product/product-list.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function deleteProduct(id: string) {
  try {
    await db.product.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'archived' }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

export async function bulkProductAction(formData: FormData) {
  const ids = JSON.parse(formData.get("ids") as string);
  const action = formData.get("action") as string;

  if (!ids.length) return { success: false, message: "No items selected" };

  try {
    switch (action) {
      case "trash":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "archived" }
        });
        break;
      
      case "delete":
        // Hard delete from DB
        await db.product.deleteMany({
          where: { id: { in: ids } }
        });
        break;

      case "restore":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "draft" } // Restore as draft for safety
        });
        break;

      case "publish":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "active" }
        });
        break;

      case "unpublish":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "draft" }
        });
        break;
    }
    
    revalidatePath("/admin/products");
    return { success: true, message: "Bulk action applied" };
  } catch (error) {
    return { success: false, message: "Action failed" };
  }
}

export async function moveToTrash(id: string) {
    try {
        await db.product.update({
            where: { id },
            data: { status: 'archived' }
        });
        revalidatePath("/admin/products");
    } catch (error) {
        console.error(error);
    }
}