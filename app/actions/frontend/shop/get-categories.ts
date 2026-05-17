// app/actions/storefront/shop/get-categories.ts
"use server";

import { db } from "@/lib/prisma";

export async function getShopCategories() {
  try {
    const categories = await db.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        // ম্যাজিক: ডাটাবেজ থেকেই প্রোডাক্ট কাউন্ট করে আনা হচ্ছে
        _count: {
          select: {
            products: {
              where: {
                status: "ACTIVE",
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        menuOrder: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("[getShopCategories] Error:", error);
    return [];
  }
}