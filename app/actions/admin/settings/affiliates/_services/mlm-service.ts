// File: app/actions/admin/settings/affiliate/_services/mlm-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCachedMLMConfig } from "@/lib/services/settings-cache";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { ActionResponse } from "../types";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { protectAction } from "../permission-service"; 
const mlmSchema = z.object({
  isEnabled: z.boolean(),
  maxLevels: z.number().min(1).max(10),
  commissionBasis: z.enum(["SALES_AMOUNT", "PROFIT"]),
  levelRates: z.record(z.string(), z.number()),
});

// =========================================
// INTERNAL ENGINE (Triggered by System)
// =========================================

export async function distributeMLMCommission(
  tx: Prisma.TransactionClient, 
  orderId: string, 
  directAffiliateId: string, 
  orderBasisAmount: number | Prisma.Decimal,
  holdingPeriodDays: number
) {
  const config = await getCachedMLMConfig();
  
  if (!config.isEnabled) return;

  const baseAmount = DecimalMath.toDecimal(orderBasisAmount);
  if (DecimalMath.isZero(baseAmount)) return;
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

    await tx.referral.create({
      data: {
        affiliateId: node.affiliateId,
        orderId: orderId, 
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
export async function getUpline(startAffiliateId: string, maxLevels: number) {
  const startNode = await db.affiliateAccount.findUnique({
    where: { id: startAffiliateId },
    select: { mlmPath: true, parentId: true }
  });

  if (!startNode || !startNode.mlmPath) return [];
  const pathIds = startNode.mlmPath.split('.');
  const ancestorIds = pathIds.reverse().slice(0, maxLevels);

  if (ancestorIds.length === 0) return [];

  const validAncestors = await db.affiliateAccount.findMany({
    where: {
      id: { in: ancestorIds },
      status: "ACTIVE" 
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
// WRITE OPERATIONS (Admin Config)
// =========================================

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