//File Location: app/actions/backend/analytics/products.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, SerializedAnalytics, serializeAnalyticsData } from "./shared.utils";

export interface ProductTableRow {
  id: string;
  name: string;
  sku: string | null;
  itemsSold: number;
  netSales: number;
  ordersCount: number; // We approximate orders per product
  categoryName: string;
  categoryId: string | null;
  variationsSold: number;
  status: string;
  stock: number | string;
}

export interface ProductsAnalyticsResponse {
  summary: {
    itemsSold: number;
    netSales: number;
    orders: number;
  };
  chartData: SerializedAnalytics[];
  previousChartData: SerializedAnalytics[];
  tableData: ProductTableRow[];
}

export async function getProductsAnalyticsData(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<ProductsAnalyticsResponse> {

  // ১. Chart & Summary Data (from global Analytics table)
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

  const summary = chartData.reduce(
    (acc, curr) => {
      acc.itemsSold += curr.productsSold;
      acc.netSales += curr.netSales;
      acc.orders += curr.totalOrders;
      return acc;
    },
    { itemsSold: 0, netSales: 0, orders: 0 }
  );

  // ২. Table Data (from ProductAnalytics grouped by Product)
  const productGroups = await db.productAnalytics.groupBy({
    by: ["productId"],
    where: {
      date: { gte: currentRange.from, lte: currentRange.to },
    },
    _sum: {
      itemsSold: true,
      netSales: true,
    },
    orderBy: {
      _sum: { itemsSold: "desc" },
    }
  });

  // ৩. Fetch additional product details (SKU, Stock, Status, Category)
  const tableData: ProductTableRow[] = await Promise.all(
    productGroups.map(async (group) => {
      const product = await db.product.findUnique({
        where: { id: group.productId },
        include: { categories: { take: 1 } }
      });

      return {
        id: group.productId,
        name: product?.name || "Unknown Product",
        sku: product?.sku || "N/A",
        itemsSold: group._sum.itemsSold || 0,
        netSales: Number(group._sum.netSales) || 0,
        // Since we don't track exact distinct orders per product directly in ProductAnalytics yet, 
        // we fallback to itemsSold or a separate query. For performance, we approximate or query OrderItem
        ordersCount: await db.orderItem.count({
            where: { 
                productId: group.productId,
                order: { orderDate: { gte: currentRange.from, lte: currentRange.to } }
            }
        }),
        categoryId: product?.categories?.[0]?.id || null,
        categoryName: product?.categories?.[0]?.name || "N/A",
        variationsSold: 0, // Simplified for now
        status: product?.status || "N/A",
        stock: product?.trackQuantity ? product?.stock : "N/A",
      };
    })
  );

  return {
    summary,
    chartData,
    previousChartData,
    tableData
  };
}