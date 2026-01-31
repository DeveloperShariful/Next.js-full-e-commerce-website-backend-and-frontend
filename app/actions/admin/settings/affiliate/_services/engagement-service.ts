//File: app/actions/admin/settings/affiliate/_services/engagement-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath, unstable_cache } from "next/cache";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "../permission-service"; 
import { auditService } from "@/lib/services/audit-service";

// =========================================
// SECTION 1: CONTESTS (Competitions)
// =========================================

const contestSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title is required."),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  criteria: z.enum(["sales_amount", "referral_count"]).default("sales_amount"),
  isActive: z.boolean().default(true),
  prizes: z.object({
    firstPlace: z.string().min(1, "1st Place prize is required"),
    secondPlace: z.string().optional(),
    thirdPlace: z.string().optional(),
  }),
});

type ContestInput = z.infer<typeof contestSchema>;

// --- READ OPERATIONS ---

export async function getContests() {
  try {
    await protectAction("VIEW_ANALYTICS");
    return await db.affiliateContest.findMany({
      orderBy: { startDate: "desc" },
    });
  } catch (error) {
    throw new Error("Failed to fetch contests.");
  }
}

export async function getContestLeaderboard(contestId: string, limit: number = 10) {
  // Publicly accessible via cache to reduce DB load on high traffic
  const cacheKey = `contest-leaderboard-${contestId}`;

  return await unstable_cache(
    async () => {
      const contest = await db.affiliateContest.findUnique({
        where: { id: contestId }
      });

      if (!contest) throw new Error("Contest not found");

      const isSalesMetric = contest.criteria === "sales_amount";

      // Aggregating Referrals within Date Range
      // Note: For Enterprise scale with millions of rows, consider a Summary Table approach.
      // But unstable_cache with 5 min TTL makes this acceptable for < 10M rows.
      const leaderboard = await db.referral.groupBy({
        by: ['affiliateId'],
        where: {
          createdAt: {
            gte: contest.startDate,
            lte: contest.endDate
          },
          status: { in: ["APPROVED", "PAID"] } 
        },
        _sum: {
          totalOrderAmount: true, 
        },
        _count: {
          id: true, 
        },
        orderBy: isSalesMetric 
          ? { _sum: { totalOrderAmount: 'desc' } }
          : { _count: { id: 'desc' } },
        take: limit,
      });

      const affiliateIds = leaderboard.map(l => l.affiliateId);
      
      // Efficiently fetch user details
      const affiliates = await db.affiliateAccount.findMany({
        where: { id: { in: affiliateIds } },
        select: {
          id: true,
          user: { select: { name: true, image: true, email: true } }
        }
      });

      return leaderboard.map((entry, index) => {
        const affiliate = affiliates.find(a => a.id === entry.affiliateId);
        const score = isSalesMetric 
          ? DecimalMath.toNumber(entry._sum.totalOrderAmount ?? 0)
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
    [cacheKey],
    { tags: [`contest-${contestId}`], revalidate: 300 } // 5 Minutes Cache
  )();
}

// --- WRITE OPERATIONS ---

export async function upsertContestAction(data: ContestInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION"); 

    const result = contestSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };

    const payload = result.data;

    if (new Date(payload.startDate) >= new Date(payload.endDate)) {
      return { success: false, message: "End date must be after start date." };
    }

    const dbPayload: Prisma.AffiliateContestCreateInput = {
      title: payload.title,
      description: payload.description,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      criteria: payload.criteria,
      isActive: payload.isActive,
      prizes: payload.prizes, 
    };

    let recordId = payload.id;

    if (payload.id) {
      await db.affiliateContest.update({
        where: { id: payload.id },
        data: dbPayload,
      });
    } else {
      const created = await db.affiliateContest.create({
        data: dbPayload,
      });
      recordId = created.id;
    }

    await auditService.log({
        userId: actor.id,
        action: payload.id ? "UPDATE_CONTEST" : "CREATE_CONTEST",
        entity: "AffiliateContest",
        entityId: recordId!,
        newData: payload
    });

    revalidatePath("/admin/settings/affiliate/contests");
    return { success: true, message: "Contest saved successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to save contest." };
  }
}

export async function deleteContestAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    await db.affiliateContest.delete({ where: { id } });
    
    await auditService.log({
        userId: actor.id,
        action: "DELETE_CONTEST",
        entity: "AffiliateContest",
        entityId: id
    });

    revalidatePath("/admin/settings/affiliate/contests");
    return { success: true, message: "Contest deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete contest." };
  }
}

// =========================================
// SECTION 2: CAMPAIGNS (Tracking)
// =========================================

// --- READ OPERATIONS ---

export async function getAllCampaigns(page: number = 1, limit: number = 20, search?: string) {
  await protectAction("VIEW_ANALYTICS");

  const skip = (page - 1) * limit;

  const where: Prisma.AffiliateCampaignWhereInput = search ? {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { affiliate: { user: { name: { contains: search, mode: "insensitive" } } } }
    ]
  } : {};

  const [total, data] = await Promise.all([
    db.affiliateCampaign.count({ where }),
    db.affiliateCampaign.findMany({
      where,
      take: limit,
      skip,
      orderBy: { revenue: "desc" }, 
      include: {
        affiliate: {
          select: {
            slug: true,
            user: { select: { name: true, image: true, email: true } }
          }
        },
        _count: {
          select: { links: true } 
        }
      }
    })
  ]);

  const formattedData = data.map(c => ({
      ...c,
      revenue: DecimalMath.toNumber(c.revenue)
  }));

  return { 
    campaigns: formattedData, 
    total, 
    totalPages: Math.ceil(total / limit) 
  };
}

// --- WRITE OPERATIONS ---

export async function deleteCampaignAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS"); 

    if (!id) return { success: false, message: "Campaign ID is required." };

    // Enterprise Integrity Check
    const linkCount = await db.affiliateLink.count({ where: { campaignId: id } });
    if (linkCount > 0) {
        return { success: false, message: `Cannot delete: ${linkCount} active links use this campaign.` };
    }

    const deleted = await db.affiliateCampaign.delete({
      where: { id }
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_CAMPAIGN",
      entity: "AffiliateCampaign",
      entityId: id,
      oldData: { name: deleted.name, affiliateId: deleted.affiliateId }
    });

    revalidatePath("/admin/settings/affiliate/campaigns");
    return { success: true, message: "Campaign deleted successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete campaign." };
  }
}