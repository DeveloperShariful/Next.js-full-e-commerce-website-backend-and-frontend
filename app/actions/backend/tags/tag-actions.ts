// File: app/actions/admin/tags/tag-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. FETCH TAGS (With Counts & Filters)
// ==========================================
export async function getTags(filter: "active" | "trash" = "active", query: string = "") {
  try {
    // Get counts for WP style headers: All | Trash
    const [activeCount, trashCount] = await Promise.all([
      db.tag.count({ where: { deletedAt: null } }),
      db.tag.count({ where: { deletedAt: { not: null } } })
    ]);

    // Determine where clause based on filter
    const baseWhere = filter === "trash" 
      ? { deletedAt: { not: null } } 
      : { deletedAt: null };

    const whereCondition = query
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : baseWhere;

    const tags = await db.tag.findMany({
      where: whereCondition,
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: 'desc' } 
    });

    return { 
      success: true, 
      data: tags as any, 
      counts: {
        active: activeCount,
        trash: trashCount,
        all: activeCount
      }
    };
  } catch (error) {
    console.error("GET_TAGS_ERROR", error);
    return { success: false, data: [], counts: { active: 0, trash: 0, all: 0 } };
  }
}

// ==========================================
// 2. CREATE TAG
// ==========================================
export async function createTag(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name) return { success: false, error: "Name is required" };

    // Slug Logic
    let slug = formData.get("slug") as string;
    if (!slug || slug.trim() === "") {
      slug = name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else {
      slug = slug.toLowerCase().trim().replace(/ /g, '-');
    }
    
    // Duplicate slug check
    const existing = await db.tag.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    await db.tag.create({
      data: {
        name,
        slug,
        description: (formData.get("description") as string) || null,
        color: (formData.get("color") as string) || null,
        metaTitle: (formData.get("metaTitle") as string) || null,
        metaDesc: (formData.get("metaDesc") as string) || null,
      }
    });

    revalidatePath("/admin/tags");
    return { success: true, message: "Tag created successfully." };
  } catch (error) {
    console.error("CREATE_TAG_ERROR", error);
    return { success: false, error: "Failed to create tag." };
  }
}

// ==========================================
// 3. UPDATE TAG
// ==========================================
export async function updateTag(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "ID missing." };

    const name = formData.get("name") as string;
    let slug = formData.get("slug") as string;

    await db.tag.update({
      where: { id },
      data: {
        name,
        slug,
        description: (formData.get("description") as string) || null,
        color: (formData.get("color") as string) || null,
        metaTitle: (formData.get("metaTitle") as string) || null,
        metaDesc: (formData.get("metaDesc") as string) || null,
      }
    });

    revalidatePath("/admin/tags");
    return { success: true, message: "Tag updated successfully." };
  } catch (error: any) {
    console.error("UPDATE_TAG_ERROR", error);
    if (error.code === 'P2002') {
      return { success: false, error: "This slug is already in use." };
    }
    return { success: false, error: "Failed to update tag." };
  }
}

// ==========================================
// 4. SOFT DELETE (MOVE TO TRASH)
// ==========================================
export async function deleteTag(id: string) {
  try {
    // Check if tag is used in active products
    const productCount = await db.product.count({
      where: {
        tags: { some: { id } },
        deletedAt: null
      }
    });

    if (productCount > 0) {
      return { success: false, error: `Cannot delete: Tag is attached to ${productCount} active products.` };
    }

    // Soft delete
    await db.tag.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    revalidatePath("/admin/tags");
    return { success: true, message: "Tag moved to trash." };
  } catch (error) {
    console.error("DELETE_TAG_ERROR", error);
    return { success: false, error: "Internal error during deletion." };
  }
}

// ==========================================
// 5. RESTORE TAG
// ==========================================
export async function restoreTag(id: string) {
  try {
    await db.tag.update({
      where: { id },
      data: { deletedAt: null }
    });
    
    revalidatePath("/admin/tags");
    return { success: true, message: "Tag restored from trash." };
  } catch (error) {
    console.error("RESTORE_TAG_ERROR", error);
    return { success: false, error: "Failed to restore tag." };
  }
}

// ==========================================
// 6. FORCE DELETE (PERMANENT)
// ==========================================
export async function forceDeleteTag(id: string) {
  try {
    await db.tag.delete({
      where: { id }
    });
    
    revalidatePath("/admin/tags");
    return { success: true, message: "Tag permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_TAG_ERROR", error);
    return { success: false, error: "Failed to permanently delete tag." };
  }
}