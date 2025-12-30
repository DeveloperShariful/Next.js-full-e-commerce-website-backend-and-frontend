// File: app/actions/admin/categories/delete.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteCategory(id: string) {
  try {
    // 1. Check if category has active products
    const productCount = await db.product.count({
      where: { categoryId: id, deletedAt: null }
    });

    if (productCount > 0) {
      return { success: false, error: `Cannot delete: Contains ${productCount} active products.` };
    }

    // 2. Check if category has active sub-categories
    const childCount = await db.category.count({
      where: { parentId: id, deletedAt: null }
    });

    if (childCount > 0) {
      return { success: false, error: "Cannot delete: Has sub-categories. Delete them first." };
    }

    // 3. Perform Soft Delete (Update deletedAt instead of removing record)
    await db.category.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    revalidatePath("/admin/categories");
    return { success: true, message: "Category moved to trash." };
  } catch (error) {
    console.error("DELETE_ERROR", error);
    return { success: false, error: "Internal error during deletion." };
  }
}