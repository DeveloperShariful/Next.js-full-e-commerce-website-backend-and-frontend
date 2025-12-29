// File: app/actions/admin/categories/update.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateCategory(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const parentId = formData.get("parentId") as string;

    if (!id) return { success: false, error: "ID missing." };

    // Prevent Loop (Category cannot be its own parent)
    if (parentId === id) {
      return { success: false, error: "Category cannot be its own parent." };
    }

    await db.category.update({
      where: { id },
      data: {
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        description: (formData.get("description") as string) || null,
        image: (formData.get("image") as string) || null,
        parentId: (parentId && parentId !== "none") ? parentId : null,
        isActive: formData.get("isActive") === "true",
        menuOrder: parseInt(formData.get("menuOrder") as string) || 0, // Schema Support
        metaTitle: (formData.get("metaTitle") as string) || null,
        metaDesc: (formData.get("metaDesc") as string) || null,
      }
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category updated successfully." };
  } catch (error) {
    console.error("UPDATE_ERROR", error);
    return { success: false, error: "Failed to update category." };
  }
}