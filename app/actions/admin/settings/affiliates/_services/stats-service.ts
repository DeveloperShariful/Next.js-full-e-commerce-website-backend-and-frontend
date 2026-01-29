// File: app/actions/admin/settings/affiliate/_services/stats-service.ts

"use server";

import { db } from "@/lib/prisma";
import { DashboardKPI, ChartDataPoint, DateRange } from "../types";
import { startOfDay, endOfDay, eachDayOfInterval, format, subDays, subMonths } from "date-fns";
import { unstable_cache } from "next/cache";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { protectAction } from "./permission-service"; // ✅ Security

// =========================================
// READ OPERATIONS (Cached)
// =========================================

export async function getDashboardKPI(range?: DateRange): Promise<DashboardKPI> {
  await protectAction("VIEW_ANALYTICS");

  const from = range?.from || subMonths(new Date(), 1);
  const to = range?.to || new Date();

  // Cache key based on date range to prevent stale data
  const cacheKey = `affiliate-kpi-${from.toISOString()}-${to.toISOString()}`;

  return await unstable_cache(
    async () => {
      const dateFilter = {
        createdAt: {
          gte: from,
          lte: to,
        }
      };

      const [financials, clicks, activeAffiliates, pendingApprovals, pendingPayouts] = await Promise.all([
        db.referral.aggregate({
          where: {
            status: { in: ["APPROVED", "PAID"] },
            ...dateFilter
          },
          _sum: {
            totalOrderAmount: true,
            commissionAmount: true,
          },
          _count: {
            id: true,
          }
        }),
        db.affiliateClick.count({
          where: dateFilter
        }),
        db.affiliateAccount.count({ where: { status: "ACTIVE" } }),
        db.affiliateAccount.count({ where: { status: "PENDING" } }),
        db.affiliatePayout.aggregate({
          where: { status: "PENDING" },
          _sum: { amount: true }
        })
      ]);

      const revenue = DecimalMath.toNumber(financials._sum.totalOrderAmount ?? 0);
      const commission = DecimalMath.toNumber(financials._sum.commissionAmount ?? 0);
      const conversions = financials._count.id || 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

      return {
        revenue,
        commission,
        clicks,
        conversions,
        conversionRate,
        activeAffiliates,
        pendingApprovals,
        payoutsPending: DecimalMath.toNumber(pendingPayouts._sum.amount ?? 0),
      };
    },
    [cacheKey],
    { tags: ["affiliate-stats"], revalidate: 300 } // 5 min cache
  )();
}

export async function getChartData(range: DateRange = { from: subDays(new Date(), 30), to: new Date() }): Promise<ChartDataPoint[]> {
  await protectAction("VIEW_ANALYTICS");

  const cacheKey = `affiliate-chart-${range.from.toISOString()}-${range.to.toISOString()}`;

  return await unstable_cache(
    async () => {
      const referrals = await db.referral.findMany({
        where: {
          createdAt: { gte: range.from, lte: range.to },
          status: { in: ["APPROVED", "PAID"] }
        },
        select: { createdAt: true, totalOrderAmount: true, commissionAmount: true },
      });

      const clickData = await db.affiliateClick.groupBy({
        by: ['createdAt'], 
        where: { createdAt: { gte: range.from, lte: range.to } },
        _count: { id: true }
      });

      const days = eachDayOfInterval({ start: range.from, end: range.to });
      
      return days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const dayReferrals = referrals.filter(r => r.createdAt >= dayStart && r.createdAt <= dayEnd);
        
        const dayRevenue = dayReferrals.reduce((sum, r) => sum + DecimalMath.toNumber(r.totalOrderAmount ?? 0), 0);
        const dayCommission = dayReferrals.reduce((sum, r) => sum + DecimalMath.toNumber(r.commissionAmount ?? 0), 0);

        // Approximate clicks mapping (since groupBy returns date objects)
        const clicksForDay = clickData
          .filter(c => format(c.createdAt, "yyyy-MM-dd") === dayStr)
          .reduce((acc, curr) => acc + curr._count.id, 0);

        return {
          date: format(day, "MMM dd"),
          revenue: dayRevenue,
          commission: dayCommission,
          clicks: clicksForDay, 
        };
      });
    },
    [cacheKey],
    { tags: ["affiliate-stats"], revalidate: 600 } 
  )();
}