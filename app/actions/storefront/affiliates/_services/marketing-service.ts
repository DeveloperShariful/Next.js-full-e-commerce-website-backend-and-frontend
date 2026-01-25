//app/actions/storefront/affiliates/_services/marketing-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

/**
 * SERVICE: Marketing Tools (Links, Creatives)
 */
export const marketingService = {

  /**
   * Get Existing Links for an Affiliate
   */
  async getLinks(affiliateId: string) {
    return await db.affiliateLink.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { name: true } }
      }
    });
  },

  /**
   * Generate or Create a Short Link
   */
  async createLink(affiliateId: string, destinationUrl: string, customSlug?: string, campaignId?: string) {
    // 1. Get Global Settings to check limits
    const settings = await db.storeSettings.findUnique({ where: { id: "settings" } });
    const config = (settings?.affiliateConfig as any) || {};
    
    // Check Slug Limit if needed
    const linkCount = await db.affiliateLink.count({ where: { affiliateId } });
    const limit = Number(config.slugLimit) || 10;
    
    if (linkCount >= limit) {
      throw new Error(`You have reached the limit of ${limit} custom links.`);
    }

    let slug = customSlug;

    // 2. Validate or Generate Slug
    if (slug) {
      // Check availability
      const existing = await db.affiliateLink.findUnique({ where: { slug } });
      const affiliateSlug = await db.affiliateAccount.findUnique({ where: { slug } });
      
      if (existing || affiliateSlug) {
        throw new Error("This alias is already taken. Please try another.");
      }
    } else {
      // Generate random unique slug
      slug = nanoid(7); 
    }

    // 3. Create Link
    return await db.affiliateLink.create({
      data: {
        affiliateId,
        slug: slug!,
        destinationUrl,
        campaignId: campaignId || null,
        clickCount: 0
      }
    });
  },

  /**
   * Get Active Creatives (Banners)
   */
  async getCreatives() {
    return await db.affiliateCreative.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });
  },

  /**
   * Get Available Campaigns (For dropdown selection)
   */
  async getCampaigns(affiliateId: string) {
    return await db.affiliateCampaign.findMany({
      where: { affiliateId },
      select: { id: true, name: true }
    });
  }
};