// File: app/actions/admin/settings/affiliate/_services/dashboard-service.ts

"use server";

import { db } from "@/lib/prisma";
import { protectAction } from "../permission-service"; 
import { DecimalMath } from "@/lib/decimal-math";
import { unstable_cache } from "next/cache";
import { 
  subMonths, 
  startOfDay, 
  eachDayOfInterval, 
  format, 
  subDays 
} from "date-fns";
import { DashboardKPI, ChartDataPoint, DateRange } from "../types";

// =========================================
// SECTION 1: DASHBOARD KPI & CHARTS (ENTERPRISE OPTIMIZED)
// =========================================

export async function getDashboardKPI(range?: DateRange): Promise<DashboardKPI> {
  await protectAction("VIEW_ANALYTICS");
  const from = range?.from || subMonths(new Date(), 1);
  const to = range?.to || new Date();
  from.setHours(0,0,0,0);
  to.setHours(23,59,59,999);

  const cacheKey = `affiliate-kpi-${from.toISOString()}-${to.toISOString()}`;

  return await unstable_cache(
    async () => { 
      const [summaryStats, clicks, activeAffiliates, pendingApprovals, pendingPayouts] = await Promise.all([
        db.affiliateAnalyticsSummary.aggregate({
          where: {
            date: { gte: from, lte: to }
          },
          _sum: {
            revenue: true,
            commission: true,
            conversions: true
          }
        }),
        db.affiliateClick.count({
          where: { createdAt: { gte: from, lte: to } }
        }),
        db.affiliateAccount.count({ where: { status: "ACTIVE", deletedAt: null } }),
        db.affiliateAccount.count({ where: { status: "PENDING", deletedAt: null } }),
        db.affiliatePayout.aggregate({
          where: { status: "PENDING" },
          _sum: { amount: true }
        })
      ]);

      const revenue = DecimalMath.toNumber(summaryStats._sum.revenue ?? 0);
      const commission = DecimalMath.toNumber(summaryStats._sum.commission ?? 0);
      const conversions = summaryStats._sum.conversions || 0;
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
    { tags: ["affiliate-stats"], revalidate: 300 } 
  )();
}

export async function getChartData(range: DateRange = { from: subDays(new Date(), 30), to: new Date() }): Promise<ChartDataPoint[]> {
  await protectAction("VIEW_ANALYTICS");

  range.from.setHours(0,0,0,0);
  range.to.setHours(23,59,59,999);
  const cacheKey = `affiliate-chart-${range.from.toISOString()}-${range.to.toISOString()}`;
  return await unstable_cache(
    async () => {
      const summaryData = await db.affiliateAnalyticsSummary.groupBy({
        by: ['date'], 
        where: {
            date: { gte: range.from, lte: range.to }
        },
        _sum: {
            revenue: true,
            commission: true
        }
      });
      const clickData = await db.affiliateClick.groupBy({
        by: ['createdAt'], 
        where: { createdAt: { gte: range.from, lte: range.to } },
        _count: { id: true }
      });

      const days = eachDayOfInterval({ start: range.from, end: range.to });
      
      return days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayStat = summaryData.find(s => format(s.date, "yyyy-MM-dd") === dayStr);
        const clicksForDay = clickData
          .filter(c => format(c.createdAt, "yyyy-MM-dd") === dayStr)
          .reduce((acc, curr) => acc + curr._count.id, 0);

        return {
          date: format(day, "MMM dd"),
          revenue: DecimalMath.toNumber(dayStat?._sum.revenue ?? 0),
          commission: DecimalMath.toNumber(dayStat?._sum.commission ?? 0),
          clicks: clicksForDay, 
        };
      });
    },
    [cacheKey],
    { tags: ["affiliate-stats"], revalidate: 600 } 
  )();
}

// =========================================
// SECTION 2: DEEP ANALYTICS & TABLES (Optimized Raw Queries)
// =========================================

export async function getTopProducts(limit: number = 5) {
  try {
    await protectAction("VIEW_ANALYTICS");
    const result = await db.$queryRaw<any[]>`
      SELECT 
        "productName" as name,
        SUM(total) as revenue,
        SUM(quantity) as sales
      FROM "OrderItem"
      WHERE "orderId" IN (
        SELECT id FROM "Order" WHERE "affiliateId" IS NOT NULL AND "deletedAt" IS NULL
      )
      GROUP BY "productName"
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return result.map(p => ({
      name: p.name,
      revenue: Number(p.revenue),
      sales: Number(p.sales)
    }));
  } catch (error) {
    console.error("Top Products Error:", error);
    return [];
  }
}

export async function getTrafficSources() {
  try {
    await protectAction("VIEW_ANALYTICS");
    const result = await db.$queryRaw<any[]>`
      SELECT 
        referrer as source,
        COUNT(id) as visits
      FROM "AffiliateClick"
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 10
    `;

    return result.map(s => ({
      source: s.source ? new URL(s.source).hostname : "Direct / Email",
      visits: Number(s.visits)
    }));
  } catch (error) {
    return [];
  }
}

export async function getTopAffiliates(limit: number = 5) {
  await protectAction("VIEW_ANALYTICS");

  const top = await db.affiliateAccount.findMany({
    where: { deletedAt: null },
    orderBy: { totalEarnings: "desc" },
    take: limit,
    select: {
      id: true,
      user: { select: { name: true, email: true, image: true } },
      totalEarnings: true,
      slug: true
    }
  });

  return top.map(a => ({
    name: a.user.name || "Unknown",
    email: a.user.email,
    avatar: a.user.image,
    earnings: DecimalMath.toNumber(a.totalEarnings),
    slug: a.slug
  }));
}

export async function getMonthlyPerformance() {
  try {
    await protectAction("VIEW_ANALYTICS");
    const start = subMonths(startOfDay(new Date()), 5); 
    const result = await db.$queryRaw<any[]>`
      SELECT 
        TO_CHAR("createdAt", 'Mon YYYY') as month,
        DATE_TRUNC('month', "createdAt") as date_sort,
        SUM("totalOrderAmount") as revenue,
        SUM("commissionAmount") as commission
      FROM "Referral"
      WHERE "createdAt" >= ${start}
        AND status IN ('APPROVED', 'PAID')
      GROUP BY month, date_sort
      ORDER BY date_sort ASC
    `;

    return result.map(r => ({
      month: r.month,
      revenue: Number(r.revenue || 0),
      commission: Number(r.commission || 0)
    }));
  } catch (error) {
    console.error("Analytics Error:", error);
    return [];
  }
}