// File: app/actions/admin/settings/affiliate/_services/network-service.ts

"use server";

import { db } from "@/lib/prisma";
import { NetworkNode } from "../types";
import { unstable_cache } from "next/cache";

// =========================================
// READ OPERATIONS (Cached)
// =========================================
export async function getMLMTree(rootAffiliateId?: string): Promise<NetworkNode[]> {
  return await unstable_cache(
    async () => {
      let pathFilter = {};
      
      if (rootAffiliateId) {
        const root = await db.affiliateAccount.findUnique({
          where: { id: rootAffiliateId },
          select: { mlmPath: true }
        });
        if (root?.mlmPath) {
          pathFilter = {
            mlmPath: { startsWith: root.mlmPath }
          };
        }
      }

      const affiliates = await db.affiliateAccount.findMany({
        where: { 
          status: "ACTIVE",
          ...pathFilter
        },
        select: {
          id: true,
          parentId: true,
          totalEarnings: true,
          tier: { select: { name: true } },
          user: { select: { name: true, image: true } },
          _count: { select: { downlines: true } }
        },
        take: 5000 // Safety Limit
      });

      const nodeMap = new Map<string, NetworkNode>();
      const tree: NetworkNode[] = [];

      // 1. Initialize Nodes
      affiliates.forEach(aff => {
        nodeMap.set(aff.id, {
          id: aff.id,
          name: aff.user.name || "Unknown",
          avatar: aff.user.image,
          tier: aff.tier?.name || "Standard",
          totalEarnings: aff.totalEarnings.toNumber(),
          directReferrals: aff._count.downlines,
          teamSize: 0,
          children: []
        });
      });

      // 2. Build Hierarchy
      affiliates.forEach(aff => {
        const node = nodeMap.get(aff.id)!;
        if (aff.parentId && nodeMap.has(aff.parentId)) {
          const parent = nodeMap.get(aff.parentId)!;
          parent.children!.push(node);
        } else {
          tree.push(node);
        }
      });

      // 3. Calculate Recursive Team Stats
      const calculateStats = (node: NetworkNode): number => {
        let size = 0;
        if (node.children) {
          for (const child of node.children) {
            size += 1 + calculateStats(child);
          }
        }
        node.teamSize = size;
        return size;
      };

      tree.forEach(root => calculateStats(root));

      return tree;
    },
    [`network-tree-${rootAffiliateId || 'global'}`],
    { tags: ["affiliate-network"], revalidate: 300 }
  )();
}

export async function getNodeStats(affiliateId: string) {
  const [referralStats, downlineCount, wallet] = await Promise.all([
    db.referral.aggregate({
      where: { affiliateId, status: "PAID" },
      _sum: { totalOrderAmount: true, commissionAmount: true },
      _count: { id: true }
    }),
    db.affiliateAccount.count({
      where: { mlmPath: { contains: affiliateId }, id: { not: affiliateId } }
    }),
    db.wallet.findUnique({ where: { userId: affiliateId }, select: { balance: true } })
  ]);

  return {
    totalSales: referralStats._sum.totalOrderAmount?.toNumber() || 0,
    totalCommission: referralStats._sum.commissionAmount?.toNumber() || 0,
    conversionCount: referralStats._count.id || 0,
    activeDownlines: downlineCount,
    walletBalance: wallet?.balance.toNumber() || 0
  };
}