//File: app/actions/admin/settings/affiliate/_services/mlm-network-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCachedMLMConfig } from "@/lib/services/settings-cache";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { ActionResponse, NetworkNode } from "../types";
import { z } from "zod";
import { revalidatePath, unstable_cache } from "next/cache";
import { protectAction } from "../permission-service"; // ✅ Security

// ==============================================================================
// SECTION 1: MLM CORE ENGINE & CONFIGURATION (Merged from mlm-service.ts)
// ==============================================================================

const mlmSchema = z.object({
  isEnabled: z.boolean(),
  maxLevels: z.number().min(1).max(10),
  commissionBasis: z.enum(["SALES_AMOUNT", "PROFIT"]),
  levelRates: z.record(z.string(), z.number()),
});

/**
 * ✅ ENTERPRISE UPDATE: 
 * 1. Added `tx` (TransactionClient) to ensure ACID compliance inside orders.
 * 2. Uses optimized path-based lookup instead of recursive loops.
 */
export async function distributeMLMCommission(
  tx: Prisma.TransactionClient, // <--- Accepts transaction context
  orderId: string, 
  directAffiliateId: string, 
  orderBasisAmount: number | Prisma.Decimal,
  holdingPeriodDays: number
) {
  const config = await getCachedMLMConfig();
  
  if (!config.isEnabled) return;

  const baseAmount = DecimalMath.toDecimal(orderBasisAmount);
  if (DecimalMath.isZero(baseAmount)) return;

  // ✅ OPTIMIZATION: Using the new optimized getUpline function
  const upline = await getUpline(directAffiliateId, config.maxLevels);
  
  if (upline.length === 0) return;

  const availableDate = new Date();
  availableDate.setDate(availableDate.getDate() + holdingPeriodDays);

  for (const node of upline) {
    const levelKey = node.level.toString();
    const ratePercent = config.levelRates[levelKey] || 0;
    
    if (ratePercent <= 0) continue;

    const commissionAmount = DecimalMath.percent(baseAmount, ratePercent);

    if (DecimalMath.lte(commissionAmount, 0)) continue;

    // ✅ DATA INTEGRITY: Insert using the passed transaction client 'tx'
    await tx.referral.create({
      data: {
        affiliateId: node.affiliateId,
        orderId: orderId, // Non-unique in schema, allows multiple rows
        totalOrderAmount: baseAmount,
        netOrderAmount: baseAmount, 
        commissionAmount: commissionAmount,
        status: "PENDING",
        commissionType: "PERCENTAGE",
        commissionRate: new Prisma.Decimal(ratePercent),
        isMlmReward: true,
        fromDownlineId: node.level === 1 ? null : directAffiliateId, 
        availableAt: availableDate,
        metadata: { 
            level: node.level, 
            sourceAffiliate: directAffiliateId,
            type: "MLM_COMMISSION" 
        }
      }
    });
  }
}

/**
 * ✅ ENTERPRISE OPTIMIZATION:
 * Path-Based Ancestor Lookup (O(1) Query instead of O(N) Loops)
 */
export async function getUpline(startAffiliateId: string, maxLevels: number) {
  // 1. Fetch current user to get the 'mlmPath' string
  const startNode = await db.affiliateAccount.findUnique({
    where: { id: startAffiliateId },
    select: { mlmPath: true, parentId: true }
  });

  if (!startNode || !startNode.mlmPath) return [];

  // 2. Parse Path: "root.user1.user2"
  const pathIds = startNode.mlmPath.split('.');
  
  // We want ancestors in reverse order (closest parent first)
  const ancestorIds = pathIds.reverse().slice(0, maxLevels);

  if (ancestorIds.length === 0) return [];

  // 3. BULK FETCH: Get all valid/active ancestors in ONE database call
  const validAncestors = await db.affiliateAccount.findMany({
    where: {
      id: { in: ancestorIds },
      status: "ACTIVE" 
    },
    select: { id: true }
  });

  const validSet = new Set(validAncestors.map(a => a.id));

  const tree: { level: number; affiliateId: string }[] = [];

  // 4. Map back to levels
  for (let i = 0; i < ancestorIds.length; i++) {
    const id = ancestorIds[i];
    if (validSet.has(id)) {
        tree.push({
            level: i + 1,
            affiliateId: id
        });
    }
  }

  return tree;
}

// --- WRITE OPERATION: UPDATE CONFIG ---
export async function updateMlmConfigAction(data: z.infer<typeof mlmSchema>): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_NETWORK"); 

    const result = mlmSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };

    await db.affiliateMLMConfig.upsert({
      where: { id: "mlm_config" },
      create: {
        id: "mlm_config",
        isEnabled: result.data.isEnabled,
        maxLevels: result.data.maxLevels,
        commissionBasis: result.data.commissionBasis,
        levelRates: result.data.levelRates,
      },
      update: {
        isEnabled: result.data.isEnabled,
        maxLevels: result.data.maxLevels,
        commissionBasis: result.data.commissionBasis,
        levelRates: result.data.levelRates,
      }
    });

    revalidatePath("/admin/settings/affiliate/network");
    return { success: true, message: "Network settings saved." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save." };
  }
}

// ==============================================================================
// SECTION 2: NETWORK VISUALIZATION & STATS (Merged from network-service.ts)
// ==============================================================================

// --- READ OPERATION: GET MLM TREE (Cached) ---
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

// --- READ OPERATION: GET NODE STATS ---
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