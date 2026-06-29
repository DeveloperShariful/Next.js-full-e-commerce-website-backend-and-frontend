// File: app/actions/backend/product/product-category.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

// ==========================================
// TYPES
// ==========================================

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  googleCategoryName: string | null;
  children?: CategoryNode[];
};

export type CategoryWithDetails = Prisma.CategoryGetPayload<{
  include: {
    parent: { select: { name: true } };
    _count: { select: { products: true } };
  };
}>;

// ==========================================
// ZOD SCHEMA
// ==========================================

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  mediaId: z.string().optional().nullable(),
  slug: z.string().optional(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  menuOrder: z.coerce.number().int().nonnegative().default(0),
});

type CategoryInput = z.infer<typeof categorySchema>;

// ==========================================
// HELPERS
// ==========================================

async function getDbUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!dbUser) return null;
  const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"] as const;
  if (!(allowed as readonly string[]).includes(dbUser.role)) return null;
  return dbUser.id;
}

async function generateUniqueSlug(
  name: string,
  requestedSlug?: string | null,
  ignoreId?: string
): Promise<string> {
  let base =
    requestedSlug && requestedSlug.trim() !== "" ? requestedSlug : name;

  base = base
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const collisions = await db.category.findMany({
    where: {
      slug: { startsWith: base },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { slug: true },
  });

  if (collisions.length === 0) return base;
  const exactMatch = collisions.some((c) => c.slug === base);
  if (!exactMatch) return base;

  const suffixes = collisions.map((c) => {
    const parts = c.slug.split(`${base}-`);
    return parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
  });

  return `${base}-${Math.max(...suffixes) + 1}`;
}

function buildChangeDelta(
  oldData: CategoryWithDetails,
  newData: CategoryInput
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  const comparisons: Array<{
    field: keyof CategoryInput;
    oldKey: keyof CategoryWithDetails;
  }> = [
    { field: "name", oldKey: "name" },
    { field: "description", oldKey: "description" },
    { field: "parentId", oldKey: "parentId" },
    { field: "image", oldKey: "image" },
    { field: "mediaId", oldKey: "mediaId" },
    { field: "metaTitle", oldKey: "metaTitle" },
    { field: "metaDesc", oldKey: "metaDesc" },
    { field: "isActive", oldKey: "isActive" },
    { field: "menuOrder", oldKey: "menuOrder" },
  ];

  for (const { field, oldKey } of comparisons) {
    const oldVal = (oldData[oldKey] as unknown) ?? null;
    const newVal = (newData[field] as unknown) ?? null;
    if (oldVal !== newVal) {
      changes[field] = { old: oldVal, new: newVal };
    }
  }

  return changes;
}

function parseFormData(formData: FormData, includeId = false) {
  return {
    ...(includeId ? { id: (formData.get("id") as string | null)?.trim() } : {}),
    name: formData.get("name"),
    description: formData.get("description") || null,
    parentId:
      formData.get("parentId") === "none"
        ? null
        : formData.get("parentId") || null,
    image: formData.get("image") || null,
    mediaId: formData.get("mediaId") || null,
    slug: formData.get("slug") || undefined,
    metaTitle: formData.get("metaTitle") || null,
    metaDesc: formData.get("metaDesc") || null,
    isActive: formData.get("isActive"),
    menuOrder: formData.get("menuOrder"),
  };
}

// ==========================================
// 1. GET CATEGORIES (with filter + counts)
// ==========================================

export async function getCategories(
  filter: "active" | "trash" = "active"
): Promise<{
  success: boolean;
  data: CategoryWithDetails[];
  counts: { active: number; trash: number; all: number };
}> {
  try {
    const [activeCount, trashCount] = await Promise.all([
      db.category.count({ where: { deletedAt: null } }),
      db.category.count({ where: { deletedAt: { not: null } } }),
    ]);

    const whereClause: Prisma.CategoryWhereInput =
      filter === "trash"
        ? { deletedAt: { not: null } }
        : { deletedAt: null };

    const categories = await db.category.findMany({
      where: whereClause,
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } },
      },
      orderBy: { menuOrder: "asc" },
    });

    return {
      success: true,
      data: categories,
      counts: {
        active: activeCount,
        trash: trashCount,
        all: activeCount + trashCount,
      },
    };
  } catch (error) {
    console.error("GET_CATEGORIES_ERROR", error);
    return {
      success: false,
      data: [],
      counts: { active: 0, trash: 0, all: 0 },
    };
  }
}

// ==========================================
// 2. GET CATEGORY TREE (dropdowns)
// ==========================================

export async function getCategoryTree(): Promise<CategoryNode[]> {
  try {
    return await db.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, parentId: true, slug: true, googleCategoryName: true },
      orderBy: { menuOrder: "asc" },
    });
  } catch {
    return [];
  }
}

// ==========================================
// 3. CREATE CATEGORY
// ==========================================

export async function createCategory(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const validation = categorySchema.safeParse(parseFormData(formData));
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;
  const slug = await generateUniqueSlug(data.name, data.slug);

  try {
    const category = await db.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        image: data.image ?? null,
        mediaId: data.mediaId ?? null,
        parentId: data.parentId ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
        isActive: data.isActive,
        menuOrder: data.menuOrder,
      },
    });

    await logActivity({
      action: "CATEGORY_CREATED",
      entityType: "Category",
      entityId: category.id,
      details: {
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ?? null,
        isActive: category.isActive,
        menuOrder: category.menuOrder,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category created successfully." };
  } catch (error) {
    console.error("CREATE_CATEGORY_ERROR", error);
    return { success: false, error: "Database error: could not create category." };
  }
}

// ==========================================
// 4. UPDATE CATEGORY
// ==========================================

export async function updateCategory(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { success: false, error: "Category ID missing." };

  const validation = categorySchema.safeParse(parseFormData(formData));
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  if (data.parentId === id) {
    return { success: false, error: "A category cannot be its own parent." };
  }

  const oldData = await db.category.findUnique({
    where: { id },
    include: {
      parent: { select: { name: true } },
      _count: { select: { products: true } },
    },
  });

  if (!oldData) return { success: false, error: "Category not found." };

  const slug = await generateUniqueSlug(data.name, data.slug, id);

  try {
    await db.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        image: data.image ?? null,
        mediaId: data.mediaId ?? null,
        parentId: data.parentId ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
        isActive: data.isActive,
        menuOrder: data.menuOrder,
      },
    });

    const changes = buildChangeDelta(oldData, data);

    await logActivity({
      action: "CATEGORY_UPDATED",
      entityType: "Category",
      entityId: id,
      details: {
        categoryName: oldData.name,
        newSlug: slug,
        changedFields: Object.keys(changes),
        changes,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category updated successfully." };
  } catch (error) {
    console.error("UPDATE_CATEGORY_ERROR", error);
    return { success: false, error: "Failed to update category." };
  }
}

// ==========================================
// 5. SOFT DELETE (MOVE TO TRASH)
// ==========================================

export async function deleteCategory(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const category = await db.category.findUnique({
    where: { id },
    select: { name: true, slug: true, deletedAt: true },
  });

  if (!category) return { success: false, error: "Category not found." };
  if (category.deletedAt) {
    return { success: false, error: "Category is already in trash." };
  }

  const [productCount, childCount] = await Promise.all([
    db.product.count({
      where: { categories: { some: { id } }, deletedAt: null },
    }),
    db.category.count({ where: { parentId: id, deletedAt: null } }),
  ]);

  if (productCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${productCount} active product(s) are linked to this category.`,
    };
  }

  if (childCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${childCount} sub-category(ies) exist. Delete or move them first.`,
    };
  }

  try {
    await db.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      action: "CATEGORY_SOFT_DELETED",
      entityType: "Category",
      entityId: id,
      details: {
        name: category.name,
        slug: category.slug,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category moved to trash." };
  } catch (error) {
    console.error("DELETE_CATEGORY_ERROR", error);
    return { success: false, error: "Internal error during deletion." };
  }
}

// ==========================================
// 6. RESTORE FROM TRASH
// ==========================================

export async function restoreCategory(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const category = await db.category.findUnique({
    where: { id },
    select: { name: true, slug: true, deletedAt: true },
  });

  if (!category) return { success: false, error: "Category not found." };
  if (!category.deletedAt) {
    return { success: false, error: "Category is not in trash." };
  }

  try {
    await db.category.update({
      where: { id },
      data: { deletedAt: null },
    });

    await logActivity({
      action: "CATEGORY_RESTORED",
      entityType: "Category",
      entityId: id,
      details: {
        name: category.name,
        slug: category.slug,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category restored from trash." };
  } catch (error) {
    console.error("RESTORE_CATEGORY_ERROR", error);
    return { success: false, error: "Failed to restore category." };
  }
}

// ==========================================
// 7. FORCE DELETE (PERMANENT)
// ==========================================

export async function forceDeleteCategory(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const category = await db.category.findUnique({
    where: { id },
    select: { name: true, slug: true },
  });

  if (!category) return { success: false, error: "Category not found." };

  const productCount = await db.product.count({
    where: { categories: { some: { id } } },
  });

  if (productCount > 0) {
    return {
      success: false,
      error: `Cannot permanently delete: ${productCount} product(s) still linked.`,
    };
  }

  try {
    await db.category.delete({ where: { id } });

    await logActivity({
      action: "CATEGORY_FORCE_DELETED",
      entityType: "Category",
      entityId: id,
      details: {
        name: category.name,
        slug: category.slug,
        permanent: true,
      },
    });

    revalidatePath("/admin/categories");
    return { success: true, message: "Category permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_CATEGORY_ERROR", error);
    return { success: false, error: "Failed to permanently delete category." };
  }
}

// ==========================================
// 8. UPDATE CATEGORY ORDER (drag-n-drop)
// ==========================================

export async function updateCategoryOrder(
  items: { id: string; menuOrder: number }[]
): Promise<{ success: boolean; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  try {
    await db.$transaction(
      items.map(({ id, menuOrder }) =>
        db.category.update({ where: { id }, data: { menuOrder } })
      )
    );
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("UPDATE_CATEGORY_ORDER_ERROR", error);
    return { success: false, error: "Failed to update order." };
  }
}
