// File: app/actions/admin/global-search.ts

"use server";

import { db } from "@/lib/db";
import { ProductStatus } from "@prisma/client"; // 🚀 1. Import Enum

export async function getGlobalSearchResults(query: string) {
  if (!query || query.length < 2) return { products: [], orders: [], customers: [] };

  const term = query.trim();

  // 1. Search Products
  const products = await db.product.findMany({
    where: { 
      name: { contains: term, mode: "insensitive" },
      // 🚀 2. FIX: Use Enum instead of string "archived"
      status: { not: ProductStatus.ARCHIVED } 
    },
    take: 3,
    select: { id: true, name: true, slug: true, featuredImage: true }
  });

  // 2. Search Orders (by Order Number or Customer Name)
  const orders = await db.order.findMany({
    where: {
      OR: [
        { orderNumber: { contains: term, mode: "insensitive" } },
        { user: { name: { contains: term, mode: "insensitive" } } }
      ]
    },
    take: 3,
    select: { id: true, orderNumber: true, total: true, status: true }
  });

  // 3. Search Customers (by Name or Email)
  const customers = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } }
      ]
    },
    take: 3,
    select: { id: true, name: true, email: true, image: true }
  });

  return { products, orders, customers };
}