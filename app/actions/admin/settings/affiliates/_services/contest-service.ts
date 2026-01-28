// File: app/actions/admin/settings/affiliate/_services/contest-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath, unstable_cache } from "next/cache";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { ActionResponse } from "../types";
import { syncUser } from "@/lib/auth-sync";
import { z } from "zod";

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

// =========================================
// READ OPERATIONS
// =========================================
export async function getContests() {
  try {
    return await db.affiliateContest.findMany({
      orderBy: { startDate: "desc" },
    });
  } catch (error) {
    throw new Error("Failed to fetch contests.");
  }
}

export async function getContestLeaderboard(contestId: string, limit: number = 10) {
  const cacheKey = `contest-leaderboard-${contestId}`;

  return await unstable_cache(
    async () => {
      const contest = await db.affiliateContest.findUnique({
        where: { id: contestId }
      });

      if (!contest) throw new Error("Contest not found");

      const isSalesMetric = contest.criteria === "sales_amount";

      // Aggregate Referrals within Date Range
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

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function upsertContestAction(data: ContestInput): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

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

    if (payload.id) {
      await db.affiliateContest.update({
        where: { id: payload.id },
        data: dbPayload,
      });
    } else {
      await db.affiliateContest.create({
        data: dbPayload,
      });
    }

    revalidatePath("/admin/settings/affiliate/contests");
    return { success: true, message: "Contest saved successfully." };
  } catch (error: any) {
    return { success: false, message: "Failed to save contest." };
  }
}

export async function deleteContestAction(id: string): Promise<ActionResponse> {
  try {
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) return { success: false, message: "Unauthorized" };

    await db.affiliateContest.delete({ where: { id } });
    revalidatePath("/admin/settings/affiliate/contests");
    return { success: true, message: "Contest deleted." };
  } catch (error) {
    return { success: false, message: "Failed to delete contest." };
  }
}