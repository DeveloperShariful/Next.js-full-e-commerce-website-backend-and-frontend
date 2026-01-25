// File: app/actions/admin/settings/affiliate/_services/tier-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: Affiliate Tiers (MLM Structure)
 * Handles CRUD operations for affiliate levels (e.g., Silver, Gold, Platinum).
 */
export const tierService = {
  
  /**
   * Get all tiers ordered by commission rate (Ascending)
   */
  async getAllTiers() {
    try {
      return await db.affiliateTier.findMany({
        orderBy: { minSalesAmount: "asc" },
        include: {
          _count: {
            select: { affiliates: true }, // Count how many users are in this tier
          },
        },
      });
    } catch (error) {
      console.error("[TierService] Fetch Error:", error);
      throw new Error("Failed to fetch affiliate tiers.");
    }
  },

  /**
   * Create a new Tier
   */
  async createTier(data: Prisma.AffiliateTierCreateInput) {
    try {
      // Check for duplicate name
      const existing = await db.affiliateTier.findUnique({
        where: { name: data.name },
      });
      if (existing) throw new Error("A tier with this name already exists.");

      return await db.affiliateTier.create({ data });
    } catch (error) {
      console.error("[TierService] Create Error:", error);
      throw error; // Re-throw to be caught by mutation
    }
  },

  /**
   * Update existing Tier
   */
  async updateTier(id: string, data: Prisma.AffiliateTierUpdateInput) {
    try {
      return await db.affiliateTier.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error("[TierService] Update Error:", error);
      throw new Error("Failed to update tier.");
    }
  },

  /**
   * Delete Tier
   * Note: We should verify if affiliates are using this tier before deleting.
   */
  async deleteTier(id: string) {
    try {
      // Check usage
      const usageCount = await db.affiliateAccount.count({
        where: { tierId: id },
      });

      if (usageCount > 0) {
        throw new Error(`Cannot delete tier. It is assigned to ${usageCount} affiliates.`);
      }

      return await db.affiliateTier.delete({
        where: { id },
      });
    } catch (error) {
      console.error("[TierService] Delete Error:", error);
      throw error;
    }
  },
};