//app/actions/storefront/affiliates/_services/marketing-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getAuthAffiliate } from "../auth-helper"; 

// ==========================================
// 1. VALIDATION SCHEMAS
// ==========================================
const linkSchema = z.object({
  destinationUrl: z.string().url("Please enter a valid URL (e.g. https://gobike.au/product/1)"),
  customSlug: z.string()
    .min(3, "Slug must be at least 3 chars")
    .regex(/^[a-zA-Z0-9-_]+$/, "Alphanumeric only")
    .optional()
    .or(z.literal("")),
  campaignId: z.string().optional(),
});

type LinkInput = z.infer<typeof linkSchema>;

// ==========================================
// 2. INTERNAL HELPERS
// ==========================================
async function createLinkInternal(affiliateId: string, destinationUrl: string, customSlug?: string, campaignId?: string) {
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
      campaignId: campaignId || null,
      clickCount: 0
    }
  });
}

// ==========================================
// 3. READ SERVICES
// ==========================================

export async function getLinks(affiliateId: string) {
  return await db.affiliateLink.findMany({
    where: { affiliateId },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: { select: { name: true } }
    }
  });
}

export async function getCreatives() {
  return await db.affiliateCreative.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function getCampaigns(affiliateId: string) {
  return await db.affiliateCampaign.findMany({
    where: { affiliateId },
    select: { id: true, name: true }
  });
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
      result.data.campaignId || undefined
    );

    revalidatePath("/affiliates/marketing/links");
    return { success: true, message: "Link generated successfully!" };

  } catch (error: any) {
    return { success: false, message: error.message || "Failed to generate link." };
  }
}