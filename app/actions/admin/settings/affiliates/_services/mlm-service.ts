// File: app/actions/admin/settings/affiliate/_services/mlm-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCachedMLMConfig } from "@/lib/services/settings-cache";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { ActionResponse } from "../types";
import { z } from "zod";
import { syncUser } from "@/lib/auth-sync";
import { revalidatePath } from "next/cache";

const mlmSchema = z.object({
  isEnabled: z.boolean(),
  maxLevels: z.number().min(1).max(10),
  commissionBasis: z.enum(["SALES_AMOUNT", "PROFIT"]),
  levelRates: z.record(z.string(), z.number()),
});

export async function distributeMLMCommission(
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

  await db.$transaction(async (tx) => {
    
    for (const node of upline) {
      const levelKey = node.level.toString();
      const ratePercent = config.levelRates[levelKey] || 0;
      
      if (ratePercent <= 0) continue;

      const commissionAmount = DecimalMath.percent(baseAmount, ratePercent);

      if (DecimalMath.lte(commissionAmount, 0)) continue;

      const uplineAffiliate = await tx.affiliateAccount.findUnique({
          where: { id: node.affiliateId }
      });

      if (!uplineAffiliate || uplineAffiliate.status !== "ACTIVE") continue;

      await tx.referral.create({
        data: {
          affiliateId: node.affiliateId,
          orderId: orderId + `-MLM-L${node.level}`, 
          totalOrderAmount: baseAmount,
          netOrderAmount: baseAmount, 
          commissionAmount: commissionAmount,
          status: "PENDING",
          commissionType: "PERCENTAGE",
          commissionRate: new Prisma.Decimal(ratePercent),
          isMlmReward: true,
          fromDownlineId: node.level === 1 ? null : directAffiliateId, 
          availableAt: availableDate,
          metadata: { level: node.level, sourceAffiliate: directAffiliateId }
        }
      });
    }
  });
}

export async function getUpline(startAffiliateId: string, maxLevels: number) {
  const tree: { level: number; affiliateId: string }[] = [];
  let currentId = startAffiliateId;
  let currentLevel = 1;

  while (currentLevel <= maxLevels) {
    const currentAffiliate = await db.affiliateAccount.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });

    if (!currentAffiliate || !currentAffiliate.parentId) break;

    tree.push({
      level: currentLevel,
      affiliateId: currentAffiliate.parentId
    });

    currentId = currentAffiliate.parentId;
    currentLevel++;
  }

  return tree;
}

export async function updateMlmConfigAction(data: z.infer<typeof mlmSchema>): Promise<ActionResponse> {
  try {
    const user = await syncUser();
    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
        return { success: false, message: "Unauthorized." };
    }

    const result = mlmSchema.safeParse(data);
    if (!result.success) {
      return { success: false, message: "Validation failed." };
    }

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

    revalidatePath("/admin/settings/affiliate/mlm-configuration");
    return { success: true, message: "Network settings saved." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to save." };
  }
}