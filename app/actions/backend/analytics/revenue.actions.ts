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
  };
  previousSummary: {
    grossSales: number;
    returns: number;
    coupons: number;
    netSales: number;
    taxes: number;
    shipping: number;
    totalSales: number;
  };
  chartData: SerializedAnalytics[];
  previousChartData: SerializedAnalytics[];
  tableData: RevenueTableRow[];
}

export async function getRevenueAnalyticsData(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<RevenueAnalyticsResponse> {

  // ১. Fetch Current Period Data
  const currentDataRaw = await db.analytics.findMany({
    where: { date: { gte: currentRange.from, lte: currentRange.to } },
    orderBy: { date: "desc" }, // Descending for the table (latest first)
  });

  // ২. Fetch Previous Period Data (For comparison)
  const previousDataRaw = await db.analytics.findMany({
    where: { date: { gte: previousRange.from, lte: previousRange.to } },
    orderBy: { date: "desc" },
  });

  const chartData = currentDataRaw.map(serializeAnalyticsData);
  const previousChartData = previousDataRaw.map(serializeAnalyticsData);

  // ৩. Calculate Current Summary
  const summary = chartData.reduce(
    (acc, curr) => {
      acc.grossSales += curr.grossSales;
      acc.returns += curr.totalRefunds;
      acc.coupons += curr.totalDiscounts;
      acc.netSales += curr.netSales;
      acc.taxes += curr.totalTax;
      acc.shipping += curr.totalShipping;
      acc.totalSales += curr.netSales + curr.totalTax + curr.totalShipping; // total = net + tax + shipping
      return acc;
    },
    { grossSales: 0, returns: 0, coupons: 0, netSales: 0, taxes: 0, shipping: 0, totalSales: 0 }
  );

  // ৪. Calculate Previous Summary
  const previousSummary = previousChartData.reduce(
    (acc, curr) => {
      acc.grossSales += curr.grossSales;
      acc.returns += curr.totalRefunds;
      acc.coupons += curr.totalDiscounts;
      acc.netSales += curr.netSales;
      acc.taxes += curr.totalTax;
      acc.shipping += curr.totalShipping;
      acc.totalSales += curr.netSales + curr.totalTax + curr.totalShipping;
      return acc;
    },
    { grossSales: 0, returns: 0, coupons: 0, netSales: 0, taxes: 0, shipping: 0, totalSales: 0 }
  );

  // ৫. Generate Table Data (Day by Day Breakdown)
  const tableData: RevenueTableRow[] = chartData.map(day => ({
    date: day.date,
    orders: day.totalOrders,
    grossSales: day.grossSales,
    returns: day.totalRefunds,
    coupons: day.totalDiscounts,
    netSales: day.netSales,
    taxes: day.totalTax,
    shipping: day.totalShipping,
    totalSales: day.netSales + day.totalTax + day.totalShipping
  }));

  return {
    summary,
    previousSummary,
    chartData: chartData.reverse(), // Reversing back to ASC for the chart
    previousChartData: previousChartData.reverse(),
    tableData
  };
}