// app/actions/admin/product/product-list.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client"; // 🚀 IMPORT ENUM

export async function deleteProduct(id: string) {
  try {
    await db.product.update({
        where: { id },
        data: { 
            deletedAt: new Date(), 
            status: ProductStatus.ARCHIVED // 🚀 FIX: Use Enum
        }
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
          data: { status: ProductStatus.ARCHIVED } // 🚀 FIX
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
          data: { status: ProductStatus.DRAFT } // 🚀 FIX
        });
        break;

      case "publish":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: ProductStatus.ACTIVE } // 🚀 FIX
        });
        break;

      case "unpublish":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: ProductStatus.DRAFT } // 🚀 FIX
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
            data: { status: ProductStatus.ARCHIVED } // 🚀 FIX
        });
        revalidatePath("/admin/products");
    } catch (error) {
        console.error(error);
    }
}