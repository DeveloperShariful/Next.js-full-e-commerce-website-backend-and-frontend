//File Location: app/actions/backend/analytics/coupons.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { DateRange, SerializedAnalytics, serializeAnalyticsData, SUCCESS_STATUSES } from "./shared.utils";

export interface CouponTableRow {
  code: string;
  orders: number;
  amount: number;
  created: string | null;
  expires: string | null;
  type: string;
  isLocal: boolean;
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

  const [currentDataRaw, previousDataRaw, couponGroups, previousCouponGroups] = await Promise.all([
    db.analytics.findMany({
      where: { date: { gte: currentRange.from, lte: currentRange.to } },
      orderBy: { date: "asc" },
    }),
    db.analytics.findMany({
      where: { date: { gte: previousRange.from, lte: previousRange.to } },
      orderBy: { date: "asc" },
    }),
    db.order.groupBy({
      by: ["couponCode"],
      where: {
        orderDate: { gte: currentRange.from, lte: currentRange.to },
        status: { in: SUCCESS_STATUSES },
        couponCode: { not: null },
      },
      _count: { id: true },
      _sum: { discountTotal: true },
      orderBy: { _sum: { discountTotal: "desc" } },
    }),
    db.order.groupBy({
      by: ["couponCode"],
      where: {
        orderDate: { gte: previousRange.from, lte: previousRange.to },
        status: { in: SUCCESS_STATUSES },
        couponCode: { not: null },
      },
      _count: { id: true },
    }),
  ]);

  const chartData = currentDataRaw.map(serializeAnalyticsData);
  const previousChartData = previousDataRaw.map(serializeAnalyticsData);

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

  // Fetch all coupon details in ONE query (N+1 fix)
  const couponCodes = couponGroups
    .map((g) => g.couponCode)
    .filter((c): c is string => c !== null);

  const discountRecords = await db.discount.findMany({
    where: { code: { in: couponCodes } },
    select: { code: true, createdAt: true, endDate: true, type: true },
  });
  const discountMap = new Map(discountRecords.map((d) => [d.code, d]));

  const tableData: CouponTableRow[] = couponGroups
    .filter((g): g is typeof g & { couponCode: string } => g.couponCode !== null)
    .map((group) => {
      const discountRecord = discountMap.get(group.couponCode);
      return {
        code: group.couponCode,
        orders: group._count.id,
        amount: Number(group._sum.discountTotal) || 0,
        created: discountRecord?.createdAt ? discountRecord.createdAt.toISOString() : null,
        expires: discountRecord?.endDate ? discountRecord.endDate.toISOString() : null,
        type: discountRecord?.type
          ? discountRecord.type.charAt(0) + discountRecord.type.slice(1).toLowerCase().replace("_", " ")
          : "—",
        isLocal: !!discountRecord,
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
