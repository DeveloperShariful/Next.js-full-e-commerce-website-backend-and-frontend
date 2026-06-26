// File: app/actions/backend/header-sideber/global-search.ts

"use server";

import { db } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import { auth } from "@/auth";

export type SearchProduct  = { id: string; name: string; slug: string; featuredImage: string | null };
export type SearchOrder    = { id: string; orderNumber: string; total: number; status: string };
export type SearchCustomer = { id: string; name: string | null; email: string | null; image: string | null };
export type SearchCoupon   = { id: string; code: string; type: string; value: number };
export type SearchCategory = { id: string; name: string; slug: string };
export type SearchBrand    = { id: string; name: string; slug: string };
export type SearchTag      = { id: string; name: string; slug: string };

export type GlobalSearchResults = {
  products:   SearchProduct[];
  orders:     SearchOrder[];
  customers:  SearchCustomer[];
  coupons:    SearchCoupon[];
  categories: SearchCategory[];
  brands:     SearchBrand[];
  tags:       SearchTag[];
};

export async function getGlobalSearchResults(query: string): Promise<GlobalSearchResults> {
  const empty: GlobalSearchResults = {
    products: [], orders: [], customers: [],
    coupons: [], categories: [], brands: [], tags: [],
  };

  const session = await auth();
  if (!session?.user?.email) return empty;

  if (!query || query.length < 2) return empty;

  const term = query.trim();

  const [products, orders, customers, coupons, categories, brands, tags] = await Promise.all([
    // Products
    db.product.findMany({
      where: { name: { contains: term, mode: "insensitive" }, status: { not: ProductStatus.ARCHIVED } },
      take: 4,
      select: { id: true, name: true, slug: true, featuredImage: true },
    }),

    // Orders
    db.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: term, mode: "insensitive" } },
          { user: { name: { contains: term, mode: "insensitive" } } },
        ],
      },
      take: 4,
      select: { id: true, orderNumber: true, total: true, status: true },
    }),

    // Customers
    db.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, name: true, email: true, image: true },
    }),

    // Coupons
    db.discount.findMany({
      where: { code: { contains: term, mode: "insensitive" }, deletedAt: null },
      take: 4,
      select: { id: true, code: true, type: true, value: true },
    }),

    // Categories
    db.category.findMany({
      where: { name: { contains: term, mode: "insensitive" } },
      take: 4,
      select: { id: true, name: true, slug: true },
    }),

    // Brands
    db.brand.findMany({
      where: { name: { contains: term, mode: "insensitive" } },
      take: 4,
      select: { id: true, name: true, slug: true },
    }),

    // Tags
    db.tag.findMany({
      where: { name: { contains: term, mode: "insensitive" } },
      take: 4,
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return {
    products,
    orders: orders.map((o) => ({ ...o, total: Number(o.total) })),
    customers,
    coupons: coupons.map((c) => ({ ...c, value: Number(c.value) })),
    categories,
    brands,
    tags,
  };
}
