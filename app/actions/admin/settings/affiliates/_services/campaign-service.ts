//app/actions/admin/settings/affiliate/_services/campaign-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * SERVICE LAYER: CAMPAIGN MANAGEMENT
 * Monitors affiliate-created marketing campaigns (e.g. "Black Friday Links").
 */
export const campaignService = {

  /**
   * Get All Campaigns with Performance Stats
   */
  async getAllCampaigns(page: number = 1, limit: number = 20, search?: string) {
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
        orderBy: { revenue: "desc" }, // High revenue campaigns first
        include: {
          affiliate: {
            select: {
              slug: true,
              user: { select: { name: true, image: true, email: true } }
            }
          },
          _count: {
            select: { links: true } // How many specific links in this campaign
          }
        }
      })
    ]);

    return { 
      campaigns: data, 
      total, 
      totalPages: Math.ceil(total / limit) 
    };
  },

  /**
   * Delete a Campaign (Moderation)
   */
  async deleteCampaign(id: string) {
    return await db.affiliateCampaign.delete({
      where: { id }
    });
  }
};