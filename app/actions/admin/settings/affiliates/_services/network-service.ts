//app/actions/admin/settings/affiliate/_services/network-service.ts

import { db } from "@/lib/prisma";
import { NetworkNode } from "../types";

/**
 * SERVICE LAYER: MLM NETWORK & TEAM VISUALIZATION
 * Handles hierarchical data processing for the Network View.
 */
export const networkService = {

  /**
   * Get Full Network Tree
   * Uses optimized fetching: Get all flat data first, then build tree in memory.
   * This is much faster than recursive DB queries for < 10,000 users.
   */
  async getMLMTree(rootAffiliateId?: string): Promise<NetworkNode[]> {
    try {
      // 1. Fetch relevant fields for all active affiliates
      // If rootAffiliateId is provided, we could filter by path (if using materialized paths),
      // but here we fetch all and filter in memory for flexibility.
      const allAffiliates = await db.affiliateAccount.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          parentId: true,
          totalEarnings: true,
          user: {
            select: {
              name: true,
              image: true,
            }
          },
          tier: {
            select: { name: true }
          },
          _count: {
            select: { downlines: true } // Direct children count
          }
        }
      });

      // 2. Map to Node Structure
      const nodesMap = new Map<string, NetworkNode>();
      
      allAffiliates.forEach(aff => {
        nodesMap.set(aff.id, {
          id: aff.id,
          name: aff.user.name || "Unknown",
          avatar: aff.user.image,
          tier: aff.tier?.name || "Default",
          totalEarnings: aff.totalEarnings.toNumber(),
          directReferrals: aff._count.downlines,
          teamSize: 0, // Will calculate next
          children: []
        });
      });

      // 3. Build Tree & Calculate Team Size
      const rootNodes: NetworkNode[] = [];

      // Pass 1: Assign Children
      allAffiliates.forEach(aff => {
        const node = nodesMap.get(aff.id);
        if (!node) return;

        if (aff.parentId && nodesMap.has(aff.parentId)) {
          const parent = nodesMap.get(aff.parentId);
          parent!.children!.push(node);
        } else {
          // If no parent, or looking for specific root
          if (!rootAffiliateId || aff.id === rootAffiliateId) {
            rootNodes.push(node);
          }
        }
      });

      // Pass 2: Calculate Total Team Size (Recursive)
      // We iterate from root nodes down
      const calculateTeamSize = (node: NetworkNode): number => {
        let size = node.directReferrals; // Start with direct
        
        if (node.children && node.children.length > 0) {
           node.children.forEach(child => {
             // Add child's full team size to parent (excluding the child itself from 'team size' logic usually, 
             // but here we count every node below. Let's count child + child's team)
             size += 1 + calculateTeamSize(child);
           });
        }
        
        node.teamSize = size;
        return size; // Return pure downline count
      };

      rootNodes.forEach(root => calculateTeamSize(root));

      // 4. If a specific root was requested, return just that tree, otherwise all top-level trees
      return rootNodes;

    } catch (error) {
      console.error("[NetworkService] Tree Build Error:", error);
      throw new Error("Failed to load network tree.");
    }
  },

  /**
   * Get specific stats for a node (Sidebar details in Network View)
   */
  async getNodeStats(affiliateId: string) {
    const stats = await db.referral.aggregate({
        where: { affiliateId: affiliateId },
        _sum: { totalOrderAmount: true, commissionAmount: true },
        _count: { id: true }
    });

    const activeDownlines = await db.affiliateAccount.count({
        where: { parentId: affiliateId, status: "ACTIVE" }
    });

    return {
        totalSales: stats._sum.totalOrderAmount?.toNumber() || 0,
        totalCommission: stats._sum.commissionAmount?.toNumber() || 0,
        conversionCount: stats._count.id,
        activeDownlines
    };
  }
};