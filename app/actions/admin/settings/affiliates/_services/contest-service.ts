//app/actions/admin/settings/affiliate/_services/contest-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: GAMIFICATION & CONTESTS
 * Manages sales competitions and generates real-time leaderboards.
 */
export const contestService = {

  /**
   * Get Active and Upcoming Contests
   */
  async getContests() {
    try {
      return await db.affiliateContest.findMany({
        orderBy: { startDate: "desc" }, // Newest first
      });
    } catch (error) {
      console.error("[ContestService] Fetch Error:", error);
      throw new Error("Failed to fetch contests.");
    }
  },

  /**
   * Create a New Contest
   */
  async createContest(data: Prisma.AffiliateContestCreateInput) {
    return await db.affiliateContest.create({ data });
  },

  /**
   * Generate Live Leaderboard for a Contest
   * Aggregates sales/referrals within the date range.
   */
  async getContestLeaderboard(contestId: string, limit: number = 10) {
    const contest = await db.affiliateContest.findUnique({
      where: { id: contestId }
    });

    if (!contest) throw new Error("Contest not found");

    // 1. Define Metrics (Sales Amount vs Referral Count)
    const isSalesMetric = contest.criteria === "sales_amount";

    // 2. Aggregate Data using GroupBy
    // Note: Prisma GroupBy allows us to sum/count fields filtered by date
    const leaderboard = await db.referral.groupBy({
      by: ['affiliateId'],
      where: {
        createdAt: {
          gte: contest.startDate,
          lte: contest.endDate
        },
        status: { in: ["APPROVED", "PAID"] } // Only valid sales
      },
      _sum: {
        totalOrderAmount: true, // For Sales Volume
      },
      _count: {
        id: true, // For Sales Count
      },
      orderBy: isSalesMetric 
        ? { _sum: { totalOrderAmount: 'desc' } }
        : { _count: { id: 'desc' } },
      take: limit,
    });

    // 3. Fetch User Details for the IDs (Since groupBy doesn't include relations)
    const affiliateIds = leaderboard.map(l => l.affiliateId);
    const affiliates = await db.affiliateAccount.findMany({
      where: { id: { in: affiliateIds } },
      select: {
        id: true,
        user: { select: { name: true, image: true, email: true } }
      }
    });

    // 4. Merge Data
    return leaderboard.map((entry, index) => {
      const affiliate = affiliates.find(a => a.id === entry.affiliateId);
      const score = isSalesMetric 
        ? entry._sum.totalOrderAmount?.toNumber() || 0
        : entry._count.id || 0;

      return {
        rank: index + 1,
        affiliateId: entry.affiliateId,
        name: affiliate?.user.name || "Unknown",
        avatar: affiliate?.user.image,
        score: score,
        metric: isSalesMetric ? "$" : "Referrals"
      };
    });
  },

  /**
   * Delete Contest
   */
  async deleteContest(id: string) {
    return await db.affiliateContest.delete({ where: { id } });
  }
};