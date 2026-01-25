//app/actions/storefront/affiliates/_services/dashboard-service.ts

import { db } from "@/lib/prisma";
import { startOfMonth, subMonths, format, eachDayOfInterval, subDays } from "date-fns";
import { AffiliateProfileDTO, DashboardStats, RecentActivityItem, ChartData } from "../types";

/**
 * SERVICE: Affiliate Dashboard Data
 */
export const dashboardService = {

  /**
   * Get Current Affiliate Profile by User ID
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
    
    // Balance comes directly from account
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
      nextPayoutDate: null // Can be calculated based on payout schedule if needed
    };
  },

  /**
   * Get Chart Data (Last 30 Days)
   */
  async getPerformanceChart(affiliateId: string): Promise<ChartData[]> {
    const end = new Date();
    const start = subDays(end, 30);

    const rawData = await db.referral.groupBy({
      by: ['createdAt'],
      where: {
        affiliateId,
        createdAt: { gte: start },
        status: { in: ["APPROVED", "PAID"] }
      },
      _sum: { commissionAmount: true }
    });

    // Normalize dates
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dateStr = format(day, "MMM dd");
      // Aggregate items matching this day
      const match = rawData.find(d => 
        format(d.createdAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      );
      
      return {
        date: dateStr,
        earnings: match?._sum.commissionAmount?.toNumber() || 0,
        clicks: 0 // Fetch clicks separately if needed
      };
    });
  },

  /**
   * Recent Activity Feed
   */
  async getRecentActivity(affiliateId: string): Promise<RecentActivityItem[]> {
    const referrals = await db.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { order: { select: { orderNumber: true } } }
    });

    return referrals.map(r => ({
      id: r.id,
      type: "REFERRAL",
      description: `Commission from Order #${r.order.orderNumber}`,
      amount: r.commissionAmount.toNumber(),
      date: r.createdAt,
      status: r.status
    }));
  }
};