// File: app/actions/admin/settings/affiliate/cron-service.ts

"use server";

import { db } from "@/lib/prisma";
import { auditService } from "@/lib/services/audit-service";
import { sendNotification } from "@/app/api/email/send-notification";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { updateRiskScore } from "./_services/fraud-service";

export async function processDailyJobs() {
  try {
    await processPendingReferrals();
    await runTierUpgrades();
    await runFraudAnalysis();
    return { success: true };
  } catch (error: any) {
    await auditService.systemLog("CRITICAL", "CRON_MANAGER", "Daily Job Failed", { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function processPendingReferrals() {
  const now = new Date();

  const readyReferrals = await db.referral.findMany({
    where: {
      status: "PENDING",
      availableAt: { lte: now }
    },
    take: 100 
  });

  for (const ref of readyReferrals) {
    try {
      await db.$transaction(async (tx) => {
        const affiliate = await tx.affiliateAccount.findUnique({
          where: { id: ref.affiliateId }
        });

        if (!affiliate) throw new Error("Affiliate not found during cron processing");

        const balanceBefore = affiliate.balance;
        const balanceAfter = DecimalMath.add(affiliate.balance, ref.commissionAmount);

        await tx.referral.update({
          where: { id: ref.id },
          data: { status: "APPROVED" }
        });

        await tx.affiliateAccount.update({
          where: { id: ref.affiliateId },
          data: {
            balance: { increment: ref.commissionAmount },
            totalEarnings: { increment: ref.commissionAmount }
          }
        });

        await tx.affiliateLedger.create({
          data: {
            affiliateId: ref.affiliateId,
            type: "COMMISSION",
            amount: ref.commissionAmount,
            balanceBefore: balanceBefore, 
            balanceAfter: balanceAfter,   
            description: ref.isMlmReward ? `MLM Reward Released: #${ref.orderId}` : `Commission Released: #${ref.orderId}`,
            referenceId: ref.id
          }
        });
      });

      const affiliate = await db.affiliateAccount.findUnique({
          where: { id: ref.affiliateId },
          include: { user: true }
      });

      if (affiliate) {
           await sendNotification({
              trigger: "COMMISSION_APPROVED",
              recipient: affiliate.user.email,
              data: {
                  amount: ref.commissionAmount.toString(),
                  order_id: ref.orderId
              },
              userId: affiliate.userId
           });
      }
      
    } catch (err: any) {
      await auditService.systemLog("ERROR", "CRON_REFERRAL", `Failed to release ID ${ref.id}`, { error: err.message });
    }
  }
}

export async function runTierUpgrades() {
  const tiers = await db.affiliateTier.findMany({ orderBy: { minSalesAmount: 'desc' } });
  const affiliates = await db.affiliateAccount.findMany({
    where: { status: "ACTIVE" },
    include: { tier: true, user: true }
  });

  for (const affiliate of affiliates) {
    const earnings = affiliate.totalEarnings.toNumber();
    const salesCount = await db.referral.count({ where: { affiliateId: affiliate.id, status: "PAID" } });
    const eligibleTier = tiers.find(t => earnings >= t.minSalesAmount.toNumber() && salesCount >= t.minSalesCount);

    if (eligibleTier && eligibleTier.id !== affiliate.tierId) {
      const currentReq = affiliate.tier?.minSalesAmount.toNumber() || 0;
      if (eligibleTier.minSalesAmount.toNumber() > currentReq) {
        await db.affiliateAccount.update({ where: { id: affiliate.id }, data: { tierId: eligibleTier.id } });
        
        await sendNotification({
          trigger: "TIER_UPGRADED",
          recipient: affiliate.user.email,
          data: { affiliate_name: affiliate.user.name, tier_name: eligibleTier.name },
          userId: affiliate.userId
        });
      }
    }
  }
}

export async function runFraudAnalysis() {
  const activeAffiliates = await db.affiliateClick.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { affiliateId: true },
    distinct: ['affiliateId']
  });
  for (const item of activeAffiliates) {
    await updateRiskScore(item.affiliateId);
  }
}