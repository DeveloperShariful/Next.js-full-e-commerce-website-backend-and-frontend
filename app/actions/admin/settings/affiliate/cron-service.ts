// File: app/actions/admin/settings/affiliate/cron-service.ts

"use server";

import { db } from "@/lib/prisma";
import { auditService } from "@/lib/services/audit-service";
import { DecimalMath } from "@/lib/utils/decimal-math";
import { updateRiskScore } from "./_services/fraud-service";

const BATCH_SIZE = Number(process.env.AFFILIATE_CRON_BATCH_SIZE) || 100;

export async function processDailyJobs() {
  try {
    console.log("⏳ Starting Enterprise Cron Jobs...");
    
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
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" } 
  });

  if (readyReferrals.length === 0) return;

  const results = await Promise.allSettled(readyReferrals.map(async (ref) => {
    return await db.$transaction(async (tx) => {
        
        const affiliate = await tx.affiliateAccount.findFirst({
            where: { 
                id: ref.affiliateId, 
                deletedAt: null 
            }
        });

        if (!affiliate) {
            await tx.referral.update({
                where: { id: ref.id },
                data: { 
                    status: "REJECTED", 
                    adminNote: "System Auto-Reject: Affiliate Account Deleted" 
                }
            });
            throw new Error(`Affiliate ${ref.affiliateId} not found or deleted`);
        }

        const updatedAffiliate = await tx.affiliateAccount.update({
          where: { id: affiliate.id },
          data: {
            balance: { increment: ref.commissionAmount },
            totalEarnings: { increment: ref.commissionAmount }
          }
        });

        await tx.referral.update({
          where: { id: ref.id },
          data: { 
              status: "APPROVED",
              paidAt: new Date()
          }
        });

        await tx.affiliateLedger.create({
          data: {
            affiliateId: ref.affiliateId,
            type: "COMMISSION",
            amount: ref.commissionAmount,
            balanceBefore: DecimalMath.sub(updatedAffiliate.balance, ref.commissionAmount), 
            balanceAfter: updatedAffiliate.balance,    
            description: ref.isMlmReward ? `MLM Reward Released: #${ref.orderId}` : `Commission Released: #${ref.orderId}`,
            referenceId: `REL-${ref.id}` 
          }
        });

        const user = await tx.user.findUnique({ where: { id: affiliate.userId } });
        if (user?.email) {
            await tx.notificationQueue.create({
                data: {
                    channel: "EMAIL",
                    recipient: user.email,
                    templateSlug: "COMMISSION_APPROVED",
                    status: "PENDING",
                    userId: affiliate.userId,
                    content: "",
                    metadata: {
                        amount: ref.commissionAmount.toString(),
                        order_id: ref.orderId
                    }
                }
            });
        }

        return { refId: ref.id, status: "PROCESSED" };
    });
  }));

  const failed = results.filter(r => r.status === "rejected");
  if (failed.length > 0) {
      await auditService.systemLog("ERROR", "CRON_REFERRAL", `Failed to release ${failed.length} referrals`, { 
        errors: failed.map((f:any) => f.reason?.message).slice(0, 5) 
      });
  }
}

export async function runTierUpgrades() {
  const tiers = await db.affiliateTier.findMany({ orderBy: { minSalesAmount: 'desc' } });
  
  for (const targetTier of tiers) {
    if (targetTier.minSalesAmount.toNumber() === 0 && targetTier.minSalesCount === 0) continue;
    const eligibleAffiliates = await db.affiliateAccount.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null, 
        tierId: { not: targetTier.id }, 
        totalEarnings: { gte: targetTier.minSalesAmount }, 
      },
      select: { id: true, userId: true, tierId: true, user: { select: { email: true, name: true } } },
      take: BATCH_SIZE 
    });

    for (const affiliate of eligibleAffiliates) {
       try {
           const salesCount = await db.referral.count({ 
               where: { affiliateId: affiliate.id, status: { in: ["APPROVED", "PAID"] } } 
           });

           if (salesCount >= targetTier.minSalesCount) {
               await db.affiliateAccount.update({
                   where: { id: affiliate.id },
                   data: { tierId: targetTier.id }
               });
               
               await db.notificationQueue.create({
                   data: {
                       channel: "EMAIL",
                       recipient: affiliate.user.email,
                       templateSlug: "TIER_UPGRADED",
                       status: "PENDING",
                       userId: affiliate.userId,
                       content: "",
                       metadata: { 
                           affiliate_name: affiliate.user.name, 
                           tier_name: targetTier.name 
                       }
                   }
               });
           }
       } catch (err) {
           console.error(`Tier Upgrade Failed for ${affiliate.id}`, err);
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
    if (item.affiliateId) {
        await updateRiskScore(item.affiliateId).catch(err => console.error("Fraud Check Failed:", err));
    }
  }
}