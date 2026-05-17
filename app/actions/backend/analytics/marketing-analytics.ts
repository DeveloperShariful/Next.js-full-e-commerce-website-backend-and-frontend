//app/actions/admin/analytics/marketing-analytics.ts

"use server";

import { db } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { DateRange } from "./types";

export async function getMarketingAnalytics(current: DateRange) {
  
  const validStatus = { notIn: [OrderStatus.CANCELLED, OrderStatus.DRAFT, OrderStatus.FAILED] as OrderStatus[] };

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

  // ✅ FIX: Decimal -> Number
  const lostRev = Number(abandonedCarts._sum.subtotal || 0);
  const recRev = Number(recoveredCarts._sum.subtotal || 0);

  const cartMetrics = {
    totalLostRevenue: lostRev - recRev,
    totalRecoveredRevenue: recRev,
    abandonedCount: abandonedCarts._count.id || 0,
    recoveredCount: recoveredCarts._count.id || 0,
    recoveryRate: (abandonedCarts._count.id || 0) > 0 
      ? ((recoveredCarts._count.id || 0) / (abandonedCarts._count.id || 0)) * 100 
      : 0
  };

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
    // ✅ FIX: Decimal -> Number
    totalDiscounted: Number(c._sum.discountTotal || 0)
  }));

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

  const paymentDist = await db.order.groupBy({
    by: ['paymentGateway'], 
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
    // ✅ FIX: Decimal -> Number
    amount: Number(p._sum.total || 0)
  })).sort((a, b) => b.amount - a.amount);

  return {
    cartMetrics,
    topCoupons,
    orderStatusDistribution,
    paymentMethodDistribution
  };
}