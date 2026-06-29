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
  ordersCount: number;
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

  const [currentDataRaw, previousDataRaw, productGroups] = await Promise.all([
    db.analytics.findMany({
      where: { date: { gte: currentRange.from, lte: currentRange.to } },
      orderBy: { date: "asc" },
    }),
    db.analytics.findMany({
      where: { date: { gte: previousRange.from, lte: previousRange.to } },
      orderBy: { date: "asc" },
    }),
    db.productAnalytics.groupBy({
      by: ["productId"],
      where: { date: { gte: currentRange.from, lte: currentRange.to } },
      _sum: { itemsSold: true, netSales: true },
      orderBy: { _sum: { itemsSold: "desc" } },
    }),
  ]);

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

  // Fetch all product details in ONE query (N+1 fix)
  const productIds = productGroups.map((g) => g.productId);

  const [products, orderCountGroups] = await Promise.all([
    db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        stock: true,
        trackQuantity: true,
        categories: { select: { id: true, name: true }, take: 1 },
      },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        order: { orderDate: { gte: currentRange.from, lte: currentRange.to } },
      },
      _count: { id: true },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderCountMap = new Map(
    orderCountGroups
      .filter((g): g is typeof g & { productId: string } => g.productId !== null)
      .map((g) => [g.productId, g._count.id])
  );

  const tableData: ProductTableRow[] = productGroups.map((group) => {
    const product = productMap.get(group.productId);
    return {
      id: group.productId,
      name: product?.name ?? "Unknown Product",
      sku: product?.sku ?? null,
      itemsSold: group._sum.itemsSold ?? 0,
      netSales: Number(group._sum.netSales) ?? 0,
      ordersCount: orderCountMap.get(group.productId) ?? 0,
      categoryId: product?.categories?.[0]?.id ?? null,
      categoryName: product?.categories?.[0]?.name ?? "N/A",
      variationsSold: 0,
      status: product?.status ?? "N/A",
      stock: product?.trackQuantity ? (product?.stock ?? 0) : "N/A",
    };
  });

  return {
    summary,
    chartData,
    previousChartData,
    tableData,
  };
}
