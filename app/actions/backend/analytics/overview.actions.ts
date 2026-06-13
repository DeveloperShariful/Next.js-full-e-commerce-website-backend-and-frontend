//File: app/actions/backend/analytics/overview.actions.ts

"use server";

import { db } from "@/lib/prisma"; // আপনার কাস্টম db ইমপোর্ট করা হলো
import { 
  DateRange, 
  SerializedAnalytics, 
  serializeAnalyticsData 
} from "./shared.utils";

// রিটার্ন টাইপের স্ট্রিক্ট ইন্টারফেস
export interface OverviewSummaryData {
  totalSales: number;
  netSales: number;
  totalOrders: number;
  averageOrderValue: number;
  productsSold: number;
  variationsSold: number;
  totalVisitors: number;
  totalPageViews: number;
}

export interface OverviewActionResponse {
  currentPeriod: SerializedAnalytics[];
  previousPeriod: SerializedAnalytics[];
  currentSummary: OverviewSummaryData;
  previousSummary: OverviewSummaryData;
}

// ডিফল্ট সামারি জেনারেটর (শূন্য ভ্যালুর জন্য)
const getDefaultSummary = (): OverviewSummaryData => ({
  totalSales: 0,
  netSales: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  productsSold: 0,
  variationsSold: 0,
  totalVisitors: 0,
  totalPageViews: 0,
});

export async function getOverviewData(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<OverviewActionResponse> {
  
  // ১. বর্তমান সময়ের ডেটা ফেচ (Current Period)
  const currentDataRaw = await db.analytics.findMany({
    where: {
      date: {
        gte: currentRange.from,
        lte: currentRange.to,
      },
    },
    orderBy: { date: "asc" },
  });

  // ২. পূর্ববর্তী সময়ের ডেটা ফেচ (Previous Period - for comparison)
  const previousDataRaw = await db.analytics.findMany({
    where: {
      date: {
        gte: previousRange.from,
        lte: previousRange.to,
      },
    },
    orderBy: { date: "asc" },
  });

  // ৩. Prisma Decimal থেকে Serialized Number এ রূপান্তর (No 'any' type used)
  const currentPeriod = currentDataRaw.map(serializeAnalyticsData);
  const previousPeriod = previousDataRaw.map(serializeAnalyticsData);

  // ৪. Current Summary Calculation
  const currentSummary = currentPeriod.reduce((acc, curr) => {
    acc.totalSales += curr.grossSales;
    acc.netSales += curr.netSales;
    acc.totalOrders += curr.totalOrders;
    acc.productsSold += curr.productsSold;
    acc.variationsSold += curr.variationsSold;
    acc.totalVisitors += curr.totalVisitors;
    acc.totalPageViews += curr.totalPageViews;
    return acc;
  }, getDefaultSummary());

  currentSummary.averageOrderValue = 
    currentSummary.totalOrders > 0 
      ? currentSummary.netSales / currentSummary.totalOrders 
      : 0;

  // ৫. Previous Summary Calculation
  const previousSummary = previousPeriod.reduce((acc, curr) => {
    acc.totalSales += curr.grossSales;
    acc.netSales += curr.netSales;
    acc.totalOrders += curr.totalOrders;
    acc.productsSold += curr.productsSold;
    acc.variationsSold += curr.variationsSold;
    acc.totalVisitors += curr.totalVisitors;
    acc.totalPageViews += curr.totalPageViews;
    return acc;
  }, getDefaultSummary());

  previousSummary.averageOrderValue = 
    previousSummary.totalOrders > 0 
      ? previousSummary.netSales / previousSummary.totalOrders 
      : 0;

  return {
    currentPeriod,
    previousPeriod,
    currentSummary,
    previousSummary,
  };
}