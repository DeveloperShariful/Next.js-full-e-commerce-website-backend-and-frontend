// app/actions/storefront/affiliates/_services/network-service.ts

"use server";

import { db } from "@/lib/prisma";
import { getCachedMLMConfig } from "@/lib/settings-cache"; // ✅ FIXED: Importing the cached JSON config

export interface NetworkNode {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  totalSales: number;
  joinedAt: Date;
  children: NetworkNode[];
}

export async function getSponsor(affiliateId: string) {
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
}

export async function getNetworkTree(affiliateId: string): Promise<NetworkNode[]> {
  // ✅ FIXED: Fetch MLM limits from JSON instead of deleted DB Table
  const config = await getCachedMLMConfig();
  const MAX_DEPTH = config?.isEnabled ? (config.maxLevels || 3) : 0;
  
  const fetchChildren = async (parentId: string, currentLevel: number): Promise<NetworkNode[]> => {
    if (currentLevel > MAX_DEPTH) return []; 

    const children = await db.affiliateAccount.findMany({
      where: { parentId, deletedAt: null },
      include: {
        user: { select: { name: true, image: true } }
      }
    });

    const nodes: NetworkNode[] = [];

    for (const child of children) {
      const grandChildren = await fetchChildren(child.id, currentLevel + 1);
      
      nodes.push({
        id: child.id,
        name: child.user.name || "Unknown Partner",
        avatar: child.user.image,
        level: currentLevel,
        totalSales: child.totalEarnings.toNumber(),
        joinedAt: child.createdAt,
        children: grandChildren
      });
    }

    return nodes;
  };

  return await fetchChildren(affiliateId, 1);
}

export async function getNetworkStats(affiliateId: string) {
  const directRecruits = await db.affiliateAccount.count({
    where: { parentId: affiliateId, deletedAt: null }
  });
  
  return {
    directRecruits,
    activePartners: directRecruits 
  };
}