// File: app/actions/backend/affiliate/_services/fraud-service.ts

"use server";

import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/audit-service";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "../permission-service";
import crypto from "crypto";

// ==============================================================================
// PART 1: FRAUD RULES CONFIGURATION (JSON Based Strict Types)
// ==============================================================================

const fraudRuleSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["IP_CLICK_LIMIT", "CONVERSION_RATE_LIMIT", "ORDER_VALUE_LIMIT", "BLACKLIST_COUNTRY", "MIN_ORDER_VALUE", "DEVICE_FINGERPRINT_LIMIT"]),
  value: z.string().min(1, "Threshold value is required"),
  action: z.enum(["BLOCK", "FLAG", "SUSPEND"]).default("FLAG"),
  reason: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FraudRuleInput = z.infer<typeof fraudRuleSchema>;

export async function getRules(): Promise<FraudRuleInput[]> {
  try {
    await protectAction("MANAGE_FRAUD");
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateFraudRules: true }
    });

    const parsed = z.array(fraudRuleSchema).safeParse(settings?.affiliateFraudRules);
    return parsed.success ? parsed.data : [];
  } catch {
    throw new Error("Failed to load fraud rules.");
  }
}

export async function createFraudRuleAction(data: FraudRuleInput): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    const result = fraudRuleSchema.safeParse(data);
    if (!result.success) return { success: false, message: result.error.issues[0].message };

    const currentRules = await getRules();

    const newRule: FraudRuleInput = {
      ...result.data,
      id: crypto.randomUUID(),
      reason: result.data.reason || "Automated Rule Match",
      isActive: true,
    };

    currentRules.push(newRule);

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateFraudRules: currentRules as unknown as Prisma.InputJsonValue }
    });

    await auditService.log({
      userId: actor.id,
      action: "CREATE_FRAUD_RULE",
      entity: "StoreSettings",
      entityId: "affiliateFraudRules",
      newData: newRule
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: "Security rule activated." };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to create rule." };
  }
}

export async function toggleFraudRuleAction(id: string, isActive: boolean): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");
    const currentRules = await getRules();

    const idx = currentRules.findIndex(r => r.id === id);
    if (idx === -1) return { success: false, message: "Rule not found." };

    currentRules[idx].isActive = isActive;

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateFraudRules: currentRules as unknown as Prisma.InputJsonValue }
    });

    await auditService.log({
      userId: actor.id,
      action: isActive ? "ENABLE_FRAUD_RULE" : "DISABLE_FRAUD_RULE",
      entity: "StoreSettings",
      entityId: id,
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: `Rule ${isActive ? "enabled" : "disabled"}.` };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to toggle rule." };
  }
}

export async function deleteFraudRuleAction(id: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    const currentRules = await getRules();
    const updatedRules = currentRules.filter(r => r.id !== id);

    await db.storeSettings.update({
      where: { id: "settings" },
      data: { affiliateFraudRules: updatedRules as unknown as Prisma.InputJsonValue }
    });

    await auditService.log({
      userId: actor.id,
      action: "DELETE_FRAUD_RULE",
      entity: "StoreSettings",
      entityId: id
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: "Rule removed." };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to delete rule." };
  }
}

// ==============================================================================
// PART 2: FRAUD DETECTION LOGIC (Enterprise Engine)
// ==============================================================================

export async function detectSelfReferral(affiliateId: string, buyerEmail: string, buyerIp: string): Promise<boolean> {
  const affiliate = await db.affiliateAccount.findFirst({
    where: { id: affiliateId, deletedAt: null },
    select: { user: { select: { email: true } } }
  });

  if (!affiliate) return false;
  if (affiliate.user.email.toLowerCase().trim() === buyerEmail.toLowerCase().trim()) return true;

  const match = await db.affiliateClick.findFirst({
    where: {
      affiliateId,
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
    where: { affiliateId, createdAt: { gte: fiveMinutesAgo }, status: "PENDING" }
  });
  return recentCount >= 10;
}

export async function checkDeviceFingerprint(affiliateId: string, fingerprint: string) {
  if (!fingerprint) return "UNKNOWN";

  const fingerprintMatch = await db.affiliateClick.findFirst({
    where: { affiliateId, deviceFingerprint: fingerprint },
    select: { id: true }
  });

  return fingerprintMatch ? "MATCH" : "NEW_DEVICE";
}

export async function updateRiskScore(affiliateId: string) {
  let score = 0;

  const rules = await getRules();

  const [referralsCount, clickCount, flaggedCount] = await Promise.all([
    db.referral.count({ where: { affiliateId } }),
    db.affiliateClick.count({ where: { affiliateId } }),
    db.referral.count({ where: { affiliateId, isFlagged: true } })
  ]);

  const conversionRate = clickCount > 0 ? (referralsCount / clickCount) * 100 : 0;

  for (const rule of rules) {
    if (!rule.isActive) continue;
    const threshold = Number(rule.value);

    if (rule.type === "CONVERSION_RATE_LIMIT" && clickCount > 50) {
      if (conversionRate > threshold) {
        score += 30;
        await logFraudAlert(affiliateId, "SUSPICIOUS_CONVERSION", `Rate ${conversionRate.toFixed(2)}% > ${threshold}%`);
      }
    }

    if (rule.type === "IP_CLICK_LIMIT") {
      const ipClickCount = await db.affiliateClick.count({
        where: { affiliateId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      });
      if (ipClickCount > threshold) {
        score += 25;
        await logFraudAlert(affiliateId, "IP_CLICK_LIMIT_EXCEEDED", `${ipClickCount} clicks in 24h > ${threshold}`);
      }
    }

    if (rule.type === "ORDER_VALUE_LIMIT") {
      const suspiciousOrders = await db.referral.count({
        where: { affiliateId, totalOrderAmount: { gt: threshold } }
      });
      if (suspiciousOrders > 0) {
        score += 20;
        await logFraudAlert(affiliateId, "ORDER_VALUE_LIMIT_EXCEEDED", `${suspiciousOrders} orders over $${threshold}`);
      }
    }
  }

  score += flaggedCount * 15;

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
    data: {
      riskScore: score,
      ...(score >= 80 ? { status: "SUSPENDED" } : {})
    }
  });

  if (score >= 80) {
    await auditService.systemLog("WARN", "FRAUD_SHIELD", `Auto-suspended affiliate ${affiliateId}`, { score });
  }

  return score;
}

async function logFraudAlert(affiliateId: string, type: string, details: string) {
  await auditService.systemLog("WARN", "FRAUD_DETECTOR", `Risk Alert: ${type}`, { affiliateId, details });
}

// ==============================================================================
// PART 3: REPORTING (Admin UI Data)
// ==============================================================================

export async function getFraudStats() {
  await protectAction("MANAGE_FRAUD");

  const [highRisk, mediumRisk, lowRisk, suspended, totalFlagged, recentFlagged] = await Promise.all([
    db.affiliateAccount.count({ where: { riskScore: { gte: 70 }, deletedAt: null } }),
    db.affiliateAccount.count({ where: { riskScore: { gte: 30, lt: 70 }, deletedAt: null } }),
    db.affiliateAccount.count({ where: { riskScore: { lt: 30 }, deletedAt: null } }),
    db.affiliateAccount.count({ where: { status: "SUSPENDED", deletedAt: null } }),
    db.referral.count({ where: { isFlagged: true } }),
    db.referral.count({ where: { isFlagged: true, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  return { highRisk, mediumRisk, lowRisk, suspended, totalFlagged, recentFlagged };
}

export async function getHighRiskAffiliates() {
  await protectAction("MANAGE_FRAUD");

  return await db.affiliateAccount.findMany({
    where: { riskScore: { gt: 30 }, deletedAt: null },
    select: {
      id: true,
      slug: true,
      status: true,
      riskScore: true,
      createdAt: true,
      user: { select: { name: true, email: true, image: true } },
      _count: { select: { referrals: true, clicks: true } }
    },
    orderBy: { riskScore: "desc" },
    take: 50,
  });
}

export async function getFlaggedReferrals() {
  await protectAction("MANAGE_FRAUD");

  return await db.referral.findMany({
    where: { isFlagged: true },
    select: {
      id: true,
      isFlagged: true,
      flagReason: true,
      totalOrderAmount: true,
      commissionAmount: true,
      status: true,
      createdAt: true,
      affiliate: {
        select: { id: true, slug: true, user: { select: { name: true, email: true } } }
      },
      order: { select: { orderNumber: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getRecentFraudAlerts(limit: number = 20) {
  await protectAction("MANAGE_FRAUD");

  return await db.systemLog.findMany({
    where: {
      source: { in: ["FRAUD_SHIELD", "FRAUD_DETECTOR"] },
      level: "WARN"
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, source: true, message: true, context: true, createdAt: true }
  });
}

// ==============================================================================
// PART 4: QUICK ACTIONS
// ==============================================================================

export async function clearRiskScoreAction(affiliateId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { riskScore: 0 }
    });

    await auditService.log({
      userId: actor.id,
      action: "CLEAR_RISK_SCORE",
      entity: "AffiliateAccount",
      entityId: affiliateId,
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: "Risk score cleared." };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to clear risk score." };
  }
}

export async function suspendAffiliateAction(affiliateId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { status: "SUSPENDED" }
    });

    await auditService.log({
      userId: actor.id,
      action: "SUSPEND_AFFILIATE",
      entity: "AffiliateAccount",
      entityId: affiliateId,
      meta: { source: "FRAUD_SHIELD" }
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: "Affiliate suspended." };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to suspend affiliate." };
  }
}

export async function reinstateAffiliateAction(affiliateId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { status: "ACTIVE", riskScore: 0 }
    });

    await auditService.log({
      userId: actor.id,
      action: "REINSTATE_AFFILIATE",
      entity: "AffiliateAccount",
      entityId: affiliateId,
      meta: { source: "FRAUD_SHIELD" }
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: "Affiliate reinstated and risk score cleared." };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to reinstate affiliate." };
  }
}

export async function clearFlagAction(referralId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    await db.referral.update({
      where: { id: referralId },
      data: { isFlagged: false, flagReason: null }
    });

    await auditService.log({
      userId: actor.id,
      action: "CLEAR_REFERRAL_FLAG",
      entity: "Referral",
      entityId: referralId,
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: "Flag cleared. Referral approved for payout." };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to clear flag." };
  }
}

export async function rejectFlaggedReferralAction(referralId: string): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_FRAUD");

    await db.referral.update({
      where: { id: referralId },
      data: { status: "REJECTED", isFlagged: false }
    });

    await auditService.log({
      userId: actor.id,
      action: "REJECT_FLAGGED_REFERRAL",
      entity: "Referral",
      entityId: referralId,
      meta: { source: "FRAUD_SHIELD" }
    });

    revalidatePath("/admin/affiliate?view=fraud");
    return { success: true, message: "Referral rejected." };
  } catch (error: unknown) {
    console.error(error);
    return { success: false, message: "Failed to reject referral." };
  }
}
