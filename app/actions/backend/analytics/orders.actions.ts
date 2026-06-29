//File Location: app/actions/backend/analytics/orders.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, SerializedAnalytics, serializeAnalyticsData, SUCCESS_STATUSES } from "./shared.utils";

export interface OrderTableRow {
  id: string;
  orderDate: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerType: "New" | "Returning" | "Guest";
  productsInfo: { name: string; link: string }[];
  totalProducts: number;
  itemsSold: number;
  couponUsed: string | null;
  netSales: number;
  attribution: string;
}

export interface OrdersAnalyticsResponse {
  summary: {
    orders: number;
    netSales: number;
    averageOrderValue: number;
    averageItemsPerOrder: number;
  };
  previousSummary: {
    orders: number;
    netSales: number;
    averageOrderValue: number;
    averageItemsPerOrder: number;
  };
  chartData: SerializedAnalytics[];
  previousChartData: SerializedAnalytics[];
  tableData: OrderTableRow[];
}

export async function getOrdersAnalyticsData(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<OrdersAnalyticsResponse> {

  // ১. Chart Data & Summaries from Analytics lookup table
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
    let orders = 0, netSales = 0, itemsSold = 0;
    data.forEach(d => {
      orders += d.totalOrders;
      netSales += d.netSales;
      itemsSold += d.productsSold;
    });
    return {
      orders,
      netSales,
      averageOrderValue: orders > 0 ? netSales / orders : 0,
      averageItemsPerOrder: orders > 0 ? Math.round((itemsSold / orders) * 10) / 10 : 0
    };
  };

  const summary = buildSummary(chartData);
  const previousSummary = buildSummary(previousChartData);

  // ২. Table Data from actual Order table (only Success orders for Analytics)
  const ordersRaw = await db.order.findMany({
    where: {
      orderDate: { gte: currentRange.from, lte: currentRange.to },
      status: { in: SUCCESS_STATUSES },
    },
    include: {
      user: { select: { name: true } },
      items: { select: { quantity: true, productName: true, productId: true } },
    },
    orderBy: { orderDate: "desc" },
    take: 200,
  });

  const tableData: OrderTableRow[] = ordersRaw.map((order) => {
    const billing = order.billingAddress as Record<string, string> | null;
    const customerName = order.user?.name || billing?.firstName || "Guest";
    const customerType = order.user ? (order.isFirstOrder ? "New" : "Returning") : "Guest";
    const itemsSold = order.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalProducts = order.items.length;

    return {
      id: order.id,
      orderDate: order.orderDate.toISOString(),
      orderNumber: order.orderNumber,
      status: order.status,
      customerName,
      customerType,
      productsInfo: order.items.slice(0, 2).map((i) => ({
        name: i.productName,
        link: i.productId ? `/admin/products/${i.productId}` : "#",
      })),
      totalProducts,
      itemsSold,
      couponUsed: order.couponCode || null,
      netSales: Number(order.netAmount) || 0,
      attribution: order.utmSource ? `Campaign: ${order.utmSource}` : "Organic",
    };
  });

  return {
    summary,
    previousSummary,
    chartData,
    previousChartData,
    tableData
  };
}