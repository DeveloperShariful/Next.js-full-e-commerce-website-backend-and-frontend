"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role, Prisma, ProductStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role === Role.CUSTOMER || user.role === Role.SUBSCRIBER) {
    throw new Error("Unauthorized");
  }
  return user;
}

export interface WishlistReportRow {
  productId: string;
  count: number;
  name: string;
  slug: string;
  featuredImage: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  status: ProductStatus;
  productCode: number;
}

export async function getWishlistReport(page = 1, search = "") {
  await requireAdmin();
  const ITEMS_PER_PAGE = 20;

  const where: Prisma.WishlistWhereInput = search
    ? {
        product: {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { sku: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        },
      }
    : {};

  // Aggregate: how many times each product has been wishlisted.
  const grouped = await db.wishlist.groupBy({
    by: ["productId"],
    where,
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
  });

  const total = grouped.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const skip = (page - 1) * ITEMS_PER_PAGE;
  const pageGroups = grouped.slice(skip, skip + ITEMS_PER_PAGE);
  const pageProductIds = pageGroups.map((g) => g.productId);

  // Fetch product details for the current page only.
  const products = await db.product.findMany({
    where: { id: { in: pageProductIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      featuredImage: true,
      price: true,
      salePrice: true,
      stock: true,
      status: true,
      productCode: true,
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const rows: WishlistReportRow[] = pageGroups
    .map((g) => {
      const p = productMap.get(g.productId);
      if (!p) return null;
      return {
        productId: g.productId,
        count: g._count.productId,
        name: p.name,
        slug: p.slug,
        featuredImage: p.featuredImage,
        price: Number(p.price),
        salePrice: p.salePrice !== null ? Number(p.salePrice) : null,
        stock: p.stock,
        status: p.status,
        productCode: p.productCode,
      };
    })
    .filter((r): r is WishlistReportRow => r !== null);

  // Summary stats (over the whole filtered set, not just this page).
  const [totalEntries, distinctUsers] = await Promise.all([
    db.wishlist.count({ where }),
    db.wishlist.findMany({ where, distinct: ["userId"], select: { userId: true } }),
  ]);

  return {
    rows,
    total,
    totalPages,
    summary: {
      uniqueProducts: total,
      totalEntries,
      uniqueUsers: distinctUsers.length,
    },
  };
}
