//app/actions/admin/settings/affiliate/_services/analytics-service.ts

import { db } from "@/lib/prisma";
import { startOfMonth, subMonths, format } from "date-fns";

/**
 * SERVICE LAYER: ADVANCED ANALYTICS
 * Handles complex aggregations for the "Reports" page.
 */
export const analyticsService = {

  /**
   * 1. Top Performing Products (Sold via Affiliates)
   * Uses Prisma GroupBy on OrderItems where Order has an affiliate attached.
   */
  async getTopProducts(limit: number = 5) {
    try {
      const topProducts = await db.orderItem.groupBy({
        by: ['productName'],
        where: {
          order: {
            affiliateId: { not: null } // Only affiliate orders
          }
        },
        _sum: {
          total: true, // Revenue
          quantity: true // Units sold
        },
        orderBy: {
          _sum: { total: 'desc' }
        },
        take: limit,
      });

      return topProducts.map(p => ({
        name: p.productName,
        revenue: p._sum.total?.toNumber() || 0,
        sales: p._sum.quantity || 0,
      }));
    } catch (error) {
      console.error("Top Products Error:", error);
      return [];
    }
  },

  /**
   * 2. Traffic Source Analysis (Referrers)
   * Analyzes where clicks are coming from.
   */
  async getTrafficSources() {
    try {
      const sources = await db.affiliateClick.groupBy({
        by: ['referrer'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      return sources.map(s => ({
        source: s.referrer ? new URL(s.referrer).hostname : "Direct / Email",
        visits: s._count.id
      }));
    } catch (error) {
      // Often URL parsing fails on bad data, fallback safe
      return [];
    }
  },

  /**
   * 3. Top Affiliates Leaderboard (Revenue Based)
   */
  async getTopAffiliates(limit: number = 5) {
    const top = await db.affiliateAccount.findMany({
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
      earnings: a.totalEarnings.toNumber(),
      slug: a.slug
    }));
  },

  /**
   * 4. Monthly Performance (Last 6 Months)
   * Used for the main bar chart.
   */
  async getMonthlyPerformance() {
    const start = subMonths(startOfMonth(new Date()), 5); // Last 6 months
    
    const monthlyData = await db.referral.groupBy({
      by: ['createdAt'], // Grouping by date needs post-processing usually
      where: {
        createdAt: { gte: start },
        status: { in: ["APPROVED", "PAID"] }
      },
      _sum: {
        totalOrderAmount: true,
        commissionAmount: true
      }
    });

    // Post-process to group by "Month-Year" manually since Prisma doesn't support date truncation easily in groupBy
    // (In a real enterprise app, use raw SQL for date_trunc)
    const grouped = new Map<string, { revenue: number; commission: number }>();

    monthlyData.forEach(item => {
      const monthKey = format(item.createdAt, "MMM yyyy");
      const current = grouped.get(monthKey) || { revenue: 0, commission: 0 };
      grouped.set(monthKey, {
        revenue: current.revenue + (item._sum.totalOrderAmount?.toNumber() || 0),
        commission: current.commission + (item._sum.commissionAmount?.toNumber() || 0)
      });
    });

    return Array.from(grouped.entries()).map(([month, data]) => ({
      month,
      ...data
    }));
  }
};