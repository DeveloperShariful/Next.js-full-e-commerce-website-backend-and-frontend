// File: app/actions/storefront/shop/get-shop-products.ts

"use server";

import { db } from "@/lib/prisma";
import { ProductStatus, Prisma } from "@prisma/client";

interface ShopParams {
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
}

export async function getShopProducts(params: ShopParams) {
  const { category, sort, minPrice, maxPrice } = params;

  // --- FILTER LOGIC ---
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE, // Only Active Products
    ...(category ? { category: { name: category } } : {}),
    ...(minPrice || maxPrice ? {
      price: {
        gte: minPrice ? parseFloat(minPrice) : undefined,
        lte: maxPrice ? parseFloat(maxPrice) : undefined,
      }
    } : {}),
  };

  // --- SORT LOGIC ---
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  
  switch (sort) {
    case 'price_asc':
      orderBy = { price: 'asc' };
      break;
    case 'price_desc':
      orderBy = { price: 'desc' };
      break;
    case 'name_asc':
      orderBy = { name: 'asc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  try {
    const products = await db.product.findMany({
      where,
      include: {
        images: { take: 1, orderBy: { position: 'asc' } },
        category: true,
      },
      orderBy,
    });
    return products;
  } catch (error) {
    console.error("GET_SHOP_PRODUCTS_ERROR", error);
    return [];
  }
}