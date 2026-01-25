//app/actions/storefront/affiliates/_services/network-service.ts

import { db } from "@/lib/prisma";

export interface NetworkNode {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  totalSales: number;
  joinedAt: Date;
  children: NetworkNode[];
}

/**
 * SERVICE: MLM Network & Team Management
 */
export const networkService = {

  /**
   * Get Upline (Sponsor) Info
   */
  async getSponsor(affiliateId: string) {
    const me = await db.affiliateAccount.findUnique({
      where: { id: affiliateId },
      select: { parentId: true }
    });

    if (!me?.parentId) return null;

    return await db.affiliateAccount.findUnique({
      where: { id: me.parentId },
      select: {
        slug: true,
        user: { select: { name: true, email: true, image: true } }
      }
    });
  },

  /**
   * Get Downline Tree (Up to 3 Levels Deep for Performance)
   */
  async getNetworkTree(affiliateId: string): Promise<NetworkNode[]> {
    
    // Helper to fetch children recursively (Simulated up to 3 levels)
    // In a real enterprise app with millions of users, use a Recursive CTE (Raw SQL)
    
    const fetchChildren = async (parentId: string, currentLevel: number): Promise<NetworkNode[]> => {
      if (currentLevel > 3) return []; // Limit depth

      const children = await db.affiliateAccount.findMany({
        where: { parentId },
        include: {
          user: { select: { name: true, image: true } }
        }
      });

      const nodes: NetworkNode[] = [];

      for (const child of children) {
        // Fetch sub-children
        const grandChildren = await fetchChildren(child.id, currentLevel + 1);
        
        nodes.push({
          id: child.id,
          name: child.user.name || "Unknown Partner",
          avatar: child.user.image,
          level: currentLevel,
          totalSales: child.totalEarnings.toNumber(), // Showing their earnings as a proxy for performance
          joinedAt: child.createdAt,
          children: grandChildren
        });
      }

      return nodes;
    };

    return await fetchChildren(affiliateId, 1);
  },

  /**
   * Get Network Stats (Total Team Size)
   */
  async getNetworkStats(affiliateId: string) {
    // Simple Level 1 count
    const directRecruits = await db.affiliateAccount.count({
      where: { parentId: affiliateId }
    });

    // For total network size, we would typically use a pre-calculated field or recursive count
    // For now, we return Direct Recruits as the primary metric
    return {
      directRecruits,
      activePartners: directRecruits // Assuming all are active for now
    };
  }
};