// File: app/actions/storefront/shop/get-categories.ts

"use server";

import { db } from "@/lib/db";

export async function getShopCategories() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return categories;
  } catch (error) {
    console.error("GET_SHOP_CATEGORIES_ERROR", error);
    return [];
  }
}