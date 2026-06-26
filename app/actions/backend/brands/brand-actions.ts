// File: app/actions/backend/brands/brand-actions.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// ==========================================
// TYPES
// ==========================================

export type BrandWithCount = Prisma.BrandGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

// ==========================================
// ZOD SCHEMA
// ==========================================

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  website: z.string().url("Invalid website URL").optional().nullable().or(z.literal("")),
  countryOfOrigin: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
});

type BrandInput = z.infer<typeof brandSchema>;

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

  const collisions = await db.brand.findMany({
    where: {
      slug: { startsWith: base },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { slug: true },
  });

  if (collisions.length === 0) return base;
  const exactMatch = collisions.some((b) => b.slug === base);
  if (!exactMatch) return base;

  const suffixes = collisions.map((b) => {
    const parts = b.slug.split(`${base}-`);
    return parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
  });

  return `${base}-${Math.max(...suffixes) + 1}`;
}

function buildChangeDelta(
  oldData: BrandWithCount,
  newData: BrandInput
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  const fields: Array<keyof BrandInput> = [
    "name",
    "description",
    "website",
    "countryOfOrigin",
    "logo",
    "isFeatured",
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
// 1. GET BRANDS (with filter + counts)
// ==========================================

export async function getBrands(
  filter: "active" | "trash" = "active",
  query = ""
): Promise<{
  success: boolean;
  data: BrandWithCount[];
  counts: { active: number; trash: number; all: number };
}> {
  try {
    const [activeCount, trashCount] = await Promise.all([
      db.brand.count({ where: { deletedAt: null } }),
      db.brand.count({ where: { deletedAt: { not: null } } }),
    ]);

    const baseWhere: Prisma.BrandWhereInput =
      filter === "trash"
        ? { deletedAt: { not: null } }
        : { deletedAt: null };

    const whereClause: Prisma.BrandWhereInput = query.trim()
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: query.trim(), mode: "insensitive" } },
            { slug: { contains: query.trim(), mode: "insensitive" } },
          ],
        }
      : baseWhere;

    const brands = await db.brand.findMany({
      where: whereClause,
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: brands,
      counts: {
        active: activeCount,
        trash: trashCount,
        all: activeCount + trashCount,
      },
    };
  } catch (error) {
    console.error("GET_BRANDS_ERROR", error);
    return {
      success: false,
      data: [],
      counts: { active: 0, trash: 0, all: 0 },
    };
  }
}

// ==========================================
// 2. CREATE BRAND
// ==========================================

export async function createBrand(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const validation = brandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || null,
    website: formData.get("website") || null,
    countryOfOrigin: formData.get("countryOfOrigin") || null,
    logo: formData.get("logo") || null,
    isFeatured: formData.get("isFeatured") === "true",
    metaTitle: formData.get("metaTitle") || null,
    metaDesc: formData.get("metaDesc") || null,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;
  const slug = await generateUniqueSlug(data.name, data.slug);

  try {
    const brand = await db.brand.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        website: data.website || null,
        countryOfOrigin: data.countryOfOrigin ?? null,
        logo: data.logo ?? null,
        isFeatured: data.isFeatured,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
      },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "BRAND_CREATED",
        entityType: "Brand",
        entityId: brand.id,
        details: {
          name: brand.name,
          slug: brand.slug,
          website: brand.website ?? null,
          countryOfOrigin: brand.countryOfOrigin ?? null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/brands");
    return { success: true, message: "Brand created successfully." };
  } catch (error) {
    console.error("CREATE_BRAND_ERROR", error);
    return { success: false, error: "Database error: could not create brand." };
  }
}

// ==========================================
// 3. UPDATE BRAND
// ==========================================

export async function updateBrand(
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { success: false, error: "Brand ID missing." };

  const validation = brandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || null,
    website: formData.get("website") || null,
    countryOfOrigin: formData.get("countryOfOrigin") || null,
    logo: formData.get("logo") || null,
    isFeatured: formData.get("isFeatured") === "true",
    metaTitle: formData.get("metaTitle") || null,
    metaDesc: formData.get("metaDesc") || null,
  });

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const data = validation.data;

  const oldData = await db.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });

  if (!oldData) return { success: false, error: "Brand not found." };

  const slug = await generateUniqueSlug(data.name, data.slug, id);

  try {
    await db.brand.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        website: data.website || null,
        countryOfOrigin: data.countryOfOrigin ?? null,
        logo: data.logo ?? null,
        isFeatured: data.isFeatured,
        metaTitle: data.metaTitle ?? null,
        metaDesc: data.metaDesc ?? null,
      },
    });

    const changes = buildChangeDelta(oldData, data);

    await db.activityLog.create({
      data: {
        userId,
        action: "BRAND_UPDATED",
        entityType: "Brand",
        entityId: id,
        details: {
          brandName: oldData.name,
          newSlug: slug,
          changedFields: Object.keys(changes),
          changes,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/brands");
    return { success: true, message: "Brand updated successfully." };
  } catch (error) {
    console.error("UPDATE_BRAND_ERROR", error);
    return { success: false, error: "Failed to update brand." };
  }
}

// ==========================================
// 4. SOFT DELETE (MOVE TO TRASH)
// ==========================================

export async function deleteBrand(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const brand = await db.brand.findUnique({
    where: { id },
    select: { name: true, slug: true, deletedAt: true },
  });

  if (!brand) return { success: false, error: "Brand not found." };
  if (brand.deletedAt) {
    return { success: false, error: "Brand is already in trash." };
  }

  const productCount = await db.product.count({
    where: { brandId: id, deletedAt: null },
  });

  if (productCount > 0) {
    return {
      success: false,
      error: `Cannot delete: Brand is attached to ${productCount} active product(s).`,
    };
  }

  try {
    await db.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "BRAND_SOFT_DELETED",
        entityType: "Brand",
        entityId: id,
        details: {
          name: brand.name,
          slug: brand.slug,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/brands");
    return { success: true, message: "Brand moved to trash." };
  } catch (error) {
    console.error("DELETE_BRAND_ERROR", error);
    return { success: false, error: "Internal error during deletion." };
  }
}

// ==========================================
// 5. RESTORE BRAND
// ==========================================

export async function restoreBrand(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const brand = await db.brand.findUnique({
    where: { id },
    select: { name: true, slug: true, deletedAt: true },
  });

  if (!brand) return { success: false, error: "Brand not found." };
  if (!brand.deletedAt) {
    return { success: false, error: "Brand is not in trash." };
  }

  try {
    await db.brand.update({
      where: { id },
      data: { deletedAt: null },
    });

    await db.activityLog.create({
      data: {
        userId,
        action: "BRAND_RESTORED",
        entityType: "Brand",
        entityId: id,
        details: {
          name: brand.name,
          slug: brand.slug,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/brands");
    return { success: true, message: "Brand restored from trash." };
  } catch (error) {
    console.error("RESTORE_BRAND_ERROR", error);
    return { success: false, error: "Failed to restore brand." };
  }
}

// ==========================================
// 6. FORCE DELETE (PERMANENT)
// ==========================================

export async function forceDeleteBrand(
  id: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const userId = await getDbUserId();
  if (!userId) return { success: false, error: "Unauthorized access." };

  const brand = await db.brand.findUnique({
    where: { id },
    select: { name: true, slug: true },
  });

  if (!brand) return { success: false, error: "Brand not found." };

  const productCount = await db.product.count({
    where: { brandId: id },
  });

  if (productCount > 0) {
    return {
      success: false,
      error: `Cannot permanently delete: ${productCount} product(s) still linked.`,
    };
  }

  try {
    await db.brand.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        userId,
        action: "BRAND_FORCE_DELETED",
        entityType: "Brand",
        entityId: id,
        details: {
          name: brand.name,
          slug: brand.slug,
          permanent: true,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/brands");
    return { success: true, message: "Brand permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_BRAND_ERROR", error);
    return { success: false, error: "Failed to permanently delete brand." };
  }
}
