//app/actions/storefront/affiliates/_services/network-service.ts

"use server"; // ✅ MUST BE AT THE TOP

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

// ==========================================
// READ SERVICES (Named Exports)
// ==========================================

/**
 * Get Upline (Sponsor) Info
 */
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

/**
 * Get Downline Tree (Up to 3 Levels Deep for Performance)
 */
export async function getNetworkTree(affiliateId: string): Promise<NetworkNode[]> {
  
  // Helper to fetch children recursively
  const fetchChildren = async (parentId: string, currentLevel: number): Promise<NetworkNode[]> => {
    if (currentLevel > 3) return []; // Enterprise Limit: Depth control

    const children = await db.affiliateAccount.findMany({
      where: { parentId },
      include: {
        user: { select: { name: true, image: true } }
      }
    });

    const nodes: NetworkNode[] = [];

    for (const child of children) {
      // Recursion
      const grandChildren = await fetchChildren(child.id, currentLevel + 1);
      
      nodes.push({
        id: child.id,
        name: child.user.name || "Unknown Partner",
        avatar: child.user.image,
        level: currentLevel,
        totalSales: child.totalEarnings.toNumber(), // Performance Indicator
        joinedAt: child.createdAt,
        children: grandChildren
      });
    }

    return nodes;
  };

  return await fetchChildren(affiliateId, 1);
}

/**
 * Get Network Stats (Total Team Size)
 */
export async function getNetworkStats(affiliateId: string) {
  // Level 1 count (Direct Recruits)
  const directRecruits = await db.affiliateAccount.count({
    where: { parentId: affiliateId }
  });

  // Total Downline Count (Recursive is expensive, keeping simple for dashboard)
  return {
    directRecruits,
    activePartners: directRecruits // Placeholder for activity logic
  };
}