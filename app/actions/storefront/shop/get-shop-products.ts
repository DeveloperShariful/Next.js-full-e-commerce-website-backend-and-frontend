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

    // 🔥 FIX: Convert Prisma Decimal objects to plain Javascript Numbers
    // This solves the "Decimal objects are not supported" error
    const formattedProducts = products.map((product) => ({
      ...product,
      price: product.price.toNumber(),
      salePrice: product.salePrice ? product.salePrice.toNumber() : null,
      costPerItem: product.costPerItem ? product.costPerItem.toNumber() : null,
      weight: product.weight ? product.weight.toNumber() : null,
      length: product.length ? product.length.toNumber() : null,
      width: product.width ? product.width.toNumber() : null,
      height: product.height ? product.height.toNumber() : null,
      rating: product.rating ? product.rating.toNumber() : 0,
      affiliateCommissionRate: product.affiliateCommissionRate ? product.affiliateCommissionRate.toNumber() : null,
    }));

    return formattedProducts;

  } catch (error) {
    console.error("GET_SHOP_PRODUCTS_ERROR", error);
    return [];
  }
}