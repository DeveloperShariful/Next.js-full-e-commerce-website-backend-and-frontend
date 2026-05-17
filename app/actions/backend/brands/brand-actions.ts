// File: app/actions/admin/brands/brand-actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. FETCH BRANDS (With Counts & Filters)
// ==========================================
export async function getBrands(filter: "active" | "trash" = "active") {
  try {
    // Get counts for WP style headers: All | Trash
    const [activeCount, trashCount] = await Promise.all([
      db.brand.count({ where: { deletedAt: null } }),
      db.brand.count({ where: { deletedAt: { not: null } } })
    ]);

    // Determine where clause based on filter
    const whereClause = filter === "trash" 
      ? { deletedAt: { not: null } } 
      : { deletedAt: null };

    const brands = await db.brand.findMany({
      where: whereClause,
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { createdAt: 'desc' } 
    });

    return { 
      success: true, 
      data: brands as any, 
      counts: {
        active: activeCount,
        trash: trashCount,
        all: activeCount
      }
    };
  } catch (error) {
    console.error("GET_BRANDS_ERROR", error);
    return { success: false, data: [], counts: { active: 0, trash: 0, all: 0 } };
  }
}

// ==========================================
// 2. CREATE BRAND
// ==========================================
export async function createBrand(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    if (!name) return { success: false, error: "Name is required" };

    // Slug Logic: User input or auto-generated
    let slug = formData.get("slug") as string;
    if (!slug || slug.trim() === "") {
      slug = name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else {
      slug = slug.toLowerCase().trim().replace(/ /g, '-');
    }
    
    // Duplicate check
    const existing = await db.brand.findFirst({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    await db.brand.create({
      data: {
        name,
        slug,
        description: (formData.get("description") as string) || null,
        website: (formData.get("website") as string) || null,
        countryOfOrigin: (formData.get("countryOfOrigin") as string) || null,
        logo: (formData.get("logo") as string) || null,
        metaTitle: (formData.get("metaTitle") as string) || null,
        metaDesc: (formData.get("metaDesc") as string) || null,
      }
    });

    revalidatePath("/admin/brands");
    return { success: true, message: "Brand created successfully." };
  } catch (error) {
    console.error("CREATE_BRAND_ERROR", error);
    return { success: false, error: "Failed to create brand." };
  }
}

// ==========================================
// 3. UPDATE BRAND
// ==========================================
export async function updateBrand(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "ID missing." };

    const name = formData.get("name") as string;
    let slug = formData.get("slug") as string;

    await db.brand.update({
      where: { id },
      data: {
        name,
        slug,
        description: (formData.get("description") as string) || null,
        website: (formData.get("website") as string) || null,
        countryOfOrigin: (formData.get("countryOfOrigin") as string) || null,
        logo: (formData.get("logo") as string) || null,
        metaTitle: (formData.get("metaTitle") as string) || null,
        metaDesc: (formData.get("metaDesc") as string) || null,
      }
    });

    revalidatePath("/admin/brands");
    return { success: true, message: "Brand updated successfully." };
  } catch (error: any) {
    console.error("UPDATE_BRAND_ERROR", error);
    if (error.code === 'P2002') {
      return { success: false, error: "This slug is already in use." };
    }
    return { success: false, error: "Failed to update brand." };
  }
}

// ==========================================
// 4. SOFT DELETE (MOVE TO TRASH)
// ==========================================
export async function deleteBrand(id: string) {
  try {
    // Check if brand is used in active products
    const productCount = await db.product.count({
      where: { brandId: id, deletedAt: null }
    });

    if (productCount > 0) {
      return { success: false, error: `Cannot delete: Brand is attached to ${productCount} active products.` };
    }

    // Soft delete
    await db.brand.update({
      where: { id },
      data: { deletedAt: new Date() }
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
export async function restoreBrand(id: string) {
  try {
    await db.brand.update({
      where: { id },
      data: { deletedAt: null }
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
export async function forceDeleteBrand(id: string) {
  try {
    await db.brand.delete({
      where: { id }
    });
    
    revalidatePath("/admin/brands");
    return { success: true, message: "Brand permanently deleted." };
  } catch (error) {
    console.error("FORCE_DELETE_BRAND_ERROR", error);
    return { success: false, error: "Failed to permanently delete brand." };
  }
}