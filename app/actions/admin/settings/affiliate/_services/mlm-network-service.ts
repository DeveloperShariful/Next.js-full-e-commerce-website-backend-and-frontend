// File: app/actions/admin/settings/affiliate/_services/mlm-network-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma, MLMBasis } from "@prisma/client";
import { getCachedMLMConfig } from "@/lib/settings-cache";
import { DecimalMath } from "@/lib/decimal-math";
import { ActionResponse, NetworkNode } from "../types";
import { z } from "zod";
import { revalidatePath, unstable_cache } from "next/cache";
import { protectAction } from "../permission-service";
import { auditService } from "@/lib/audit-service";

const mlmSchema = z.object({
  isEnabled: z.boolean(),
  maxLevels: z.number().min(1).max(10),
  commissionBasis: z.nativeEnum(MLMBasis),
  levelRates: z.record(z.string(), z.number()),
});

// =========================================
// CORE ENGINE: CALCULATE & DISTRIBUTE
// =========================================

export async function distributeMLMCommission(
  tx: Prisma.TransactionClient,
  orderId: string,
  directAffiliateId: string,
  salesAmount: number | Prisma.Decimal,
  profitAmount: number | Prisma.Decimal,
  holdingPeriodDays: number
) {
  const config = await getCachedMLMConfig();

  if (!config.isEnabled) return;
  let baseAmount = new Prisma.Decimal(0);
  if (config.commissionBasis === MLMBasis.PROFIT) {
    baseAmount = DecimalMath.toDecimal(profitAmount);
  } else {
    baseAmount = DecimalMath.toDecimal(salesAmount);
  }

  if (DecimalMath.lte(baseAmount, 0)) return;
  const upline = await getUpline(directAffiliateId, config.maxLevels);

  if (upline.length === 0) return;

  const availableDate = new Date();
  availableDate.setDate(availableDate.getDate() + holdingPeriodDays);

  for (const node of upline) {
    const levelKey = node.level.toString();
    const rates = config.levelRates as Record<string, number>;
    const ratePercent = rates[levelKey] || 0;

    if (ratePercent <= 0) continue;

    const commissionAmount = DecimalMath.percent(baseAmount, ratePercent);

    if (DecimalMath.lte(commissionAmount, 0)) continue;

    await tx.referral.create({
      data: {
        affiliateId: node.affiliateId,
        orderId: orderId,
        totalOrderAmount: DecimalMath.toDecimal(salesAmount),
        netOrderAmount: baseAmount,
        commissionAmount: commissionAmount,
        status: "PENDING",
        commissionType: "PERCENTAGE",
        commissionRate: new Prisma.Decimal(ratePercent),
        isMlmReward: true,
        isRecurring: false,
        fromDownlineId: node.level === 1 ? null : directAffiliateId,
        availableAt: availableDate,
        metadata: {
          level: node.level,
          sourceAffiliate: directAffiliateId,
          basis: config.commissionBasis,
          type: "MLM_COMMISSION"
        }
      }
    });
  }
}

export async function getUpline(startAffiliateId: string, maxLevels: number) {
  const startNode = await db.affiliateAccount.findFirst({
    where: { id: startAffiliateId, deletedAt: null }, 
    select: { mlmPath: true, parentId: true }
  });

  if (!startNode || !startNode.mlmPath) return [];
  const pathIds = startNode.mlmPath.split('.');
  const ancestorIds = pathIds.filter(id => id !== startAffiliateId).reverse().slice(0, maxLevels);

  if (ancestorIds.length === 0) return [];
  const validAncestors = await db.affiliateAccount.findMany({
    where: {
      id: { in: ancestorIds },
      status: "ACTIVE",
      deletedAt: null 
    },
    select: { id: true }
  });

  const validSet = new Set(validAncestors.map(a => a.id));
  const tree: { level: number; affiliateId: string }[] = [];

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

// =========================================
// CONFIGURATION ACTIONS
// =========================================

export async function updateMlmConfigAction(data: z.infer<typeof mlmSchema>): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_NETWORK");

    const result = mlmSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Validation failed." };

    const levelRatesJson = result.data.levelRates as Prisma.JsonObject;

    await db.affiliateMLMConfig.upsert({
      where: { id: "mlm_config" },
      create: {
        id: "mlm_config",
        isEnabled: result.data.isEnabled,
        maxLevels: result.data.maxLevels,
        commissionBasis: result.data.commissionBasis,
        levelRates: levelRatesJson,
      },
      update: {
        isEnabled: result.data.isEnabled,
        maxLevels: result.data.maxLevels,
        commissionBasis: result.data.commissionBasis,
        levelRates: levelRatesJson,
      }
    });

    await auditService.log({
        userId: actor.id,
        action: "UPDATE_MLM_CONFIG",
        entity: "AffiliateMLMConfig",
        entityId: "mlm_config",
        newData: result.data
    });

    revalidatePath("/admin/settings/affiliate/network");
    return { success: true, message: "Network settings saved." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save." };
  }
}

// =========================================
// TREE VISUALIZATION (READ)
// =========================================

export async function getMLMTree(rootAffiliateId?: string): Promise<NetworkNode[]> {
  const cacheKey = `network-tree-${rootAffiliateId || 'global'}`;

  return await unstable_cache(
    async () => {
      let pathFilter = {};

      if (rootAffiliateId) {
        const root = await db.affiliateAccount.findFirst({
          where: { id: rootAffiliateId, deletedAt: null },
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
          deletedAt: null, 
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
        take: 500
      });

      const nodeMap = new Map<string, NetworkNode>();
      const tree: NetworkNode[] = [];

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

      affiliates.forEach(aff => {
        const node = nodeMap.get(aff.id)!;
        if (aff.parentId && nodeMap.has(aff.parentId)) {
          const parent = nodeMap.get(aff.parentId)!;
          parent.children!.push(node);
        } else {
          tree.push(node);
        }
      });

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
    [cacheKey],
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
      where: { mlmPath: { contains: affiliateId }, id: { not: affiliateId }, deletedAt: null }
    }),
    db.wallet.findUnique({ where: { userId: affiliateId } })
  ]);

  return {
    totalSales: referralStats._sum.totalOrderAmount?.toNumber() || 0,
    totalCommission: referralStats._sum.commissionAmount?.toNumber() || 0,
    conversionCount: referralStats._count.id || 0,
    activeDownlines: downlineCount,
    walletBalance: wallet?.balance.toNumber() || 0
  };
}