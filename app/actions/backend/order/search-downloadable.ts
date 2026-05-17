// File Location: app/actions/admin/order/search-downloadable.ts

"use server";

import { db } from "@/lib/prisma";

export async function searchDownloadableProducts(query: string) {
  try {
    if (!query || query.length < 2) return [];

    const products = await db.product.findMany({
      where: {
        isDownloadable: true,
        name: { contains: query, mode: "insensitive" }
      },
      select: {
        id: true,
        name: true,
      },
      take: 10
    });

    return products;
  } catch (error) {
    console.error("SEARCH_DOWNLOADABLE_ERROR", error);
    return [];
  }
}