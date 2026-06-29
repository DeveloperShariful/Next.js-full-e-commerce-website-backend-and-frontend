//File Location: app/actions/backend/analytics/categories.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, SerializedAnalytics, serializeAnalyticsData } from "./shared.utils";

export interface CategoryTableRow {
  id: string;
  name: string;
  itemsSold: number;
  netSales: number;
  productsCount: number;
  ordersCount: number;
}

export interface CategoriesAnalyticsResponse {
  summary: {
    itemsSold: number;
    netSales: number;
    orders: number;
  };
  previousSummary: {
    itemsSold: number;
    netSales: number;
    orders: number;
  };
  chartData: SerializedAnalytics[];
  previousChartData: SerializedAnalytics[];
  tableData: CategoryTableRow[];
}

export async function getCategoriesAnalyticsData(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<CategoriesAnalyticsResponse> {

  const [currentDataRaw, previousDataRaw, categoryGroups] = await Promise.all([
    db.analytics.findMany({
      where: { date: { gte: currentRange.from, lte: currentRange.to } },
      orderBy: { date: "asc" },
    }),
    db.analytics.findMany({
      where: { date: { gte: previousRange.from, lte: previousRange.to } },
      orderBy: { date: "asc" },
    }),
    db.productAnalytics.groupBy({
      by: ["categoryId"],
      where: {
        date: { gte: currentRange.from, lte: currentRange.to },
        categoryId: { not: null },
      },
      _sum: { itemsSold: true, netSales: true },
      orderBy: { _sum: { itemsSold: "desc" } },
    }),
  ]);

  const chartData = currentDataRaw.map(serializeAnalyticsData);
  const previousChartData = previousDataRaw.map(serializeAnalyticsData);

  const buildSummary = (data: SerializedAnalytics[]) =>
    data.reduce(
      (acc, curr) => {
        acc.itemsSold += curr.productsSold;
        acc.netSales += curr.netSales;
        acc.orders += curr.totalOrders;
        return acc;
      },
      { itemsSold: 0, netSales: 0, orders: 0 }
    );

  const summary = buildSummary(chartData);
  const previousSummary = buildSummary(previousChartData);

  // Fetch all category details in ONE query (N+1 fix)
  const categoryIds = categoryGroups
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);

  const [categories, orderCountGroups] = await Promise.all([
    db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, _count: { select: { products: true } } },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: {
        product: { categories: { some: { id: { in: categoryIds } } } },
        order: { orderDate: { gte: currentRange.from, lte: currentRange.to } },
      },
      _count: { id: true },
    }),
  ]);

  // Build a category → product set from ProductAnalytics categoryId field
  // (orderCountGroups gives us item-level counts per productId, not per categoryId)
  // We use the productAnalytics categoryId to link back
  const productAnalyticsRows = await db.productAnalytics.findMany({
    where: {
      date: { gte: currentRange.from, lte: currentRange.to },
      categoryId: { in: categoryIds },
    },
    select: { productId: true, categoryId: true },
    distinct: ["productId", "categoryId"],
  });

  const productToCategory = new Map<string, string>();
  productAnalyticsRows.forEach((r) => {
    if (r.productId && r.categoryId) productToCategory.set(r.productId, r.categoryId);
  });

  const categoryOrderCount = new Map<string, number>();
  orderCountGroups.forEach((g) => {
    if (!g.productId) return;
    const catId = productToCategory.get(g.productId);
    if (!catId) return;
    categoryOrderCount.set(catId, (categoryOrderCount.get(catId) ?? 0) + g._count.id);
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const tableData: CategoryTableRow[] = categoryGroups
    .filter((g): g is typeof g & { categoryId: string } => g.categoryId !== null)
    .map((group) => {
      const category = categoryMap.get(group.categoryId);
      return {
        id: group.categoryId,
        name: category?.name ?? "Unknown Category",
        itemsSold: group._sum.itemsSold ?? 0,
        netSales: Number(group._sum.netSales) ?? 0,
        productsCount: category?._count.products ?? 0,
        ordersCount: categoryOrderCount.get(group.categoryId) ?? 0,
      };
    });

  return {
    summary,
    previousSummary,
    chartData,
    previousChartData,
    tableData,
  };
}
