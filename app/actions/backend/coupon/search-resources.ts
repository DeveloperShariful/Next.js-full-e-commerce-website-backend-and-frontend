// File Location: app/actions/admin/coupon/search-resources.ts

"use server";

import { db } from "@/lib/prisma";

// 1. Search Products (✅ FIXED: Added Image and Price)
export async function searchProductsForCoupon(query: string) {
  try {
    if (!query || query.length < 2) return [];

    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } }
        ]
      },
      // ✅ Fetching Image and Price from Prisma Schema
      select: { 
          id: true, 
          name: true, 
          sku: true, 
          featuredImage: true, 
          price: true 
      },
      take: 10
    });

    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || null,
      image: p.featuredImage || null,
      price: Number(p.price)
    }));
  } catch (error) {
    console.error("SEARCH_PRODUCTS_ERROR", error);
    return [];
  }
}

// 2. Search Categories
export async function searchCategoriesForCoupon(query: string) {
  try {
    if (!query || query.length < 2) return [];

    const categories = await db.category.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      select: { id: true, name: true },
      take: 10
    });

    return categories;
  } catch (error) {
    console.error("SEARCH_CATEGORIES_ERROR", error);
    return [];
  }
}

// 3. Search Affiliates
export async function searchAffiliatesForCoupon(query: string) {
  try {
    if (!query || query.length < 2) return [];

    const affiliates = await db.affiliateAccount.findMany({
      where: {
        OR: [
          { user: { name: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } }
        ]
      },
      include: { user: { select: { name: true, email: true } } },
      take: 10
    });

    return affiliates.map(a => ({
      id: a.id,
      name: `${a.user?.name || 'Unknown'} (${a.user?.email || 'No email'})`
    }));
  } catch (error) {
    console.error("SEARCH_AFFILIATES_ERROR", error);
    return [];
  }
}