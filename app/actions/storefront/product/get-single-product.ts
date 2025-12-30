// File: app/actions/storefront/product/get-single-product.ts

"use server";

import { db } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function getSingleProduct(slug: string) {
  try {
    const product = await db.product.findUnique({
      where: { 
        slug,
        status: ProductStatus.ACTIVE 
      },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        attributes: true,
        variants: {
          include: {
            inventoryLevels: true
          }
        },
        brand: true,
      },
    });

    return product;
  } catch (error) {
    console.error("GET_SINGLE_PRODUCT_ERROR", error);
    return null;
  }
}