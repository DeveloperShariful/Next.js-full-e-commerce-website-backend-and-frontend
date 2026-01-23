// app/actions/admin/product/category.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server"; // 🔥 NEW: Auth check for logging

// --- Types ---
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

// --- Zod Schema (Updated with mediaId) ---
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  mediaId: z.string().optional().nullable(), // 🔥 NEW: Media Relation Support
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
});

// --- Helper: Get DB User ID ---
async function getDbUserId() {
    const user = await currentUser();
    if (!user) return null;
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });
    return dbUser?.id;
}

// --- Helper: Optimized Unique Slug Generator ---
async function generateUniqueSlug(name: string, requestedSlug?: string, ignoreId?: string) {
  let baseSlug = requestedSlug && requestedSlug.trim() !== "" ? requestedSlug : name;

  baseSlug = baseSlug.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // 🔥 Smart Check: Find all similar slugs at once
  const collisions = await db.category.findMany({
    where: { 
      slug: { startsWith: baseSlug }, 
      ...(ignoreId ? { id: { not: ignoreId } } : {}) 
    },
    select: { slug: true }
  });

  if (collisions.length === 0) return baseSlug;

  // Check for exact match or suffixes
  const exactMatch = collisions.some(c => c.slug === baseSlug);
  if (!exactMatch) return baseSlug;

  // Find max suffix
  const suffixes = collisions.map(c => {
    const parts = c.slug.split(`${baseSlug}-`);
    return parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
  });
  
  const maxSuffix = Math.max(...suffixes);
  return `${baseSlug}-${maxSuffix + 1}`;
}

// --- 1. CREATE CATEGORY ---
export async function createCategory(formData: FormData) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized access." };

    // 1. Parse Data
    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      parentId: formData.get("parentId") === "none" ? null : formData.get("parentId"),
      image: formData.get("image"),
      mediaId: formData.get("mediaId"), // 🔥 Catch mediaId from form
      slug: formData.get("slug"),
      metaTitle: formData.get("metaTitle"),
      metaDesc: formData.get("metaDesc"),
      isActive: formData.get("isActive"),
    };

    const validation = categorySchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }
    const data = validation.data;

    // 2. Generate Slug
    const slug = await generateUniqueSlug(data.name, data.slug);

    // 3. Create in DB
    const category = await db.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        image: data.image || null,
        mediaId: data.mediaId || null, // 🔥 Link to Media table
        parentId: data.parentId || null,
        metaTitle: data.metaTitle || null,
        metaDesc: data.metaDesc || null,
        isActive: data.isActive
      }
    });

    // 4. Log Activity
    await db.activityLog.create({
        data: {
            userId,
            action: "CREATED_CATEGORY",
            entityType: "Category",
            entityId: category.id,
            details: { name: category.name, slug: category.slug }
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
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized access." };

    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Category ID missing." };

    // 1. Parse Data
    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      parentId: formData.get("parentId") === "none" ? null : formData.get("parentId"),
      image: formData.get("image"),
      mediaId: formData.get("mediaId"),
      slug: formData.get("slug"),
      metaTitle: formData.get("metaTitle"),
      metaDesc: formData.get("metaDesc"),
      isActive: formData.get("isActive"),
    };

    const validation = categorySchema.safeParse(rawData);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }
    const data = validation.data;

    // 2. Check Self-Parenting
    if (data.parentId === id) {
      return { success: false, error: "A category cannot be its own parent." };
    }

    // 3. Generate Slug (only if changed)
    let slug = undefined;
    if (data.slug || data.name) {
       // Only regen if explicitly requested or name changed, logic handled inside generator
       slug = await generateUniqueSlug(data.name, data.slug, id);
    }

    // 4. Fetch Old Data for Diff Log
    const oldData = await db.category.findUnique({ where: { id } });

    // 5. Update DB
    const updatedCategory = await db.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: slug,
        description: data.description || null,
        image: data.image || null,
        mediaId: data.mediaId || null,
        parentId: data.parentId || null,
        metaTitle: data.metaTitle || null,
        metaDesc: data.metaDesc || null,
        isActive: data.isActive
      }
    });

    // 6. Log Diff
    if (oldData) {
        const changes: any = {};
        if (oldData.name !== data.name) changes.name = { old: oldData.name, new: data.name };
        if (oldData.isActive !== data.isActive) changes.isActive = { old: oldData.isActive, new: data.isActive };
        
        if (Object.keys(changes).length > 0) {
            await db.activityLog.create({
                data: {
                    userId,
                    action: "UPDATED_CATEGORY",
                    entityType: "Category",
                    entityId: id,
                    details: changes
                }
            });
        }
    }

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
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized access." };

    // Fetch details before delete for logs
    const categoryToDelete = await db.category.findUnique({ 
        where: { id },
        select: { name: true } 
    });

    if (!categoryToDelete) return { success: false, error: "Category not found." };

    // Check constraints
    const productCount = await db.product.count({ where: { categoryId: id } });
    if (productCount > 0) return { success: false, error: `Contains ${productCount} products.` };

    const childCount = await db.category.count({ where: { parentId: id } });
    if (childCount > 0) return { success: false, error: "Has sub-categories." };

    await db.category.delete({ where: { id } });
    
    // Log Activity
    await db.activityLog.create({
        data: {
            userId,
            action: "DELETED_CATEGORY",
            entityType: "Category",
            entityId: id,
            details: { name: categoryToDelete.name }
        }
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category deleted." };
  } catch (error: any) {
    return { success: false, error: "Delete failed." };
  }
}

// --- 4. GET ALL CATEGORIES ---
export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' } 
    });
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// --- 5. GET CATEGORY TREE ---
export async function getCategoryTree() {
  try {
    return await db.category.findMany({
      select: { id: true, name: true, parentId: true, slug: true },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    return [];
  }
}