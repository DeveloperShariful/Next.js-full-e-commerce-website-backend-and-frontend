// File Location: app/actions/order/create_order/search-resources.ts

"use server";

import { db } from "@/lib/prisma";

// Helper to safely convert Decimal to Number
const toNumber = (val: any) => {
    if (!val) return 0;
    // Check if it's a Prisma Decimal object
    if (typeof val === 'object' && 'toNumber' in val) {
        return val.toNumber();
    }
    return Number(val);
};

export async function searchProducts(query: string) {
  if (!query || query.length < 1) return [];

  try {
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 10,
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        sku: true,
        featuredImage: true,
        weight: true,
        length: true,
        width: true,
        height: true,
        variants: { 
            select: { 
                id: true, name: true, price: true, stock: true, sku: true,
                weight: true, length: true, width: true, height: true 
            }
        }
      }
    });

    // 🔥 Serialize Data (Convert Decimal to Number)
    const serializedProducts = products.map(prod => ({
        ...prod,
        price: toNumber(prod.price),
        weight: toNumber(prod.weight),
        length: toNumber(prod.length),
        width: toNumber(prod.width),
        height: toNumber(prod.height),
        variants: prod.variants.map(v => ({
            ...v,
            price: toNumber(v.price),
            weight: toNumber(v.weight),
            length: toNumber(v.length),
            width: toNumber(v.width),
            height: toNumber(v.height),
        }))
    }));

    return serializedProducts;

  } catch (error) {
    console.error("SEARCH_ERROR:", error);
    return [];
  }
}

export async function searchCustomers(query: string) {
  if (!query || query.length < 1) return [];

  try {
    const customers = await db.user.findMany({
        where: {
        OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } }
        ]
        },
        take: 5,
        select: {
        id: true, name: true, email: true, phone: true,
        addresses: { where: { isDefault: true }, take: 1 }
        }
    });
    return customers;
  } catch (error) {
      console.error("CUSTOMER_SEARCH_ERROR:", error);
      return [];
  }
}