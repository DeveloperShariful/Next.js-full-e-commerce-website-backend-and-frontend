// File: app/actions/storefront/product/get-single-related-product.ts

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
        // ✅ FIX 1: Changed 'category' to 'categories' due to Many-to-Many relation
        categories: true, 
        images: { orderBy: { position: 'asc' } },
        attributes: true,
        variants: {
          where: { deletedAt: null }, 
          include: {
            inventoryLevels: true
          },
          orderBy: { price: 'asc' }
        },
        brand: true, 
        subscriptionPlans: {
            where: { isActive: true },
            orderBy: { price: 'asc' }
        },
        downloadFiles: true, 
      },
    });

    return product;
  } catch (error) {
    console.error("GET_SINGLE_PRODUCT_ERROR", error);
    return null;
  }
}

// ... getRelatedProducts
export async function getRelatedProducts(categoryId: string | null, currentProductId: string) {
    if (!categoryId) return [];

    try {
      const products = await db.product.findMany({
        where: {
          // ✅ FIX 2: Updated from 'categoryId' to 'categories: { some: ... }'
          categories: {
            some: {
              id: categoryId
            }
          },
          id: { not: currentProductId },
          status: ProductStatus.ACTIVE,
        },
        take: 4,
        include: {
          images: { take: 1, orderBy: { position: 'asc' } },
          // ✅ FIX 3: Changed 'category' to 'categories'
          categories: true, 
        },
        orderBy: { createdAt: 'desc' }
      });
  
      return products;
    } catch (error) {
      return [];
    }
}