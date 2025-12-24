// File Location: app/actions/create_order/search-resources.ts

"use server";

import { db } from "@/lib/db";

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
        // ✅ NEW: Fetching Dimensions
        weight: true,
        length: true,
        width: true,
        height: true,
        variants: { 
            select: { 
                id: true, name: true, price: true, stock: true, sku: true,
                weight: true, length: true, width: true, height: true // Variants dimensions
            }
        }
      }
    });

    return products;

  } catch (error) {
    console.error("SEARCH_ERROR:", error);
    return [];
  }
}

// ... searchCustomers function remains same
export async function searchCustomers(query: string) {
  // ... (No change here)
  if (!query || query.length < 1) return [];

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
}