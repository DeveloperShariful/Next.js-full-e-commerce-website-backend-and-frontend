//app/actions/storefront/affiliates/_services/dashboard-service.ts

"use server";

import { db } from "@/lib/prisma";
import { format, eachDayOfInterval, subDays, startOfDay, endOfDay } from "date-fns";
import { unstable_cache } from "next/cache";
import { AnnouncementType, CommissionType } from "@prisma/client";
import { serializePrismaData } from "@/lib/format-data";

// ==========================================
// 1. PROFILE & STATS (OPTIMIZED)
// ==========================================

export async function getProfile(userId: string) {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      slug: true,
      status: true,
      balance: true,       
      totalEarnings: true, 
      commissionRate: true, 
      commissionType: true,
      user: { 
        select: { 
          name: true, 
          email: true, 
          image: true 
        } 
      },
      tier: {
        select: {
          id: true,
          name: true,
          icon: true,
          commissionRate: true, 
          commissionType: true
        }
      },
      group: {
        select: {
          id: true,
          name: true
        }
      }
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
    balance: affiliate.balance.toNumber(),
    totalEarnings: affiliate.totalEarnings.toNumber(),
    tier: affiliate.tier ? {
      name: affiliate.tier.name,
      icon: affiliate.tier.icon,
      commissionRate: affiliate.tier.commissionRate.toNumber(),
      commissionType: affiliate.tier.commissionType
    } : null,
    group: affiliate.group ? {
      id: affiliate.group.id,
      name: affiliate.group.name
    } : null
  };
}

export async function getActiveContests() {
  const contests = await db.affiliateContest.findMany({
    where: {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() }
    },
    orderBy: { endDate: "asc" },
    take: 3, 
    select: {
      id: true,
      title: true,
      description: true,
      endDate: true,
      prizes: true, 
      criteria: true  
    }
  });

  return serializePrismaData(contests);
}

export async function getStats(affiliateId: string) {
  return await unstable_cache(async () => {
    const [clicks, referrals] = await Promise.all([
      db.affiliateClick.count({ where: { affiliateId } }),
      db.referral.aggregate({
        where: { affiliateId, status: { in: ["APPROVED", "PAID"] } },
        _count: { id: true },
        _sum: { commissionAmount: true }
      })
    ]);

    const account = await db.affiliateAccount.findUnique({ 
        where: { id: affiliateId },
        select: { balance: true }
    });

    const totalReferrals = referrals._count.id;
    const totalEarnings = referrals._sum.commissionAmount?.toNumber() || 0;

    return {
      clicks,
      referrals: totalReferrals,
      conversionRate: clicks > 0 ? (totalReferrals / clicks) * 100 : 0,
      unpaidEarnings: account?.balance.toNumber() || 0,
      totalEarnings,
      nextPayoutDate: null 
    };
  }, [`affiliate-stats-${affiliateId}`], { revalidate: 600 })();
}

// ==========================================
// 2. ENTERPRISE FEATURES
// ==========================================

export async function getAnnouncements(affiliateId: string) {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { groupId: true, tierId: true }
  });

  if (!affiliate) return [];

  const announcements = await db.affiliateAnnouncement.findMany({
    where: {
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ],
      AND: [
        {
          OR: [
            { targetGroups: { none: {} }, targetTiers: { none: {} } },
            { targetGroups: { some: { id: affiliate.groupId || "x" } } },
            { targetTiers: { some: { id: affiliate.tierId || "x" } } }
          ]
        }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { 
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true
    }
  });

  return announcements.map(a => ({
    id: a.id,
    title: a.title,
    message: a.content,
    type: a.type as AnnouncementType,
    date: a.createdAt
  }));
}

export async function getTierProgress(affiliateId: string) {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { 
        totalEarnings: true, // Decimal
        tierId: true,
        tier: { select: { name: true } }
    }
  });

  if (!affiliate) return null;

  const currentEarnings = affiliate.totalEarnings.toNumber();
  const currentTierId = affiliate.tierId;

  const allTiers = await db.affiliateTier.findMany({
    orderBy: { minSalesAmount: "asc" },
    select: { 
        id: true,
        name: true,
        minSalesAmount: true, 
        commissionRate: true,
        commissionType: true
    }
  });

  const currentIndex = allTiers.findIndex(t => t.id === currentTierId);
  const nextTier = allTiers[currentIndex + 1];

  if (!nextTier) {
    return { 
      currentTierName: affiliate.tier?.name || "Top Tier",
      nextTierName: null,
      progress: 100,
      amountNeeded: 0,
      isMaxTier: true,
      nextTierType: null,
      nextTierRate: 0
    };
  }

  const target = nextTier.minSalesAmount.toNumber();
  const progress = Math.min((currentEarnings / target) * 100, 100);

  return {
    currentTierName: affiliate.tier?.name,
    nextTierName: nextTier.name,
    nextTierRate: nextTier.commissionRate.toNumber(),
    nextTierType: nextTier.commissionType,
    progress,
    amountNeeded: Math.max(target - currentEarnings, 0),
    isMaxTier: false
  };
}

export async function getActiveRules() {
  const rules = await db.affiliateCommissionRule.findMany({
    where: {
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }]
    },
    orderBy: { priority: "desc" },
    select: { 
        id: true,
        name: true,
        description: true,
        action: true
    }
  });

  return rules.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description || "Special commission offer",
    type: (r.action as any).type as CommissionType,
    value: Number((r.action as any).value)
  }));
}

// ==========================================
// 3. CHARTS & ACTIVITY
// ==========================================

export async function getPerformanceChart(affiliateId: string) {
  return await unstable_cache(async () => {
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, 29));

      const rawReferrals = await db.referral.findMany({
        where: {
          affiliateId,
          createdAt: { gte: start, lte: end },
          status: { in: ["APPROVED", "PAID"] }
        },
        select: { createdAt: true, commissionAmount: true } 
      });

      const days = eachDayOfInterval({ start, end });
      
      return days.map(day => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayTransactions = rawReferrals.filter(r => format(r.createdAt, "yyyy-MM-dd") === dateKey);
        const dailyEarnings = dayTransactions.reduce((sum, item) => 
          sum + item.commissionAmount.toNumber(), 0
        );

        return {
          date: format(day, "yyyy-MM-dd"),
          displayDate: format(day, "MMM dd"),
          earnings: dailyEarnings,
        };
      });
    },
    [`affiliate-chart-${affiliateId}`],
    { revalidate: 3600 }
  )();
}

export async function getRecentActivity(affiliateId: string) {
  const referrals = await db.referral.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { 
        id: true,
        commissionAmount: true,
        createdAt: true,
        status: true,
        order: { select: { orderNumber: true } }
    }
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