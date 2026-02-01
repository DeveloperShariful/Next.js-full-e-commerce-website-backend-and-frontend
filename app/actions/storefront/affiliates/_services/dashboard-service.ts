//app/actions/storefront/affiliates/_services/dashboard-service.ts

"use server";

import { db } from "@/lib/prisma";
import { format, eachDayOfInterval, subDays, startOfDay, endOfDay } from "date-fns";
import { revalidatePath, unstable_cache } from "next/cache";
import { nanoid } from "nanoid";
import { CommissionType } from "@prisma/client";
import { cookies } from "next/headers";
import { getAuthAffiliate } from "../auth-helper"; // Helper if needed inside actions

// ==========================================
// READ SERVICES (Named Exports)
// ==========================================

export async function getProfile(userId: string) {
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
}

export async function getStats(affiliateId: string) {
  const [clicks, referrals] = await Promise.all([
    db.affiliateClick.count({ where: { affiliateId } }),
    db.referral.aggregate({
      where: { affiliateId, status: { in: ["APPROVED", "PAID"] } },
      _count: { id: true },
      _sum: { commissionAmount: true }
    })
  ]);

  const totalReferrals = referrals._count.id;
  
  // Unpaid Earnings (Current Balance)
  const account = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { balance: true }
  });

  return {
    clicks,
    referrals: totalReferrals,
    conversionRate: clicks > 0 ? (totalReferrals / clicks) * 100 : 0,
    unpaidEarnings: account?.balance.toNumber() || 0,
    totalEarnings: referrals._sum.commissionAmount?.toNumber() || 0,
    nextPayoutDate: null 
  };
}

// 🚀 Performance Chart with Caching (From Option A Idea)
export async function getPerformanceChart(affiliateId: string) {
  return await unstable_cache(
    async () => {
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, 29)); // Last 30 Days

      // Fetch raw data (Grouped by Date logic can be complex in Prisma, so fetching raw and processing in JS)
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
        
        // Filter transactions for this specific day
        const dayTransactions = rawReferrals.filter(r => 
          format(r.createdAt, "yyyy-MM-dd") === dateKey
        );
        
        // Sum earnings
        const dailyEarnings = dayTransactions.reduce((sum, item) => 
          sum + item.commissionAmount.toNumber(), 0
        );

        return {
          date: format(day, "yyyy-MM-dd"), // Full date for sorting
          displayDate: format(day, "MMM dd"), // Display format
          earnings: dailyEarnings,
          clicks: 0 // If you track daily clicks, add query here
        };
      });
    },
    [`affiliate-chart-${affiliateId}`], // Cache Key
    { revalidate: 3600 } // Revalidate every 1 hour
  )();
}

export async function getRecentActivity(affiliateId: string) {
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

// ==========================================
// MUTATIONS (Server Actions)
// ==========================================

export async function registerAffiliateAction(userId: string) {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "User not found." };

    const existing = await db.affiliateAccount.findUnique({ where: { userId } });
    if (existing) return { success: false, message: "You are already an affiliate." };

    // Generate unique slug
    const baseSlug = user.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "partner";
    const slug = `${baseSlug}-${nanoid(4)}`;

    // MLM Logic: Check for Parent Cookie
    const cookieStore = await cookies();
    const parentSlug = cookieStore.get("affiliate_token")?.value;
    
    let parentId: string | null = null;

    if (parentSlug) {
      const parent = await db.affiliateAccount.findUnique({
        where: { slug: parentSlug, status: "ACTIVE" }
      });
      // Prevent self-referral
      if (parent && parent.userId !== userId) {
        parentId = parent.id;
      }
    }

    // Create Account
    await db.affiliateAccount.create({
      data: {
        userId,
        slug,
        status: "ACTIVE", // Or 'PENDING' based on your policy
        parentId: parentId,
        balance: 0,
        totalEarnings: 0,
        commissionRate: 10, // Default rate
        commissionType: CommissionType.PERCENTAGE,
      }
    });

    revalidatePath("/affiliates");
    return { success: true, message: "Registration successful!" };
    
  } catch (error: any) {
    console.error("Register Error:", error);
    return { success: false, message: "Failed to register. Please try again." };
  }
}