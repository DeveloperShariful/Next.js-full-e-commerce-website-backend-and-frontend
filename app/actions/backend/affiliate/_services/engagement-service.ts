// File: app/actions/backend/affiliate/_services/engagement-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";
import { DecimalMath } from "@/lib/decimal-math";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "../permission-service"; 
import { auditService } from "@/lib/audit-service";
import crypto from "crypto";

// =========================================
// SECTION 1: CONTESTS (JSON Based Enterprise Logic)
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

export async function getContests(): Promise<ContestInput[]> {
  try {
    await protectAction("VIEW_ANALYTICS");
    
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateContests: true }
    });

    const parsed = z.array(contestSchema).safeParse(settings?.affiliateContests);
    if (!parsed.success) return [];

    // Sort by startDate descending (latest first)
    return parsed.data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  } catch (error) {
    throw new Error("Failed to fetch contests.");
  }
}

export async function getContestLeaderboard(contestId: string, limit: number = 10) {
  const cacheKey = `contest-leaderboard-${contestId}`;

  return await unstable_cache(
    async () => {
      // 1. Fetch Contest from JSON
      const settings = await db.storeSettings.findUnique({
        where: { id: "settings" },
        select: { affiliateContests: true }
      });
      const parsed = z.array(contestSchema).safeParse(settings?.affiliateContests);
      const contests = parsed.success ? parsed.data : [];
      
      const contest = contests.find(c => c.id === contestId);
      if (!contest) throw new Error("Contest not found");

      const isSalesMetric = contest.criteria === "sales_amount";
      const start = new Date(contest.startDate);
      const end = new Date(contest.endDate);

      // 2. Aggregate Referrals dynamically
      const leaderboard = await db.referral.groupBy({
        by: ['affiliateId'],
        where: {
          createdAt: {
            gte: start,
            lte: end
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

      const affiliateIds = leaderboard.map(l => l.affiliateId).filter(Boolean) as string[];
      
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
    { tags: [`contest-${contestId}`], revalidate: 300 } 
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

    const currentContests = await getContests();
    
    let recordId = payload.id;
    let updatedContests = [...currentContests];

    if (payload.id) {
      // Update existing
      const index = updatedContests.findIndex(c => c.id === payload.id);
      if (index !== -1) {
        updatedContests[index] = { ...payload, id: payload.id };
      }
    } else {
      // Create new
      recordId = crypto.randomUUID();
      updatedContests.push({ ...payload, id: recordId });
    }

    // Save back to JSON array in StoreSettings
    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateContests: updatedContests }
    });

    await auditService.log({
        userId: actor.id,
        action: payload.id ? "UPDATE_CONTEST" : "CREATE_CONTEST",
        entity: "StoreSettings",
        entityId: "affiliateContests",
        newData: payload
    });

    revalidatePath("/admin/affiliate/contests");
    return { success: true, message: "Contest saved successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to save contest." };
  }
}

export async function deleteContestAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");

    const currentContests = await getContests();
    const updatedContests = currentContests.filter(c => c.id !== id);

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateContests: updatedContests }
    });
    
    await auditService.log({
        userId: actor.id,
        action: "DELETE_CONTEST",
        entity: "StoreSettings",
        entityId: id
    });

    revalidatePath("/admin/affiliate/contests");
    return { success: true, message: "Contest deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete contest." };
  }
}

// =========================================
// SECTION 2: CAMPAIGNS (Dynamic Aggregation from Links)
// =========================================

// --- READ OPERATIONS ---

export async function getAllCampaigns(page: number = 1, limit: number = 20, search?: string) {
  await protectAction("VIEW_ANALYTICS");

  // Since AffiliateCampaign table is deleted, we dynamically build the list from AffiliateLink
  const skip = (page - 1) * limit;

  // 1. Group by Campaign Name
  const campaignGroups = await db.affiliateLink.groupBy({
    by: ['campaignName', 'affiliateId'],
    where: { 
      campaignName: { not: null },
      ...(search && { campaignName: { contains: search, mode: "insensitive" } }) 
    },
    _sum: { clickCount: true },
    _count: { id: true },
    orderBy: { _sum: { clickCount: "desc" } }
  });

  const total = campaignGroups.length;
  const paginatedGroups = campaignGroups.slice(skip, skip + limit);

  // 2. Fetch Affiliate Details for those campaigns
  const affiliateIds = paginatedGroups.map(g => g.affiliateId).filter(Boolean) as string[];
  const affiliates = await db.affiliateAccount.findMany({
    where: { id: { in: affiliateIds } },
    select: { id: true, slug: true, user: { select: { name: true, image: true, email: true } } }
  });

  const formattedData = paginatedGroups.map(g => {
    const aff = affiliates.find(a => a.id === g.affiliateId);
    return {
      id: g.campaignName || "Unknown", // Treating campaignName as the ID
      name: g.campaignName || "Unknown",
      clicks: g._sum.clickCount || 0,
      revenue: 0, // Computed dynamically if needed, 0 for performance by default
      _count: { links: g._count.id },
      affiliate: {
        slug: aff?.slug || "",
        user: {
          name: aff?.user.name || "Unknown",
          image: aff?.user.image || null,
          email: aff?.user.email || ""
        }
      }
    };
  });

  return { 
    campaigns: formattedData, 
    total, 
    totalPages: Math.ceil(total / limit) 
  };
}

// --- WRITE OPERATIONS ---

export async function deleteCampaignAction(campaignName: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_PARTNERS"); 

    if (!campaignName) return { success: false, message: "Campaign Name is required." };

    // Instead of deleting a row, we unlink the links from this campaign string
    await db.affiliateLink.updateMany({
      where: { campaignName: campaignName },
      data: { campaignName: null }
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_CAMPAIGN",
      entity: "AffiliateLink",
      entityId: "BULK",
      newData: { deletedCampaign: campaignName }
    });

    revalidatePath("/admin/affiliate/campaigns");
    return { success: true, message: "Campaign removed from all links successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete campaign." };
  }
}