//app/actions/admin/attribute/attribute.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type AttributeState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

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
    
    const whereCondition = query
      ? {
          ...baseWhere,
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : baseWhere;

    const attributes = await db.attribute.findMany({
      where: whereCondition,
      orderBy: { updatedAt: "desc" },
    });

    const usageCounts = await db.productAttribute.groupBy({
      by: ['name'],
      _count: { name: true },
      where: { name: { in: attributes.map(a => a.name) } }
    });

    const attributesWithUsage = attributes.map(attr => {
      const usage = usageCounts.find(u => u.name === attr.name);
      return { ...attr, count: usage?._count.name || 0 };
    });

    return {
      success: true,
      data: attributesWithUsage,
      counts: { active: activeCount, trash: trashCount, all: activeCount }
    };
  } catch (error) {
    console.error("GET_ATTRIBUTES_ERROR", error);
    return { success: false, data: [], counts: { active: 0, trash: 0, all: 0 } };
  }
}

// ==========================================
// 2. CREATE ATTRIBUTE
// ==========================================
export async function createAttribute(formData: FormData): Promise<AttributeState> {
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

    await db.attribute.create({
      data: { name, slug: finalSlug, type, values }
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute created successfully." };
  } catch (error) {
    return { success: false, message: "Internal Server Error" };
  }
}

// ==========================================
// 3. UPDATE ATTRIBUTE
// ==========================================
export async function updateAttribute(formData: FormData): Promise<AttributeState> {
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

    await db.attribute.update({
      where: { id },
      data: { name, slug: finalSlug, type, values }
    });

    revalidatePath("/admin/attributes");
    return { success: true, message: "Updated successfully" };
  } catch (error) {
    return { success: false, message: "Update failed" };
  }
}

// ==========================================
// 4. SOFT DELETE (TRASH)
// ==========================================
export async function deleteAttribute(id: string) {
  try {
    const attr = await db.attribute.findUnique({ where: { id } });
    if (!attr) return { success: false, message: "Not found" };

    const usage = await db.productAttribute.count({ where: { name: attr.name } });
    if (usage > 0) return { success: false, message: `Cannot delete. Used in ${usage} products.` };

    // 🚀 Update deletedAt instead of hard delete
    await db.attribute.update({ 
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute moved to trash." };
  } catch (error) {
    return { success: false, message: "Delete failed" };
  }
}

// ==========================================
// 5. RESTORE
// ==========================================
export async function restoreAttribute(id: string) {
  try {
    await db.attribute.update({
      where: { id },
      data: { deletedAt: null }
    });
    revalidatePath("/admin/attributes");
    return { success: true, message: "Attribute restored." };
  } catch (error) {
    return { success: false, message: "Failed to restore." };
  }
}

// ==========================================
// 6. FORCE DELETE
// ==========================================
export async function forceDeleteAttribute(id: string) {
  try {
    await db.attribute.delete({ where: { id } });
    revalidatePath("/admin/attributes");
    return { success: true, message: "Permanently deleted." };
  } catch (error) {
    return { success: false, message: "Failed to permanently delete." };
  }
}