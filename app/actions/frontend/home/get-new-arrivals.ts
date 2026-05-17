// File: app/actions/storefront/home/get-new-arrivals.ts

"use server";

import { db } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function getNewArrivals() {
  try {
    const products = await db.product.findMany({
      where: { 
        status: ProductStatus.ACTIVE 
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        images: { take: 1, orderBy: { position: 'asc' } },
        category: true
      }
    });
    return products;
  } catch (error) {
    console.error("GET_NEW_ARRIVALS_ERROR", error);
    return [];
  }
}