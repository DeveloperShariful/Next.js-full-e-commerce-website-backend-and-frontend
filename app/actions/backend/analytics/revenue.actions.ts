//File Location: app/actions/backend/analytics/revenue.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, SerializedAnalytics, serializeAnalyticsData } from "./shared.utils";

export interface RevenueTableRow {
  date: string;
  orders: number;
  grossSales: number;
  returns: number;
  coupons: number;
  netSales: number;
  taxes: number;
  shipping: number;
  totalSales: number;
}

export interface RevenueAnalyticsResponse {
  summary: {
    grossSales: number;
    returns: number;
    coupons: number;
    netSales: number;
    taxes: number;
    shipping: number;
    totalSales: number;
    cartAbandonmentRate: number;
    refundRate: number;
    repeatPurchaseRate: number;
  };
  previousSummary: {
    grossSales: number;
    returns: number;
    coupons: number;
    netSales: number;
    taxes: number;
    shipping: number;
    totalSales: number;
    cartAbandonmentRate: number;
    refundRate: number;
    repeatPurchaseRate: number;
  };
  chartData: SerializedAnalytics[];
  previousChartData: SerializedAnalytics[];
  tableData: RevenueTableRow[];
}

function buildSummary(data: SerializedAnalytics[]) {
  const base = data.reduce(
    (acc, curr) => {
      acc.grossSales += curr.grossSales;
      acc.returns += curr.totalRefunds;
      acc.coupons += curr.totalDiscounts;
      acc.netSales += curr.netSales;
      acc.taxes += curr.totalTax;
      acc.shipping += curr.totalShipping;
      acc.totalSales += curr.netSales + curr.totalTax + curr.totalShipping;
      acc.totalOrders += curr.totalOrders;
      acc.abandonedCheckouts += curr.abandonedCheckouts;
      acc.newCustomers += curr.newCustomers;
      acc.returningCustomers += curr.returningCustomers;
      return acc;
    },
    {
      grossSales: 0, returns: 0, coupons: 0, netSales: 0,
      taxes: 0, shipping: 0, totalSales: 0,
      totalOrders: 0, abandonedCheckouts: 0,
      newCustomers: 0, returningCustomers: 0,
    }
  );

  const totalAttempts = base.abandonedCheckouts + base.totalOrders;
  const totalCustomers = base.newCustomers + base.returningCustomers;

  return {
    grossSales: base.grossSales,
    returns: base.returns,
    coupons: base.coupons,
    netSales: base.netSales,
    taxes: base.taxes,
    shipping: base.shipping,
    totalSales: base.totalSales,
    cartAbandonmentRate: totalAttempts > 0
      ? parseFloat(((base.abandonedCheckouts / totalAttempts) * 100).toFixed(1))
      : 0,
    refundRate: base.totalOrders > 0
      ? parseFloat(((base.returns / base.totalOrders) * 100).toFixed(1))
      : 0,
    repeatPurchaseRate: totalCustomers > 0
      ? parseFloat(((base.returningCustomers / totalCustomers) * 100).toFixed(1))
      : 0,
  };
}

export async function getRevenueAnalyticsData(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<RevenueAnalyticsResponse> {

  const [currentDataRaw, previousDataRaw] = await Promise.all([
    db.analytics.findMany({
      where: { date: { gte: currentRange.from, lte: currentRange.to } },
      orderBy: { date: "desc" },
    }),
    db.analytics.findMany({
      where: { date: { gte: previousRange.from, lte: previousRange.to } },
      orderBy: { date: "desc" },
    }),
  ]);

  const chartDataDesc = currentDataRaw.map(serializeAnalyticsData);
  const previousChartDataDesc = previousDataRaw.map(serializeAnalyticsData);

  const summary = buildSummary(chartDataDesc);
  const previousSummary = buildSummary(previousChartDataDesc);

  const tableData: RevenueTableRow[] = chartDataDesc.map((day) => ({
    date: day.date,
    orders: day.totalOrders,
    grossSales: day.grossSales,
    returns: day.totalRefunds,
    coupons: day.totalDiscounts,
    netSales: day.netSales,
    taxes: day.totalTax,
    shipping: day.totalShipping,
    totalSales: day.netSales + day.totalTax + day.totalShipping,
  }));

  return {
    summary,
    previousSummary,
    // Spread into new arrays so we don't mutate the sorted originals
    chartData: [...chartDataDesc].reverse(),
    previousChartData: [...previousChartDataDesc].reverse(),
    tableData,
  };
}
