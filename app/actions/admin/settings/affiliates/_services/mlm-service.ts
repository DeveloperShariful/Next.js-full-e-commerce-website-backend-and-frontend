//File: app/actions/admin/settings/affiliates/_services/mlm-service.ts

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const mlmService = {
  async distributeMLMCommission(
    orderId: string, 
    directAffiliateId: string, 
    orderAmount: number
  ) {
    const configRaw = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true, mlmConfig: true }
    });
    
    const isMlmEnabled = true; 
    const maxLevels = 3;
    const rates: Record<string, number> = { "1": 10, "2": 5, "3": 2 }; 

    if (!isMlmEnabled) return;

    const upline = await this.getUpline(directAffiliateId, maxLevels);

    await db.$transaction(async (tx) => {
      
      for (const node of upline) {
        const level = node.level;
        const ratePercent = rates[level.toString()] || 0;
        
        if (ratePercent <= 0) continue;

        const commissionAmount = new Prisma.Decimal(orderAmount).mul(ratePercent).div(100);

        if (commissionAmount.lessThanOrEqualTo(0)) continue;

        await tx.affiliateAccount.update({
          where: { id: node.affiliateId },
          data: {
            balance: { increment: commissionAmount },
            totalEarnings: { increment: commissionAmount }
          }
        });

        await tx.affiliateLedger.create({
          data: {
            affiliateId: node.affiliateId,
            type: "COMMISSION",
            amount: commissionAmount,
            balanceBefore: new Prisma.Decimal(0), 
            balanceAfter: new Prisma.Decimal(0),  
            description: `Level ${level} Commission from Order #${orderId}`,
            referenceId: orderId
          }
        });

        await tx.referral.create({
          data: {
            affiliateId: node.affiliateId,
            orderId: orderId + `-L${level}`, 
            totalOrderAmount: new Prisma.Decimal(orderAmount),
            netOrderAmount: new Prisma.Decimal(orderAmount), 
            commissionAmount: commissionAmount,
            status: "APPROVED",
            commissionType: "PERCENTAGE",
            commissionRate: new Prisma.Decimal(ratePercent),
            isMlmReward: true,
            fromDownlineId: level === 1 ? null : directAffiliateId, 
            metadata: { level, sourceAffiliate: directAffiliateId }
          }
        });
      }
    });
  },

  async getUpline(startAffiliateId: string, maxLevels: number) {
    const tree = [];
    let currentId = startAffiliateId;
    let currentLevel = 1;

    let currentAffiliate = await db.affiliateAccount.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    });

    while (currentAffiliate?.parentId && currentLevel <= maxLevels) {
      tree.push({
        level: currentLevel,
        affiliateId: currentAffiliate.parentId
      });

      currentAffiliate = await db.affiliateAccount.findUnique({
        where: { id: currentAffiliate.parentId },
        select: { parentId: true }
      });

      currentLevel++;
    }

    return tree;
  },

  async updateConfig(config: { enabled: boolean; levels: Record<string, number> }) {
    return true;
  }
};