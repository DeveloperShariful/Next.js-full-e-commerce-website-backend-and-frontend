// app/actions/storefront/affiliates/_services/marketing-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getAuthAffiliate } from "../auth-helper"; 
import { serializePrismaData } from "@/lib/format-data";

// ==========================================
// 1. VALIDATION SCHEMAS (JSON Ready)
// ==========================================
const linkSchema = z.object({
  destinationUrl: z.string().url("Please enter a valid URL (e.g. https://gobike.au/product/1)"),
  customSlug: z.string()
    .min(3, "Slug must be at least 3 chars")
    .regex(/^[a-zA-Z0-9-_]+$/, "Alphanumeric only")
    .optional()
    .or(z.literal("")),
  campaignName: z.string().optional(), // ✅ FIXED: Replaced campaignId with campaignName string
});

type LinkInput = z.infer<typeof linkSchema>;

const creativeJsonSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
  url: z.string(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  isActive: z.boolean()
});

const contestJsonSchema = z.object({
  id: z.string(),
  title: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  criteria: z.enum(["sales_amount", "referral_count"]),
  isActive: z.boolean(),
});

// ==========================================
// 2. INTERNAL HELPERS
// ==========================================
async function createLinkInternal(affiliateId: string, destinationUrl: string, customSlug?: string, campaignName?: string) {
  const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
  const config = (settings?.affiliateConfig as any) || {};
  
  const linkCount = await db.affiliateLink.count({ where: { affiliateId } });
  const limit = Number(config.slugLimit) || 10;
  
  if (linkCount >= limit) {
    throw new Error(`You have reached the limit of ${limit} custom links.`);
  }

  let slug = customSlug;

  if (slug) {
    if (config.customSlugsEnabled === false) { 
        throw new Error("Custom slugs are currently disabled.");
    }
    const existingLink = await db.affiliateLink.findUnique({ where: { slug } });
    const existingAffiliate = await db.affiliateAccount.findUnique({ where: { slug } });
    
    if (existingLink || existingAffiliate) {
      throw new Error("This alias is already taken. Please try another.");
    }
  } else {
    slug = nanoid(7); 
  }

  return await db.affiliateLink.create({
    data: {
      affiliateId,
      slug: slug!,
      destinationUrl,
      campaignName: campaignName || null, // ✅ FIXED: Saving direct string
      clickCount: 0
    }
  });
}

// ==========================================
// 3. READ SERVICES
// ==========================================

export async function getLinks(affiliateId: string) {
  const links = await db.affiliateLink.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" },
    select: { 
        id: true,
        slug: true,
        destinationUrl: true,
        clickCount: true,
        campaignName: true // ✅ FIXED
    }
  });

  // Map to match frontend expectations
  return links.map(l => ({
    id: l.id,
    slug: l.slug,
    destinationUrl: l.destinationUrl,
    clickCount: l.clickCount,
    campaign: l.campaignName ? { name: l.campaignName } : null // Mimic relation for UI
  }));
}

export async function getCreatives() {
  // ✅ FIXED: Fetching from JSON instead of deleted table
  const settings = await db.storeSettings.findUnique({
    where: { id: "settings" },
    select: { affiliateCreatives: true }
  });

  const parsed = z.array(creativeJsonSchema).safeParse(settings?.affiliateCreatives);
  if (!parsed.success) return [];

  return parsed.data
    .filter(c => c.isActive)
    .map(c => ({
        id: c.id,
        title: c.title,
        type: c.type,
        url: c.url,
        width: c.width || null,
        height: c.height || null
    }));
}

export async function getCampaigns(affiliateId: string) {
  // ✅ FIXED: Since Campaign table is gone, extract unique campaign names from links
  const links = await db.affiliateLink.findMany({
    where: { affiliateId, campaignName: { not: null } },
    select: { campaignName: true },
    distinct: ['campaignName']
  });

  return links
    .filter(l => l.campaignName)
    .map(l => ({
      id: l.campaignName!, // Using name as ID
      name: l.campaignName!
    }));
}

export async function getCoupons(affiliateId: string) {
  const coupons = await db.discount.findMany({
    where: { 
        affiliateId,
        isActive: true 
    },
    orderBy: { createdAt: "desc" },
    select: {
        id: true,
        code: true,
        type: true,
        value: true, 
        usedCount: true,
        usageLimit: true,
        endDate: true
    }
  });

  return coupons.map(c => ({
      id: c.id,
      code: c.code,
      discountType: c.type === "FIXED_AMOUNT" ? "FIXED" : "PERCENTAGE", 
      discountValue: c.value.toNumber(), 
      usageCount: c.usedCount,
      usageLimit: c.usageLimit,
      expiresAt: c.endDate
  }));
}

export async function getContestLeaderboard(contestId: string) {
  try {
    // ✅ FIXED: Fetch Contest info from JSON instead of deleted table
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateContests: true }
    });

    const parsed = z.array(contestJsonSchema).safeParse(settings?.affiliateContests);
    if (!parsed.success) return { success: false, message: "Contest config missing" };

    const contest = parsed.data.find(c => c.id === contestId);
    if (!contest) return { success: false, message: "Contest not found" };

    const startDate = new Date(contest.startDate);
    const endDate = new Date(contest.endDate);

    const leaderboardRaw = await db.referral.groupBy({
      by: ['affiliateId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { in: ["APPROVED", "PAID"] } 
      },
      _sum: { commissionAmount: true }, 
      _count: { id: true }, 
      orderBy: { _sum: { commissionAmount: 'desc' } },
      take: 10 
    });

    const affiliateIds = leaderboardRaw.map(l => l.affiliateId).filter(Boolean) as string[];
    
    if (affiliateIds.length === 0) {
        return { success: true, data: [] };
    }

    const affiliates = await db.affiliateAccount.findMany({
      where: { id: { in: affiliateIds } }, 
      select: {
        id: true,
        user: { select: { name: true, image: true } }
      }
    });

    const leaderboard = leaderboardRaw.map((entry, index) => {
      const affiliate = affiliates.find(a => a.id === entry.affiliateId);
      return {
        rank: index + 1,
        name: affiliate?.user.name || "Unknown Partner",
        avatar: affiliate?.user.image,
        score: entry._sum.commissionAmount || 0, 
        salesCount: entry._count.id || 0
      };
    });

    return { success: true, data: serializePrismaData(leaderboard) };

  } catch (error) {
    console.error("Leaderboard Error:", error);
    return { success: false, message: "Failed to load leaderboard" };
  }
}

// ==========================================
// 4. MUTATIONS (Server Actions)
// ==========================================

export async function generateLinkAction(data: LinkInput) {
  try {
    const affiliate = await getAuthAffiliate();

    const result = linkSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: result.error.issues[0].message };
    }

    await createLinkInternal(
      affiliate.id,
      result.data.destinationUrl,
      result.data.customSlug || undefined,
      result.data.campaignName || undefined // ✅ FIXED
    );

    revalidatePath("/affiliates?view=links");
    return { success: true, message: "Link generated successfully!" };

  } catch (error: any) {
    return { success: false, message: error.message || "Failed to generate link." };
  }
}