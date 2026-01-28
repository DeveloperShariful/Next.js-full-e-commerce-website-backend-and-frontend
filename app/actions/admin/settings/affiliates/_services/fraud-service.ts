// File: app/actions/admin/settings/affiliate/_services/fraud-service.ts

"use server";

import { db } from "@/lib/prisma";
import { getCachedFraudRules } from "@/lib/services/settings-cache";
import { auditService } from "@/lib/services/audit-service";

// =========================================
// INTERNAL LOGIC (Used by Engine & Cron)
// =========================================

export async function detectSelfReferral(affiliateId: string, buyerEmail: string, buyerIp: string): Promise<boolean> {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    include: { user: true }
  });

  if (!affiliate) return false;

  // 1. Email Match
  if (affiliate.user.email.toLowerCase() === buyerEmail.toLowerCase()) return true;

  // 2. IP Match (Check last 5 clicks)
  const recentClicks = await db.affiliateClick.findMany({
    where: { affiliateId: affiliate.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { ipAddress: true }
  });

  if (recentClicks.some(c => c.ipAddress === buyerIp)) {
    return true; 
  }

  return false;
}

export async function updateRiskScore(affiliateId: string) {
  let score = 0;
  const rules = await getCachedFraudRules();

  // 1. Fetch Data Snapshot
  const [referrals, clickCount, flaggedCount] = await Promise.all([
    db.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    db.affiliateClick.count({ where: { affiliateId } }),
    db.referral.count({ where: { affiliateId, isFlagged: true } })
  ]);

  const conversionCount = referrals.length;
  const conversionRate = clickCount > 0 ? (conversionCount / clickCount) * 100 : 0;

  // 2. Apply Dynamic Rules
  for (const rule of rules) {
    const threshold = Number(rule.value);
    
    if (rule.type === "CONVERSION_RATE_LIMIT" && clickCount > 20) {
      if (conversionRate > threshold) {
        score += 30;
        await logFraudAlert(affiliateId, "SUSPICIOUS_CONVERSION", `Rate ${conversionRate.toFixed(2)}% > ${threshold}%`);
      }
    }
  }

  // 3. Base Heuristics
  score += (flaggedCount * 15);

  if (referrals.length >= 5) {
    const timeDiff = referrals[0].createdAt.getTime() - referrals[4].createdAt.getTime();
    if (timeDiff < 5 * 60 * 1000) { 
      score += 40;
      await logFraudAlert(affiliateId, "RAPID_TRANSACTIONS", "5 orders in < 5 mins");
    }
  }

  if (score > 100) score = 100;

  // 4. Update DB
  await db.affiliateAccount.update({
    where: { id: affiliateId },
    data: { riskScore: score }
  });

  // 5. Auto-Action
  if (score >= 80) {
    await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { status: "SUSPENDED" }
    });
    await auditService.systemLog("WARN", "FRAUD_SHIELD", `Auto-suspended affiliate ${affiliateId}`, { score });
  }

  return score;
}

export async function logFraudAlert(affiliateId: string, type: string, details: string) {
  await auditService.systemLog("WARN", "FRAUD_DETECTOR", `Risk Alert: ${type}`, { affiliateId, details });
}

// =========================================
// READ OPERATIONS (Admin Reporting)
// =========================================

export async function getHighRiskAffiliates() {
  return await db.affiliateAccount.findMany({
    where: { riskScore: { gt: 50 } }, 
    include: { 
      user: { select: { name: true, email: true } } 
    },
    orderBy: { riskScore: "desc" }
  });
}

export async function getFlaggedReferrals() {
  return await db.referral.findMany({
    where: { isFlagged: true },
    include: {
      affiliate: {
        include: { user: { select: { name: true } } }
      },
      order: { select: { orderNumber: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });
}