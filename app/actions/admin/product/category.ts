// app/actions/admin/product/category.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: CategoryNode[];
};

export type CategoryWithDetails = Prisma.CategoryGetPayload<{
  include: {
    parent: { select: { name: true } };
    _count: { select: { products: true } };
  };
}>;

// --- 1. CREATE CATEGORY (Shopify Logic) ---
export async function createCategory(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const parentId = formData.get("parentId") as string;
    const image = formData.get("image") as string;
    
    // SEO Fields
    const metaTitle = formData.get("metaTitle") as string;
    const metaDesc = formData.get("metaDesc") as string;
    const isActive = formData.get("isActive") === "true";

    // Validation
    if (!name) return { success: false, error: "Category name is required." };

    // Smart Slug Generation
    let slug = formData.get("slug") as string;
    if (!slug || slug.trim() === "") {
      slug = name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/[\s_-]+/g, '-') // Replace spaces with -
        .replace(/^-+|-+$/g, ''); // Trim -
    } else {
      slug = slug.toLowerCase().trim().replace(/ /g, '-');
    }

    // Unique Slug Check
    const existing = await db.category.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // Database Creation
    await db.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        parentId: (parentId && parentId !== "none") ? parentId : null,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        isActive
      }
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category created successfully." };

  } catch (error: any) {
    console.error("CREATE_CATEGORY_ERROR", error);
    return { success: false, error: "Database Error: Could not create category." };
  }
}

// --- 2. UPDATE CATEGORY ---
export async function updateCategory(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const parentId = formData.get("parentId") as string;
    const image = formData.get("image") as string;
    
    const metaTitle = formData.get("metaTitle") as string;
    const metaDesc = formData.get("metaDesc") as string;
    const isActive = formData.get("isActive") === "true";

    if (!id || !name) return { success: false, error: "Invalid data provided." };

    // Prevent Self-Parenting Loop
    if (parentId === id) {
      return { success: false, error: "A category cannot be its own parent." };
    }

    // Slug Update Logic
    let slug = formData.get("slug") as string;
    if (slug) {
      slug = slug.toLowerCase().trim().replace(/ /g, '-');
      // Check if new slug conflicts with others
      const existing = await db.category.findFirst({
        where: { slug, NOT: { id } }
      });
      if (existing) return { success: false, error: "Slug already exists." };
    }

    await db.category.update({
      where: { id },
      data: {
        name,
        slug: slug || undefined,
        description: description || null,
        image: image || null,
        parentId: (parentId && parentId !== "none") ? parentId : null,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        isActive
      }
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category updated successfully." };

  } catch (error: any) {
    console.error("UPDATE_CATEGORY_ERROR", error);
    return { success: false, error: "Failed to update category." };
  }
}

// --- 3. DELETE CATEGORY ---
export async function deleteCategory(id: string) {
  try {
    // Check if category has products
    const productCount = await db.product.count({
      where: { categoryId: id }
    });

    if (productCount > 0) {
      return { success: false, error: `Cannot delete: This category contains ${productCount} products.` };
    }

    // Check if category has sub-categories
    const childCount = await db.category.count({
      where: { parentId: id }
    });

    if (childCount > 0) {
      return { success: false, error: "Cannot delete: This category has sub-categories." };
    }

    await db.category.delete({ where: { id } });
    
    revalidatePath("/admin/categories");
    return { success: true, message: "Category deleted successfully." };
  } catch (error: any) {
    return { success: false, error: "Internal error during deletion." };
  }
}

// --- 4. GET ALL CATEGORIES (For List Table) ---
export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } }
      },
      // ✅ FIX: 'createdAt' might cause issue if schema mismatch, using 'name' is safer
      orderBy: { name: 'asc' } 
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("GET_CATEGORIES_ERROR", error);
    return { success: false, data: [] };
  }
}

// --- 5. GET CATEGORY TREE (Recursive Logic for Dropdown) ---
export async function getCategoryTree() {
  try {
    const categories = await db.category.findMany({
      select: { id: true, name: true, parentId: true, slug: true },
      orderBy: { name: 'asc' }
    });
    return categories;
  } catch (error) {
    return [];
  }
}