//app/actions/admin/settings/affiliate/_services/pixel-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: TRACKING PIXELS
 * Manages 3rd party tracking scripts (FB, Google, TikTok) for affiliates.
 */
export const pixelService = {

  /**
   * Get All Pixels (Admin View)
   */
  async getAllPixels() {
    try {
      return await db.affiliatePixel.findMany({
        include: {
          affiliate: {
            select: {
              user: { select: { name: true, email: true } },
              slug: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } catch (error) {
      console.error("[PixelService] Fetch Error:", error);
      throw new Error("Failed to load pixels.");
    }
  },

  /**
   * Create Pixel (Usually called by Affiliate, but Admin can too)
   */
  async createPixel(data: Prisma.AffiliatePixelCreateInput) {
    // Validate: Ensure one pixel type per affiliate? (Optional rule)
    // For now, allow multiple.
    return await db.affiliatePixel.create({ data });
  },

  /**
   * Toggle Status (Enable/Disable)
   */
  async togglePixelStatus(id: string, isEnabled: boolean) {
    return await db.affiliatePixel.update({
      where: { id },
      data: { isEnabled }
    });
  },

  /**
   * Delete Pixel
   */
  async deletePixel(id: string) {
    return await db.affiliatePixel.delete({
      where: { id }
    });
  }
};