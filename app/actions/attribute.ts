"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ==============================================================================
// 1. ZOD SCHEMAS (FIXED)
// ==============================================================================

// 1. Base Schema (শুধু ফিল্ডগুলো ডিফাইন করা হলো, কোনো refine নেই)
const BaseAttributeSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  slug: z.string().optional(),
  type: z.enum(["TEXT", "COLOR", "BUTTON"]).default("TEXT"),
  values: z.array(z.string()).min(1, { message: "At least one value is required" }),
});

// 2. Refinement Logic (কালার চেক করার লজিক আলাদা ফাংশনে রাখলাম)
const colorRefinement = (data: { type: string; values: string[] }) => {
  if (data.type === "COLOR") {
    // Check if values look like colors (Hex or Name)
    return data.values.every((v) => v.includes("#") || /^[a-zA-Z]+$/.test(v));
  }
  return true;
};

// 3. Create Schema (Base + Refine)
const AttributeSchema = BaseAttributeSchema.refine(colorRefinement, {
  message: "For Color type, values must be valid colors (e.g. #FF0000 or Red)",
  path: ["values"],
});

// 4. Update Schema (Base + ID + Refine)
// [FIXED] আমরা এখন Base স্কিমাকে extend করছি, refined স্কিমাকে নয়
const UpdateAttributeSchema = BaseAttributeSchema.extend({
  id: z.string().uuid(),
}).refine(colorRefinement, {
  message: "For Color type, values must be valid colors (e.g. #FF0000 or Red)",
  path: ["values"],
});

// ==============================================================================
// 2. TYPES
// ==============================================================================

export type AttributeState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// ==============================================================================
// 3. ACTIONS (Rest of the code remains same, just ensure schema usage is correct)
// ==============================================================================

export async function getAttributes(query: string = "", page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;
    const whereCondition = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [attributes, totalCount] = await Promise.all([
      db.attribute.findMany({
        where: whereCondition,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.attribute.count({ where: whereCondition }),
    ]);

    const usageCounts = await db.productAttribute.groupBy({
      by: ['name'],
      _count: { name: true },
      where: {
        name: { in: attributes.map(a => a.name) }
      }
    });

    const attributesWithUsage = attributes.map(attr => {
      const usage = usageCounts.find(u => u.name === attr.name);
      return { ...attr, count: usage?._count.name || 0 };
    });

    return {
      success: true,
      data: attributesWithUsage,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("GET_ATTRIBUTES_ERROR", error);
    return { success: false, message: "Failed to load attributes." };
  }
}

export async function createAttribute(prevState: any, formData: FormData): Promise<AttributeState> {
  try {
    const rawData = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: (formData.get("type") as "TEXT" | "COLOR" | "BUTTON") || "TEXT",
      values: (formData.get("values") as string)?.split(",").map(v => v.trim()).filter(Boolean) || [],
    };

    // Use AttributeSchema (Create)
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
    return { success: true, message: "Attribute created successfully!" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function updateAttribute(prevState: any, formData: FormData): Promise<AttributeState> {
  try {
    const rawData = {
      id: formData.get("id") as string,
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      type: (formData.get("type") as "TEXT" | "COLOR" | "BUTTON") || "TEXT",
      values: (formData.get("values") as string)?.split(",").map(v => v.trim()).filter(Boolean) || [],
    };

    // Use UpdateAttributeSchema (Update)
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
    console.error(error);
    return { success: false, message: "Update failed" };
  }
}

export async function deleteAttribute(id: string) {
  try {
    const attr = await db.attribute.findUnique({ where: { id } });
    if (!attr) return { success: false, message: "Not found" };

    const usage = await db.productAttribute.count({ where: { name: attr.name } });
    if (usage > 0) return { success: false, message: `Cannot delete. Used in ${usage} products.` };

    await db.attribute.delete({ where: { id } });
    revalidatePath("/admin/attributes");
    return { success: true, message: "Deleted successfully" };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Delete failed" };
  }
}