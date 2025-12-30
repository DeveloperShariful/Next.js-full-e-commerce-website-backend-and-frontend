// File: app/actions/admin/categories/fetch.ts
"use server";

import { db } from "@/lib/prisma";
import { CategoryData } from "@/app/(admin)/admin/categories/types";

// --- GET ALL CATEGORIES (Excluding Soft Deleted) ---
export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      where: { deletedAt: null }, // Only fetch active categories
      include: {
        parent: { select: { name: true } },
        _count: { select: { products: true } }
      },
      orderBy: { menuOrder: 'asc' } // Sort by Menu Order defined in Schema
    });
    // Casting to unknown first to match the UI type loosely
    return { success: true, data: categories as unknown as CategoryData[] };
  } catch (error) {
    console.error("GET_CATEGORIES_ERROR", error);
    return { success: false, data: [] };
  }
}