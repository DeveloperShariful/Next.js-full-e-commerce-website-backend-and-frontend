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

  // ১. Fetch Chart Data & Summaries from Analytics lookup table
  const currentDataRaw = await db.analytics.findMany({
    where: { date: { gte: currentRange.from, lte: currentRange.to } },
    orderBy: { date: "asc" },
  });

  const previousDataRaw = await db.analytics.findMany({
    where: { date: { gte: previousRange.from, lte: previousRange.to } },
    orderBy: { date: "asc" },
  });

  const chartData = currentDataRaw.map(serializeAnalyticsData);
  const previousChartData = previousDataRaw.map(serializeAnalyticsData);

  const buildSummary = (data: SerializedAnalytics[]) => {
    return data.reduce(
      (acc, curr) => {
        acc.itemsSold += curr.productsSold;
        acc.netSales += curr.netSales;
        acc.orders += curr.totalOrders;
        return acc;
      },
      { itemsSold: 0, netSales: 0, orders: 0 }
    );
  };

  const summary = buildSummary(chartData);
  const previousSummary = buildSummary(previousChartData);

  // ২. Table Data from ProductAnalytics grouped by Category
  const categoryGroups = await db.productAnalytics.groupBy({
    by: ["categoryId"],
    where: {
      date: { gte: currentRange.from, lte: currentRange.to },
      categoryId: { not: null }, // Null ক্যাটাগরি ইগনোর করা
    },
    _sum: {
      itemsSold: true,
      netSales: true,
    },
    orderBy: {
      _sum: { itemsSold: "desc" },
    }
  });

  // ৩. Fetch additional Category details (Name, Products count, Orders count)
  const tableData: CategoryTableRow[] = await Promise.all(
    categoryGroups.map(async (group) => {
      if (!group.categoryId) return null;

      const category = await db.category.findUnique({
        where: { id: group.categoryId },
        select: { name: true, _count: { select: { products: true } } }
      });

      // Approximate Orders Count per Category
      const ordersCount = await db.orderItem.count({
        where: {
          product: { categories: { some: { id: group.categoryId } } },
          order: { orderDate: { gte: currentRange.from, lte: currentRange.to } }
        }
      });

      return {
        id: group.categoryId,
        name: category?.name || "Unknown Category",
        itemsSold: group._sum.itemsSold || 0,
        netSales: Number(group._sum.netSales) || 0,
        productsCount: category?._count.products || 0,
        ordersCount: ordersCount,
      };
    })
  ).then(res => res.filter((item): item is CategoryTableRow => item !== null));

  return {
    summary,
    previousSummary,
    chartData,
    previousChartData,
    tableData
  };
}