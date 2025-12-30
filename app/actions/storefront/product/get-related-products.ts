// File: app/actions/storefront/product/get-related-products.ts

"use server";

import { db } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function getRelatedProducts(categoryId: string | null, currentProductId: string) {
  if (!categoryId) return [];

  try {
    const products = await db.product.findMany({
      where: {
        categoryId: categoryId,
        id: { not: currentProductId },
        status: ProductStatus.ACTIVE,
      },
      take: 4,
      include: {
        images: { take: 1, orderBy: { position: 'asc' } },
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return products;
  } catch (error) {
    console.error("GET_RELATED_PRODUCTS_ERROR", error);
    return [];
  }
}