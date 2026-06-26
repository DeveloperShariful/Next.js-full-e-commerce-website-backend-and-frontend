//app/actions/admin/attribute/attribute.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export type AttributeState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export type AttributeWithUsage = Prisma.AttributeGetPayload<object> & { count: number };

const BaseAttributeSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  slug: z.string().optional(),
  type: z.enum(["TEXT", "COLOR", "BUTTON"]).default("TEXT"),
  values: z.array(z.string()).min(1, { message: "At least one value is required" }),
});

const colorRefinement = (data: { type: string; values: string[] }) => {
  if (data.type === "COLOR") {
    return data.values.every((v) => v.includes("#") || /^[a-zA-Z]+$/.test(v));
  }
  return true;
};

const AttributeSchema = BaseAttributeSchema.refine(colorRefinement, {
  message: "For Color type, values must be valid colors (e.g. #FF0000 or Red)",
  path: ["values"],
});

const UpdateAttributeSchema = BaseAttributeSchema.extend({
  id: z.string().uuid(),
}).refine(colorRefinement, {
  message: "For Color type, values must be valid colors (e.g. #FF0000 or Red)",
  path: ["values"],
});

async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const dbUser = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!dbUser) return null;
  const allowed = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;
  if (!(allowed as readonly string[]).includes(dbUser.role)) return null;
  return dbUser;
}

// ==========================================
// 1. FETCH ATTRIBUTES (With WP Filters)
// ==========================================
export async function getAttributes(filter: "active" | "trash" = "active", query: string = "") {
  try {
    const [activeCount, trashCount] = await Promise.all([
      db.attribute.count({ where: { deletedAt: null } }),
      db.attribute.count({ where: { deletedAt: { not: null } } })
    ]);

    const baseWhere = filter === "trash" ? { deletedAt: { not: null } } : { deletedAt: null };

    const whereCondition: Prisma.AttributeWhereInput = query
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        }
      : baseWhere;

    const attributes = await db.attribute.findMany({
      where: whereCondition,
      orderBy: { updatedAt: "desc" },
    });

    const usageCounts = await db.productAttribute.groupBy({
      by: ["name"],
      _count: { name: true },
      where: { name: { in: attributes.map(a => a.name) } }
    });

    const attributesWithUsage: AttributeWithUsage[] = attributes.map(attr => {
      const usage = usageCounts.find(u => u.name === attr.name);
      return { ...attr, count: usage?._count.name || 0 };
    });

    return {
      success: true,
      data: attributesWithUsage,
      counts: { active: activeCount, trash: trashCount, all: activeCount + trashCount },
    };
  } catch (error) {
    console.error("GET_ATTRIBUTES_ERROR", error);
    return { success: false, data: [] as AttributeWithUsage[], counts: { active: 0, trash: 0, all: 0 } };
  }
}

// ==========================================
// 2. CREATE ATTRIBUTE
// ==========================================
export async function createAttribute(formData: FormData): Promise<AttributeState> {
  const user = await getAuthUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: (formData.get("type") as "TEXT" | "COLOR" | "BUTTON") || "TEXT",
      values: (formData.get("values") as string)?.split(",").map(v => v.trim()).filter(Boolean) || [],
    };

    const validated = AttributeSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, message: "Invalid data", errors: validated.error.flatten().fieldErrors };
    }

    const { name, slug, type, values } = validated.data;

    let finalSlug = slug
      ? slug.toLowerCase().trim().replace(/\s+/g, "-")
      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const exists = await db.attribute.findFirst({
      where: { OR: [{ slug: finalSlug }, { name: { equals: name, mode: "insensitive" } }] }
    });

    if (exists) return { success: false, message: "Attribute already exists." };

    const attr = await db.attribute.create({
      data: { name, slug: finalSlug, type, values }
    });

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "ATTRIBUTE_CREATED",
        entityType: "Attribute",
        entityId: attr.id,
        details: { name, slug: finalSlug, type, valuesCount: values.length } as unknown as Prisma.InputJsonValue,
      }
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute created successfully." };
  } catch (error) {
    console.error("CREATE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Internal Server Error" };
  }
}

// ==========================================
// 3. UPDATE ATTRIBUTE
// ==========================================
export async function updateAttribute(formData: FormData): Promise<AttributeState> {
  const user = await getAuthUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    const rawData = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: (formData.get("type") as "TEXT" | "COLOR" | "BUTTON") || "TEXT",
      values: (formData.get("values") as string)?.split(",").map(v => v.trim()).filter(Boolean) || [],
    };

    const validated = UpdateAttributeSchema.safeParse(rawData);
    if (!validated.success) return { success: false, errors: validated.error.flatten().fieldErrors };

    const { id, name, slug, type, values } = validated.data;

    const existing = await db.attribute.findUnique({ where: { id } });
    if (!existing) return { success: false, message: "Not found" };

    let finalSlug = slug
      ? slug.toLowerCase().trim().replace(/\s+/g, "-")
      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const duplicate = await db.attribute.findFirst({
      where: { slug: finalSlug, NOT: { id } }
    });

    if (duplicate) return { success: false, message: "Slug already in use" };

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (existing.name !== name) changes.name = { from: existing.name, to: name };
    if (existing.slug !== finalSlug) changes.slug = { from: existing.slug, to: finalSlug };
    if (existing.type !== type) changes.type = { from: existing.type, to: type };
    if (JSON.stringify(existing.values) !== JSON.stringify(values)) changes.values = { from: existing.values, to: values };

    await db.attribute.update({
      where: { id },
      data: { name, slug: finalSlug, type, values }
    });

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "ATTRIBUTE_UPDATED",
        entityType: "Attribute",
        entityId: id,
        details: { changes, attributeName: name } as unknown as Prisma.InputJsonValue,
      }
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Updated successfully" };
  } catch (error) {
    console.error("UPDATE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Update failed" };
  }
}

// ==========================================
// 4. SOFT DELETE (TRASH)
// ==========================================
export async function deleteAttribute(id: string) {
  const user = await getAuthUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    const attr = await db.attribute.findUnique({ where: { id } });
    if (!attr) return { success: false, message: "Not found" };

    const usage = await db.productAttribute.count({ where: { name: attr.name } });
    if (usage > 0) return { success: false, message: `Cannot delete. Used in ${usage} products.` };

    await db.attribute.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "ATTRIBUTE_SOFT_DELETED",
        entityType: "Attribute",
        entityId: id,
        details: { attributeName: attr.name } as unknown as Prisma.InputJsonValue,
      }
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute moved to trash." };
  } catch (error) {
    console.error("DELETE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Delete failed" };
  }
}

// ==========================================
// 5. RESTORE
// ==========================================
export async function restoreAttribute(id: string) {
  const user = await getAuthUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    const attr = await db.attribute.findUnique({ where: { id } });
    if (!attr) return { success: false, message: "Not found" };

    await db.attribute.update({
      where: { id },
      data: { deletedAt: null }
    });

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "ATTRIBUTE_RESTORED",
        entityType: "Attribute",
        entityId: id,
        details: { attributeName: attr.name } as unknown as Prisma.InputJsonValue,
      }
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute restored." };
  } catch (error) {
    console.error("RESTORE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Failed to restore." };
  }
}

// ==========================================
// 6. FORCE DELETE
// ==========================================
export async function forceDeleteAttribute(id: string) {
  const user = await getAuthUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    const attr = await db.attribute.findUnique({ where: { id } });
    if (!attr) return { success: false, message: "Not found" };

    await db.attribute.delete({ where: { id } });

    await db.activityLog.create({
      data: {
        userId: user.id,
        action: "ATTRIBUTE_FORCE_DELETED",
        entityType: "Attribute",
        entityId: id,
        details: { attributeName: attr.name } as unknown as Prisma.InputJsonValue,
      }
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_ATTRIBUTE_ERROR", error);
    return { success: false, message: "Failed to permanently delete." };
  }
}
