// File: app/actions/admin/settings/affiliate/_services/fraud-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { getCachedFraudRules } from "@/lib/services/settings-cache";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "../permission-service"; 

// ==============================================================================
// PART 1: FRAUD RULES CONFIGURATION (Schema & CRUD)
// ==============================================================================

const ruleSchema = z.object({
  type: z.enum(["IP_CLICK_LIMIT", "CONVERSION_RATE_LIMIT", "ORDER_VALUE_LIMIT", "BLACKLIST_COUNTRY"]),
  value: z.string().min(1, "Threshold value is required"),
  action: z.enum(["BLOCK", "FLAG", "SUSPEND"]).default("FLAG"),
  reason: z.string().optional(),
});

export async function getRules() {
  try {
    await protectAction("MANAGE_FRAUD");
    return await db.affiliateFraudRule.findMany({
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    throw new Error("Failed to load fraud rules.");
  }
}

export async function createFraudRuleAction(data: z.infer<typeof ruleSchema>): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    const result = ruleSchema.safeParse(data);
    if (!result.success) return { success: false, message: result.error.issues[0].message };

    const rule = await db.affiliateFraudRule.create({
      data: {
        type: result.data.type,
        value: result.data.value,
        action: result.data.action,
        reason: result.data.reason || "Automated Rule Match"
      }
    });

    await auditService.log({
      userId: actor.id,
      action: "CREATE_FRAUD_RULE",
      entity: "AffiliateFraudRule",
      entityId: rule.id,
      newData: result.data
    });

    revalidatePath("/admin/settings/affiliate/fraud");
    return { success: true, message: "Security rule activated." };
  } catch (error: any) {
    return { success: false, message: "Failed to create rule." };
  }
}

export async function deleteFraudRuleAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    await db.affiliateFraudRule.delete({ where: { id } });

    await auditService.log({
        userId: actor.id,
        action: "DELETE_FRAUD_RULE",
        entity: "AffiliateFraudRule",
        entityId: id
    });

    revalidatePath("/admin/settings/affiliate/fraud");
    return { success: true, message: "Rule removed." };
  } catch (error: any) {
    return { success: false, message: "Failed to delete rule." };
  }
}

// ==============================================================================
// PART 2: FRAUD DETECTION LOGIC (Enterprise Engine)
// ==============================================================================

export async function detectSelfReferral(affiliateId: string, buyerEmail: string, buyerIp: string): Promise<boolean> {
  const affiliate = await db.affiliateAccount.findUnique({
    where: { id: affiliateId },
    select: { user: { select: { email: true } } }
  });

  if (!affiliate) return false;
  if (affiliate.user.email.toLowerCase().trim() === buyerEmail.toLowerCase().trim()) return true;
  const match = await db.affiliateClick.findFirst({
    where: { 
      affiliateId: affiliateId,
      ipAddress: buyerIp,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    },
    select: { id: true }
  });

  return !!match;
}

export async function checkVelocity(affiliateId: string): Promise<boolean> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentCount = await db.referral.count({
        where: {
            affiliateId: affiliateId,
            createdAt: { gte: fiveMinutesAgo },
            status: "PENDING"
        }
    });
    return recentCount >= 10;
}

export async function checkDeviceFingerprint(affiliateId: string, fingerprint: string) {
    if (!fingerprint) return "UNKNOWN";

    const fingerprintMatch = await db.affiliateClick.findFirst({
        where: { 
            affiliateId: affiliateId, 
            deviceFingerprint: fingerprint 
        },
        select: { id: true }
    });

    return fingerprintMatch ? "MATCH" : "NEW_DEVICE";
}

export async function updateRiskScore(affiliateId: string) {
  let score = 0;
  const rules = await getCachedFraudRules();

  const [referralsCount, clickCount, flaggedCount] = await Promise.all([
    db.referral.count({ where: { affiliateId } }),
    db.affiliateClick.count({ where: { affiliateId } }),
    db.referral.count({ where: { affiliateId, isFlagged: true } })
  ]);

  const conversionRate = clickCount > 0 ? (referralsCount / clickCount) * 100 : 0;

  for (const rule of rules) {
    const threshold = Number(rule.value);
    
    if (rule.type === "CONVERSION_RATE_LIMIT" && clickCount > 50) { 
      if (conversionRate > threshold) {
        score += 30;
        await logFraudAlert(affiliateId, "SUSPICIOUS_CONVERSION", `Rate ${conversionRate.toFixed(2)}% > ${threshold}%`);
      }
    }
  }

  score += (flaggedCount * 15);
  const recentReferrals = await db.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { createdAt: true }
  });

  if (recentReferrals.length === 5) {
      const timeDiff = recentReferrals[0].createdAt.getTime() - recentReferrals[4].createdAt.getTime();
      if (timeDiff < 5 * 60 * 1000) {
          score += 40;
          await logFraudAlert(affiliateId, "RAPID_TRANSACTIONS", "5 orders in < 5 mins");
      }
  }

  if (score > 100) score = 100;

  await db.affiliateAccount.update({
    where: { id: affiliateId },
    data: { riskScore: score }
  });

  if (score >= 80) {
    await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { status: "SUSPENDED" }
    });
    await auditService.systemLog("WARN", "FRAUD_SHIELD", `Auto-suspended affiliate ${affiliateId}`, { score });
  }

  return score;
}

async function logFraudAlert(affiliateId: string, type: string, details: string) {
  await auditService.systemLog("WARN", "FRAUD_DETECTOR", `Risk Alert: ${type}`, { affiliateId, details });
}

// ==============================================================================
// PART 3: REPORTING (Admin UI)
// ==============================================================================

export async function getHighRiskAffiliates() {
  await protectAction("MANAGE_FRAUD");

  return await db.affiliateAccount.findMany({
    where: { riskScore: { gt: 50 } }, 
    include: { 
      user: { select: { name: true, email: true } } 
    },
    orderBy: { riskScore: "desc" }
  });
}

export async function getFlaggedReferrals() {
  await protectAction("MANAGE_FRAUD");

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