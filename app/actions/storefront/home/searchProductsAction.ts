// app/actions/storefront/home/searchProductsAction.ts
"use server";

import { db } from "@/lib/prisma";

export async function searchProductsAction(searchTerm: string) {
  try {
    if (!searchTerm || searchTerm.length < 3) return [];

    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        name: {
          contains: searchTerm,
          mode: "insensitive", // ছোট-বড় হাতের অক্ষর যাই হোক না কেন, খুঁজে বের করবে
        },
      },
      take: 10, // সর্বোচ্চ ১০টি রেজাল্ট দেখাবে
      select: {
        id: true,
        slug: true,
        name: true,
        featuredImage: true,
      },
    });

    // UI কম্পোনেন্টের ইন্টারফেসের সাথে মেলানোর জন্য ডেটা ম্যাপ করা হলো
    return products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      image: p.featuredImage ? { sourceUrl: p.featuredImage } : undefined,
    }));
  } catch (error) {
    console.error("Search Action Error:", error);
    return [];
  }
}