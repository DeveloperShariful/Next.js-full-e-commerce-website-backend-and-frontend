//File Location: app/actions/backend/analytics/coupons.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, SerializedAnalytics, serializeAnalyticsData } from "./shared.utils";

export interface CouponTableRow {
  code: string;
  orders: number;
  amount: number;
  created: string | null;
  expires: string | null;
  type: string;
}

export interface CouponsAnalyticsResponse {
  summary: {
    discountedOrders: number;
    amount: number;
  };
  previousSummary: {
    discountedOrders: number;
    amount: number;
  };
  chartData: SerializedAnalytics[];
  previousChartData: SerializedAnalytics[];
  tableData: CouponTableRow[];
}

export async function getCouponsAnalyticsData(
  currentRange: DateRange,
  previousRange: DateRange
): Promise<CouponsAnalyticsResponse> {

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

  const SUCCESS_STATUSES = ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "READY_FOR_PICKUP", "PARTIALLY_PAID"];

  // ২. Table Data from Order table grouped by couponCode
  const couponGroups = await db.order.groupBy({
    by: ["couponCode"],
    where: {
      orderDate: { gte: currentRange.from, lte: currentRange.to },
      status: { in: SUCCESS_STATUSES as any },
      couponCode: { not: null }, // শুধুমাত্র কুপন ব্যবহার করা অর্ডারগুলো
    },
    _count: { id: true },
    _sum: { discountTotal: true },
    orderBy: {
      _sum: { discountTotal: "desc" },
    }
  });

  // Previous discounted orders count (for percentage calculation)
  const previousCouponGroups = await db.order.groupBy({
    by: ["couponCode"],
    where: {
      orderDate: { gte: previousRange.from, lte: previousRange.to },
      status: { in: SUCCESS_STATUSES as any },
      couponCode: { not: null },
    },
    _count: { id: true },
  });

  const currentDiscountedOrders = couponGroups.reduce((acc, curr) => acc + curr._count.id, 0);
  const previousDiscountedOrders = previousCouponGroups.reduce((acc, curr) => acc + curr._count.id, 0);

  const summary = {
    discountedOrders: currentDiscountedOrders,
    amount: chartData.reduce((acc, curr) => acc + curr.totalDiscounts, 0),
  };

  const previousSummary = {
    discountedOrders: previousDiscountedOrders,
    amount: previousChartData.reduce((acc, curr) => acc + curr.totalDiscounts, 0),
  };

  // ৩. Fetch additional Coupon details (Type, CreatedAt, ExpiresAt) from Discount table
  const tableData: CouponTableRow[] = await Promise.all(
    couponGroups.map(async (group) => {
      if (!group.couponCode) return null;

      // কুপনের বিস্তারিত ডাটাবেস থেকে নেওয়া
      const discountRecord = await db.discount.findUnique({
        where: { code: group.couponCode },
        select: { createdAt: true, endDate: true, type: true }
      });

      return {
        code: group.couponCode,
        orders: group._count.id,
        amount: Number(group._sum.discountTotal) || 0,
        created: discountRecord?.createdAt ? discountRecord.createdAt.toISOString() : null,
        expires: discountRecord?.endDate ? discountRecord.endDate.toISOString() : null,
        // enum type format (e.g. PERCENTAGE -> Percentage)
        type: discountRecord?.type 
            ? discountRecord.type.charAt(0) + discountRecord.type.slice(1).toLowerCase().replace('_', ' ') 
            : "Unknown",
      };
    })
  ).then(res => res.filter((item): item is CouponTableRow => item !== null));

  return {
    summary,
    previousSummary,
    chartData,
    previousChartData,
    tableData
  };
}