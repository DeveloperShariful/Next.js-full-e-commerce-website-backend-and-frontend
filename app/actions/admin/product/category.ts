// app/actions/admin/product/category.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

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

// --- Zod Schema ---
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  isActive: z.coerce.boolean().default(true), // coerce handles "true"/"false" strings
});

// --- Helper: Generate Unique Slug ---
async function generateUniqueSlug(name: string, requestedSlug?: string, ignoreId?: string) {
  let slug = requestedSlug && requestedSlug.trim() !== "" 
    ? requestedSlug 
    : name;

  slug = slug.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, '-') // Replace spaces with -
    .replace(/^-+|-+$/g, ''); // Trim -

  // Check collision
  const existing = await db.category.findFirst({
    where: { 
      slug, 
      ...(ignoreId ? { id: { not: ignoreId } } : {}) 
    }
  });

  if (existing) {
    slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
  }
  return slug;
}

// --- 1. CREATE CATEGORY ---
export async function createCategory(formData: FormData) {
  try {
    // 1. Parse Data with Zod
    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      parentId: formData.get("parentId") === "none" ? null : formData.get("parentId"),
      image: formData.get("image"),
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
    await db.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        image: data.image || null,
        parentId: data.parentId || null,
        metaTitle: data.metaTitle || null,
        metaDesc: data.metaDesc || null,
        isActive: data.isActive
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
    if (!id) return { success: false, error: "Category ID missing." };

    // 1. Parse Data
    const rawData = {
      name: formData.get("name"),
      description: formData.get("description"),
      parentId: formData.get("parentId") === "none" ? null : formData.get("parentId"),
      image: formData.get("image"),
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

    // 3. Generate Slug (ignoring current ID for collision check)
    let slug = undefined;
    if (data.slug || data.name) {
       slug = await generateUniqueSlug(data.name, data.slug, id);
    }

    // 4. Update DB
    await db.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: slug, // Only update if re-generated
        description: data.description || null,
        image: data.image || null,
        parentId: data.parentId || null,
        metaTitle: data.metaTitle || null,
        metaDesc: data.metaDesc || null,
        isActive: data.isActive
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
    // Check constraints
    const productCount = await db.product.count({ where: { categoryId: id } });
    if (productCount > 0) return { success: false, error: `Contains ${productCount} products.` };

    const childCount = await db.category.count({ where: { parentId: id } });
    if (childCount > 0) return { success: false, error: "Has sub-categories." };

    await db.category.delete({ where: { id } });
    
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