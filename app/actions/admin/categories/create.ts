// File: app/actions/admin/categories/create.ts
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const parentId = formData.get("parentId") as string;
    
    // Slug Generation Logic
    let slug = formData.get("slug") as string;
    if (!slug || slug.trim() === "") {
      slug = name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else {
      slug = slug.toLowerCase().trim().replace(/ /g, '-');
    }
    
    // Check for duplicate slug
    const existing = await db.category.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    await db.category.create({
      data: {
        name,
        slug,
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
    return { success: true, message: "Category created successfully." };
  } catch (error) {
    console.error("CREATE_ERROR", error);
    return { success: false, error: "Failed to create category." };
  }
}