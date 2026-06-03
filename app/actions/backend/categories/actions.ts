//app/actions/admin/categories/actions.ts

// File: app/actions/backend/categories/actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. FETCH CATEGORIES (With Counts & Filters)
// ==========================================
export async function getCategories(filter: "active" | "trash" = "active") {
  try {
    const [activeCount, trashCount] = await Promise.all([
      db.category.count({ where: { deletedAt: null } }),
      db.category.count({ where: { deletedAt: { not: null } } })
    ]);

    const whereClause = filter === "trash" 
      ? { deletedAt: { not: null } } 
      : { deletedAt: null };

    const categories = await db.category.findMany({
      where: whereClause,
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } }
      },
      orderBy: { menuOrder: 'asc' } 
    });

    return { 
      success: true, 
      data: categories as any, 
      counts: {
        active: activeCount,
        trash: trashCount,
        all: activeCount 
      }
    };
  } catch (error) {
    console.error("GET_CATEGORIES_ERROR", error);
    return { success: false, data: [], counts: { active: 0, trash: 0, all: 0 } };
  }
}

// ==========================================
// 2. CREATE CATEGORY
// ==========================================
export async function createCategory(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const parentId = formData.get("parentId") as string;
    
    let slug = formData.get("slug") as string;
    if (!slug || slug.trim() === "") {
      slug = name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else {
      slug = slug.toLowerCase().trim().replace(/ /g, '-');
    }
    
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
        // ✅ FIX: mediaId added from form
        mediaId: (formData.get("mediaId") as string) || null, 
        parentId: (parentId && parentId !== "none") ? parentId : null,
        isActive: formData.get("isActive") === "true",
        menuOrder: parseInt(formData.get("menuOrder") as string) || 0, 
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

// ==========================================
// 3. UPDATE CATEGORY
// ==========================================
export async function updateCategory(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    const parentId = formData.get("parentId") as string;

    if (!id) return { success: false, error: "ID missing." };

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
        // ✅ FIX: mediaId updated from form
        mediaId: (formData.get("mediaId") as string) || null,
        parentId: (parentId && parentId !== "none") ? parentId : null,
        isActive: formData.get("isActive") === "true",
        menuOrder: parseInt(formData.get("menuOrder") as string) || 0, 
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

// ==========================================
// 4. SOFT DELETE (MOVE TO TRASH)
// ==========================================
export async function deleteCategory(id: string) {
  try {
    // ✅ FIX: Updated from categoryId to 'categories: { some: { id } }' due to Many-to-Many relation
    const productCount = await db.product.count({
      where: { 
        categories: { some: { id: id } }, 
        deletedAt: null 
      }
    });

    if (productCount > 0) {
      return { success: false, error: `Cannot delete: Contains ${productCount} active products.` };
    }

    const childCount = await db.category.count({
      where: { parentId: id, deletedAt: null }
    });

    if (childCount > 0) {
      return { success: false, error: "Cannot delete: Has sub-categories. Delete them first." };
    }

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

// ==========================================
// 5. RESTORE CATEGORY
// ==========================================
export async function restoreCategory(id: string) {
  try {
    await db.category.update({
      where: { id },
      data: { deletedAt: null }
    });
    
    revalidatePath("/admin/categories");
    return { success: true, message: "Category restored from trash." };
  } catch (error) {
    console.error("RESTORE_ERROR", error);
    return { success: false, error: "Failed to restore category." };
  }
}

// ==========================================
// 6. FORCE DELETE (PERMANENT)
// ==========================================
export async function forceDeleteCategory(id: string) {
  try {
    await db.category.delete({
      where: { id }
    });
    
    revalidatePath("/admin/categories");
    return { success: true, message: "Category permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_ERROR", error);
    return { success: false, error: "Failed to permanently delete category." };
  }
}