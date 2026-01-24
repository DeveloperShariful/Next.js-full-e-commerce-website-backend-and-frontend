// File: app/actions/admin/settings/affiliate/_services/creative-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: Affiliate Creatives
 * Manages Banners, Social Media Assets, and Links for affiliates to share.
 */
export const creativeService = {
  
  /**
   * Get all creatives (Recent first)
   */
  async getAllCreatives() {
    try {
      return await db.affiliateCreative.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("[CreativeService] Fetch Error:", error);
      throw new Error("Failed to load creatives.");
    }
  },

  /**
   * Create new Creative Asset
   */
  async createCreative(data: Prisma.AffiliateCreativeCreateInput) {
    return await db.affiliateCreative.create({ data });
  },

  /**
   * Update existing Creative
   */
  async updateCreative(id: string, data: Prisma.AffiliateCreativeUpdateInput) {
    return await db.affiliateCreative.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete Creative
   */
  async deleteCreative(id: string) {
    return await db.affiliateCreative.delete({
      where: { id },
    });
  },
};