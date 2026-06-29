//File: app/actions/backend/analytics/leaderboards.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, SUCCESS_STATUSES } from "./shared.utils";

export interface TopProductData {
  id: string;
  name: string;
  itemsSold: number;
  netSales: number;
}

export interface TopCategoryData {
  id: string;
  name: string;
  itemsSold: number;
  netSales: number;
}

export interface TopChannelData {
  source: string;
  orders: number;
  netSales: number;
}

export interface LeaderboardsResponse {
  topProducts: TopProductData[];
  topCategories: TopCategoryData[];
  topChannels: TopChannelData[];
}

export async function getLeaderboardsData(
  currentRange: DateRange
): Promise<LeaderboardsResponse> {

  const [productGroups, categoryGroups, channelGroups] = await Promise.all([
    db.productAnalytics.groupBy({
      by: ["productId"],
      where: { date: { gte: currentRange.from, lte: currentRange.to } },
      _sum: { itemsSold: true, netSales: true },
      orderBy: { _sum: { itemsSold: "desc" } },
      take: 5,
    }),
    db.productAnalytics.groupBy({
      by: ["categoryId"],
      where: {
        date: { gte: currentRange.from, lte: currentRange.to },
        categoryId: { not: null },
      },
      _sum: { itemsSold: true, netSales: true },
      orderBy: { _sum: { itemsSold: "desc" } },
      take: 5,
    }),
    db.order.groupBy({
      by: ["utmSource"],
      where: {
        orderDate: { gte: currentRange.from, lte: currentRange.to },
        status: { in: SUCCESS_STATUSES },
      },
      _count: { id: true },
      _sum: { netAmount: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Fetch all product names in ONE query (N+1 fix)
  const productIds = productGroups.map((g) => g.productId);
  const categoryIds = categoryGroups
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    }),
    db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    }),
  ]);

  const productNameMap = new Map(products.map((p) => [p.id, p.name]));
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

  const topProducts: TopProductData[] = productGroups.map((group) => ({
    id: group.productId,
    name: productNameMap.get(group.productId) ?? "Unknown Product",
    itemsSold: group._sum.itemsSold ?? 0,
    netSales: Number(group._sum.netSales) ?? 0,
  }));

  const topCategories: TopCategoryData[] = categoryGroups
    .filter((g): g is typeof g & { categoryId: string } => g.categoryId !== null)
    .map((group) => ({
      id: group.categoryId,
      name: categoryNameMap.get(group.categoryId) ?? "Unknown Category",
      itemsSold: group._sum.itemsSold ?? 0,
      netSales: Number(group._sum.netSales) ?? 0,
    }));

  const topChannels: TopChannelData[] = channelGroups.map((group) => ({
    source: group.utmSource ?? "Organic / Direct",
    orders: group._count.id,
    netSales: Number(group._sum.netAmount) ?? 0,
  }));

  return { topProducts, topCategories, topChannels };
}
