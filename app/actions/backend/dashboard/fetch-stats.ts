//app/actions/admin/dashboard/fetch-stats.ts
"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { calculateGrowth } from "./utils";
import { DashboardPulse, StatusBreakdown, TopProduct } from "./types";

// Helper to fetch single range stats
async function getStatsForRange(startDate: Date, endDate: Date, prevStartDate: Date, prevEndDate: Date): Promise<DashboardPulse> {
  
  // 1. REVENUE (Strictly PAID orders only, excluding trashed)
  const currentPaid = await db.order.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      paymentStatus: "PAID",
      status: { not: OrderStatus.CANCELLED },
      deletedAt: null,
    },
    _sum: { total: true }
  });

  const prevPaid = await db.order.aggregate({
    where: {
      createdAt: { gte: prevStartDate, lte: prevEndDate },
      paymentStatus: "PAID",
      status: { not: OrderStatus.CANCELLED },
      deletedAt: null,
    },
    _sum: { total: true }
  });

  // ✅ FIX: Convert aggregated Decimal to Number
  const currentRevenue = Number(currentPaid._sum.total || 0);
  const prevRevenue = Number(prevPaid._sum.total || 0);

  // 2. ORDER COUNTS (Total, Paid, Unpaid, excluding trashed)
  const currentOrders = await db.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: { not: OrderStatus.CANCELLED },
      deletedAt: null,
    },
    select: { id: true, paymentStatus: true, status: true }
  });

  const prevOrdersCount = await db.order.count({
    where: {
      createdAt: { gte: prevStartDate, lte: prevEndDate },
      status: { not: OrderStatus.CANCELLED },
      deletedAt: null,
    }
  });

  // Process Order Counts in JS (Faster than multiple DB calls)
  let paidCount = 0;
  let unpaidCount = 0;
  const breakdown: StatusBreakdown = {};

  currentOrders.forEach(order => {
    // Count Payment Status
    if (order.paymentStatus === "PAID") paidCount++;
    else unpaidCount++;

    // Count Order Status
    breakdown[order.status] = (breakdown[order.status] || 0) + 1;
  });

  // 3. CUSTOMERS
  const currentCustomers = await db.user.count({ where: { createdAt: { gte: startDate, lte: endDate }, role: "CUSTOMER" } });
  const prevCustomers = await db.user.count({ where: { createdAt: { gte: prevStartDate, lte: prevEndDate }, role: "CUSTOMER" } });

  // 4. TOP 3 SELLING PRODUCTS with growth (paid orders only)
  const topProductsCurrent = await db.orderItem.groupBy({
    by: ['productName'],
    where: {
      order: {
        createdAt: { gte: startDate, lte: endDate },
        paymentStatus: "PAID",
        status: { not: OrderStatus.CANCELLED },
        deletedAt: null,
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 3,
  });

  const topNames = topProductsCurrent.map(p => p.productName);
  const topProductsPrev = topNames.length > 0
    ? await db.orderItem.groupBy({
        by: ['productName'],
        where: {
          productName: { in: topNames },
          order: {
            createdAt: { gte: prevStartDate, lte: prevEndDate },
            paymentStatus: "PAID",
            status: { not: OrderStatus.CANCELLED },
            deletedAt: null,
          },
        },
        _sum: { quantity: true },
      })
    : [];

  const prevQtyMap = new Map(topProductsPrev.map(p => [p.productName, p._sum.quantity ?? 0]));

  const topProducts: TopProduct[] = topProductsCurrent.map(p => {
    const currentQty = p._sum.quantity ?? 0;
    const prevQty = prevQtyMap.get(p.productName) ?? 0;
    return {
      name: p.productName,
      quantity: currentQty,
      growth: calculateGrowth(currentQty, prevQty),
    };
  });

  const currentAOV = paidCount > 0 ? currentRevenue / paidCount : 0;
  const prevPaidCount = await db.order.count({
    where: {
      createdAt: { gte: prevStartDate, lte: prevEndDate },
      paymentStatus: "PAID",
      status: { not: OrderStatus.CANCELLED },
      deletedAt: null,
    },
  });
  const prevAOV = prevPaidCount > 0 ? prevRevenue / prevPaidCount : 0;

  return {
    revenue: {
      value: currentRevenue,
      growth: calculateGrowth(currentRevenue, prevRevenue)
    },
    orders: {
      total: currentOrders.length,
      paid: paidCount,
      unpaid: unpaidCount,
      growth: calculateGrowth(currentOrders.length, prevOrdersCount)
    },
    avgOrderValue: {
      value: currentAOV,
      growth: calculateGrowth(currentAOV, prevAOV),
    },
    customers: {
      value: currentCustomers,
      growth: calculateGrowth(currentCustomers, prevCustomers)
    },
    statusBreakdown: breakdown,
    topProducts,
  };
}

export async function getAllStats(
  todayStart: Date, todayEnd: Date,
  yesterdayStart: Date, yesterdayEnd: Date,
  weekStart: Date, monthStart: Date,
  prevDayStart: Date, prevWeekStart: Date, prevMonthStart: Date,
  thisMonthStart: Date, prevCalMonthStart: Date, prevCalMonthEnd: Date
) {
  return await Promise.all([
    getStatsForRange(todayStart, todayEnd, yesterdayStart, yesterdayEnd),
    getStatsForRange(yesterdayStart, yesterdayEnd, prevDayStart, yesterdayStart),
    getStatsForRange(weekStart, todayEnd, prevWeekStart, weekStart),
    getStatsForRange(monthStart, todayEnd, prevMonthStart, monthStart),
    getStatsForRange(thisMonthStart, todayEnd, prevCalMonthStart, prevCalMonthEnd),
  ]);
}