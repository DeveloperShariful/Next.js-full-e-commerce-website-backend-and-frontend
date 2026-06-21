// app/actions/storefront/affiliates/_services/dashboard-service.ts

"use server";

import { db } from "@/lib/prisma";
import { format, eachDayOfInterval, subDays, startOfDay, endOfDay, isBefore, isAfter } from "date-fns";
import { unstable_cache } from "next/cache";
import { AnnouncementType, CommissionType } from "@prisma/client";
import { serializePrismaData } from "@/lib/format-data";
import { z } from "zod";

interface ContestJson {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  prizes?: Record<string, string>;
  criteria?: string;
}

interface AnnouncementJson {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string | null;
  groupIds?: string[];
  tierIds?: string[];
  type: string;
}

interface RuleAction {
  type: CommissionType;
  value: number;
}

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
      }
      // ✅ FIXED: Removed 'group' because AffiliateGroup table is deleted
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
  };
}

export async function getActiveContests() {
  // ✅ FIXED: Fetching from StoreSettings JSON instead of deleted table
  const settings = await db.storeSettings.findUnique({
    where: { id: "settings" },
    select: { affiliateContests: true }
  });

  if (!settings || !settings.affiliateContests) return [];

  if (!Array.isArray(settings.affiliateContests)) return [];
  const contests = settings.affiliateContests as unknown as ContestJson[];
  const now = new Date();

  const activeContests = contests
    .filter(c => {
      try {
        return c?.isActive && isBefore(new Date(c.startDate), now) && isAfter(new Date(c.endDate), now);
      } catch { return false; }
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      title: c.title,
      description: c.description || "",
      endDate: new Date(c.endDate),
      prizes: c.prizes,
      criteria: c.criteria
    }));

  return serializePrismaData(activeContests);
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
// 2. ENTERPRISE FEATURES (DYNAMIC JSON TARGETING)
// ==========================================

export async function getAnnouncements(affiliateId: string) {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { tags: true, tierId: true } // ✅ FIXED: Using tags instead of groupId
  });

  if (!affiliate) return [];

  // ✅ FIXED: Fetching from StoreSettings JSON instead of deleted table
  const settings = await db.storeSettings.findUnique({
    where: { id: "settings" },
    select: { affiliateAnnouncements: true }
  });

  if (!settings || !settings.affiliateAnnouncements) return [];

  const announcements = settings.affiliateAnnouncements as unknown as AnnouncementJson[];
  const now = new Date();

  const userTags = affiliate.tags || [];
  const userTierId = affiliate.tierId;

  // Filter based on active status, date validity, and dynamic targeting logic
  const validAnnouncements = announcements
    .filter(a => {
        if (!a.isActive) return false;
        
        const startsAt = new Date(a.startsAt);
        const expiresAt = a.expiresAt ? new Date(a.expiresAt) : null;
        
        if (isAfter(startsAt, now)) return false; // Not started yet
        if (expiresAt && isBefore(expiresAt, now)) return false; // Expired

        // Targeting Logic
        const hasNoTargets = (!a.groupIds || a.groupIds.length === 0) && (!a.tierIds || a.tierIds.length === 0);
        const matchesTag = a.groupIds?.some((tag: string) => userTags.includes(tag));
        const matchesTier = userTierId ? a.tierIds?.includes(userTierId) : false;

        // Show if targeted to ALL, or if user's tag/tier matches
        return hasNoTargets || matchesTag || matchesTier;
    })
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, 5)
    .map(a => ({
        id: a.id,
        title: a.title,
        message: a.content,
        type: a.type as AnnouncementType,
        date: new Date(a.startsAt)
    }));

  return validAnnouncements;
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
    type: (r.action as unknown as RuleAction).type,
    value: Number((r.action as unknown as RuleAction).value)
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