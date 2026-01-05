//app/actions/admin/analytics/marketing-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { DateRange } from "./types";

/**
 * Fetches marketing & operational metrics:
 * 1. Abandoned Cart Recovery Rates
 * 2. Coupon/Discount Usage
 * 3. Order Status Breakdown (Pie Chart Data)
 * 4. Payment Method Breakdown
 */
export async function getMarketingAnalytics(current: DateRange) {
  
  const validStatus = { notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT, OrderStatus.FAILED] as OrderStatus[] };

  // ====================================================
  // 1. Abandoned Cart Analytics
  // ====================================================
  // We calculate how much money was lost in carts vs how much was recovered.
  const abandonedCarts = await db.abandonedCheckout.aggregate({
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
    },
    _sum: { subtotal: true },
    _count: { id: true }
  });

  const recoveredCarts = await db.abandonedCheckout.aggregate({
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      isRecovered: true
    },
    _sum: { subtotal: true },
    _count: { id: true }
  });

  const cartMetrics = {
    totalLostRevenue: (abandonedCarts._sum.subtotal || 0) - (recoveredCarts._sum.subtotal || 0),
    totalRecoveredRevenue: recoveredCarts._sum.subtotal || 0,
    abandonedCount: abandonedCarts._count.id || 0,
    recoveredCount: recoveredCarts._count.id || 0,
    recoveryRate: (abandonedCarts._count.id || 0) > 0 
      ? ((recoveredCarts._count.id || 0) / (abandonedCarts._count.id || 0)) * 100 
      : 0
  };

  // ====================================================
  // 2. Coupon & Discount Usage
  // ====================================================
  // See which coupons are driving sales.
  const couponUsage = await db.order.groupBy({
    by: ['couponCode'],
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      status: validStatus,
      couponCode: { not: null }
    },
    _count: { id: true },
    _sum: { discountTotal: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const topCoupons = couponUsage.map(c => ({
    code: c.couponCode || "Unknown",
    usageCount: c._count.id || 0,
    totalDiscounted: c._sum.discountTotal || 0
  }));

  // ====================================================
  // 3. Order Status Distribution (For Pie Chart)
  // ====================================================
  const statusDist = await db.order.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate }
    },
    _count: { id: true }
  });

  const orderStatusDistribution = statusDist.map(s => ({
    status: s.status,
    count: s._count.id || 0
  }));

  // ====================================================
  // 4. Payment Gateway Performance
  // ====================================================
  // See which payment method brings most money
  const paymentDist = await db.order.groupBy({
    by: ['paymentGateway'], // or 'paymentMethod' based on your preference
    where: {
      createdAt: { gte: current.startDate, lte: current.endDate },
      status: validStatus
    },
    _count: { id: true },
    _sum: { total: true }
  });

  const paymentMethodDistribution = paymentDist.map(p => ({
    method: p.paymentGateway || "Unknown/Offline",
    count: p._count.id || 0,
    amount: p._sum.total || 0
  })).sort((a, b) => b.amount - a.amount);

  return {
    cartMetrics,
    topCoupons,
    orderStatusDistribution,
    paymentMethodDistribution
  };
}