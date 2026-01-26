//app/actions/storefront/affiliates/_services/dashboard-service.ts

import { db } from "@/lib/prisma";
import { format, eachDayOfInterval, subDays, startOfDay, endOfDay } from "date-fns";
import { AffiliateProfileDTO, DashboardStats, RecentActivityItem, ChartData } from "../types";

export const dashboardService = {

  /**
   * Get Current Affiliate Profile
   */
  async getProfile(userId: string): Promise<AffiliateProfileDTO | null> {
    const affiliate = await db.affiliateAccount.findUnique({
      where: { userId },
      include: {
        tier: true,
        user: { select: { name: true, email: true, image: true } }
      }
    });

    if (!affiliate) return null;

    return {
      id: affiliate.id,
      userId: affiliate.userId,
      name: affiliate.user.name || "Partner",
      email: affiliate.user.email,
      avatar: affiliate.user.image,
      slug: affiliate.slug,
      status: affiliate.status,
      tier: affiliate.tier ? {
        name: affiliate.tier.name,
        icon: affiliate.tier.icon,
        commissionRate: affiliate.tier.commissionRate.toNumber(),
        commissionType: affiliate.tier.commissionType
      } : null,
      balance: affiliate.balance.toNumber(),
    };
  },

  /**
   * Get Main KPI Stats
   */
  async getStats(affiliateId: string): Promise<DashboardStats> {
    const [clicks, referrals] = await Promise.all([
      db.affiliateClick.count({ where: { affiliateId } }),
      db.referral.aggregate({
        where: { affiliateId, status: { in: ["APPROVED", "PAID"] } },
        _count: { id: true },
        _sum: { commissionAmount: true }
      })
    ]);

    const totalReferrals = referrals._count.id;
    const totalEarnings = referrals._sum.commissionAmount?.toNumber() || 0;
    
    const account = await db.affiliateAccount.findUnique({
      where: { id: affiliateId },
      select: { balance: true }
    });

    return {
      clicks,
      referrals: totalReferrals,
      conversionRate: clicks > 0 ? (totalReferrals / clicks) * 100 : 0,
      unpaidEarnings: account?.balance.toNumber() || 0,
      totalEarnings,
      nextPayoutDate: null 
    };
  },

  /**
   * Get Chart Data (Last 30 Days) - FULLY DYNAMIC & FILLED
   */
  async getPerformanceChart(affiliateId: string): Promise<ChartData[]> {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, 29)); // Last 30 days including today

    // Group by Date using Prisma is tricky for missing dates, so we fetch raw and map in JS
    const rawReferrals = await db.referral.findMany({
      where: {
        affiliateId,
        createdAt: { gte: start, lte: end },
        status: { in: ["APPROVED", "PAID"] }
      },
      select: { createdAt: true, commissionAmount: true }
    });

    // Create array of all dates in interval
    const days = eachDayOfInterval({ start, end });
    
    // Map and Fill 0 for missing days
    return days.map(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      
      // Filter transactions for this specific day
      const dayTransactions = rawReferrals.filter(r => 
        format(r.createdAt, "yyyy-MM-dd") === dateKey
      );

      const dailyEarnings = dayTransactions.reduce((sum, item) => 
        sum + item.commissionAmount.toNumber(), 0
      );
      
      return {
        date: format(day, "MMM dd"), // For Display (e.g. "Jan 25")
        earnings: dailyEarnings,
        clicks: 0 // Optional: Can implement separate click query if needed
      };
    });
  },

  /**
   * Recent Activity Feed
   */
  async getRecentActivity(affiliateId: string): Promise<RecentActivityItem[]> {
    // We combine Referrals and Payouts for a better activity feed
    const referrals = await db.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { order: { select: { orderNumber: true } } }
    });

    return referrals.map(r => ({
      id: r.id,
      type: "REFERRAL",
      description: `Commission earned #${r.order.orderNumber}`,
      amount: r.commissionAmount.toNumber(),
      date: r.createdAt,
      status: r.status
    }));
  }
};