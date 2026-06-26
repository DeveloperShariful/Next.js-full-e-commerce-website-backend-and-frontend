// File: app/actions/backend/tags/tag-actions.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// ==========================================
// TYPES
// ==========================================

export type TagWithCount = Prisma.TagGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

// ==========================================
// ZOD SCHEMA
// ==========================================

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
});

type TagInput = z.infer<typeof tagSchema>;

// ==========================================
// HELPERS
// ==========================================

async function getDbUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  return dbUser?.id ?? null;
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

  const collisions = await db.tag.findMany({
    where: {
      slug: { startsWith: base },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { slug: true },
  });

  if (collisions.length === 0) return base;
  const exactMatch = collisions.some((t) => t.slug === base);
  if (!exactMatch) return base;

  const suffixes = collisions.map((t) => {
    const parts = t.slug.split(`${base}-`);
    return parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
  });

  return `${base}-${Math.max(...suffixes) + 1}`;
}

function buildChangeDelta(
  oldData: TagWithCount,
  newData: TagInput
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  const fields: Array<keyof TagInput> = [
    "name",
    "description",
    "color",
    "metaTitle",
    "metaDesc",
  ];

  for (const field of fields) {
    const oldVal = (oldData[field as keyof typeof oldData] as unknown) ?? null;
    const newVal = (newData[field] as unknown) ?? null;
    if (oldVal !== newVal) {
      changes[field] = { old: oldVal, new: newVal };
    }
  }

  return changes;
}

// ==========================================
// 1. GET TAGS (with filter + search + counts)
// ==========================================

export async function getTags(
  filter: "active" | "trash" = "active",
  query = ""
): Promise<{
  success: boolean;
  data: TagWithCount[];
  counts: { active: number; trash: number; all: number };
}> {
  try {
    const [activeCount, trashCount] = await Promise.all([
      db.tag.count({ where: { deletedAt: null } }),
      db.tag.count({ where: { deletedAt: { not: null } } }),
    ]);

    const baseWhere: Prisma.TagWhereInput =
      filter === "trash"
        ? { deletedAt: { not: null } }
        : { deletedAt: null };

    const whereCondition: Prisma.TagWhereInput = query
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        }
      : baseWhere;

    const tags = await db.tag.findMany({
      where: whereCondition,
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: tags,
      counts: {
        active: activeCount,
        trash: trashCount,
        all: activeCount + trashCount,
      },
    };
  } catch (error) {
    console.error("GET_TAGS_ERROR", error);
    return {
      success: false,
      data: [],
      counts: { active: 0, trash: 0, all: 0 },
    };
  }
}

// ==========================================
// 2. CREATE TAG
// ==========================================

export async function createTag(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const validation = tagSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || null,
    color: formData.get("color") || null,
    metaTitle: formData.get("metaTitle") || null,
    metaDesc: formData.get("metaDesc") || null,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;
  const slug = await generateUniqueSlug(data.name, data.slug);

  try {
    const tag = await db.tag.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        color: data.color ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
      },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "TAG_CREATED",
        entityType: "Tag",
        entityId: tag.id,
        details: {
          name: tag.name,
          slug: tag.slug,
          color: tag.color ?? null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/tags");
    return { success: true, message: "Tag created successfully." };
  } catch (error) {
    console.error("CREATE_TAG_ERROR", error);
    return { success: false, error: "Database error: could not create tag." };
  }
}

// ==========================================
// 3. UPDATE TAG
// ==========================================

export async function updateTag(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { success: false, error: "Tag ID missing." };

  const validation = tagSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || null,
    color: formData.get("color") || null,
    metaTitle: formData.get("metaTitle") || null,
    metaDesc: formData.get("metaDesc") || null,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  const oldData = await db.tag.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!oldData) return { success: false, error: "Tag not found." };

  const slug = await generateUniqueSlug(data.name, data.slug, id);

  try {
    await db.tag.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        color: data.color ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
      },
    });

    const changes = buildChangeDelta(oldData, data);

    await db.activityLog.create({
      data: {
        userId,
        action: "TAG_UPDATED",
        entityType: "Tag",
        entityId: id,
        details: {
          tagName: oldData.name,
          newSlug: slug,
          changedFields: Object.keys(changes),
          changes,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/tags");
    return { success: true, message: "Tag updated successfully." };
  } catch (error) {
    console.error("UPDATE_TAG_ERROR", error);
    return { success: false, error: "Failed to update tag." };
  }
}

// ==========================================
// 4. SOFT DELETE (MOVE TO TRASH)
// ==========================================

export async function deleteTag(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const tag = await db.tag.findUnique({
    where: { id },
    select: { name: true, slug: true, deletedAt: true },
  });

  if (!tag) return { success: false, error: "Tag not found." };
  if (tag.deletedAt) {
    return { success: false, error: "Tag is already in trash." };
  }

  const productCount = await db.product.count({
    where: { tags: { some: { id } }, deletedAt: null },
  });

  if (productCount > 0) {
    return {
      success: false,
      error: `Cannot delete: Tag is attached to ${productCount} active product(s).`,
    };
  }

  try {
    await db.tag.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "TAG_SOFT_DELETED",
        entityType: "Tag",
        entityId: id,
        details: {
          name: tag.name,
          slug: tag.slug,
        } as unknown as Prisma.InputJsonValue,
      },
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

export async function restoreTag(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const tag = await db.tag.findUnique({
    where: { id },
    select: { name: true, slug: true, deletedAt: true },
  });

  if (!tag) return { success: false, error: "Tag not found." };
  if (!tag.deletedAt) {
    return { success: false, error: "Tag is not in trash." };
  }

  try {
    await db.tag.update({
      where: { id },
      data: { deletedAt: null },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "TAG_RESTORED",
        entityType: "Tag",
        entityId: id,
        details: {
          name: tag.name,
          slug: tag.slug,
        } as unknown as Prisma.InputJsonValue,
      },
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

export async function forceDeleteTag(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const tag = await db.tag.findUnique({
    where: { id },
    select: { name: true, slug: true },
  });

  if (!tag) return { success: false, error: "Tag not found." };

  const productCount = await db.product.count({
    where: { tags: { some: { id } } },
  });

  if (productCount > 0) {
    return {
      success: false,
      error: `Cannot permanently delete: ${productCount} product(s) still use this tag.`,
    };
  }

  try {
    await db.tag.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        userId,
        action: "TAG_FORCE_DELETED",
        entityType: "Tag",
        entityId: id,
        details: {
          name: tag.name,
          slug: tag.slug,
          permanent: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/tags");
    return { success: true, message: "Tag permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_TAG_ERROR", error);
    return { success: false, error: "Failed to permanently delete tag." };
  }
}
