// File: app/actions/admin/settings/affiliate/_services/fraud-service.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { getCachedFraudRules } from "@/lib/services/settings-cache";
import { ActionResponse } from "../types";
import { z } from "zod";
import { protectAction } from "./permission-service"; // ✅ Security

// ==============================================================================
// PART 1: FRAUD RULES CONFIGURATION (Schema & CRUD)
// ==============================================================================

const ruleSchema = z.object({
  type: z.enum(["IP_CLICK_LIMIT", "CONVERSION_RATE_LIMIT", "ORDER_VALUE_LIMIT", "BLACKLIST_COUNTRY"]),
  value: z.string().min(1, "Threshold value is required"),
  action: z.enum(["BLOCK", "FLAG", "SUSPEND"]).default("FLAG"),
  reason: z.string().optional(),
});

// --- READ RULES ---
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

// --- CREATE RULE ---
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

// --- DELETE RULE ---
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
// PART 2: FRAUD DETECTION LOGIC (Engine & Analysis)
// ==============================================================================

// --- SELF REFERRAL CHECK (Called by Engine) ---
export async function detectSelfReferral(affiliateId: string, buyerEmail: string, buyerIp: string): Promise<boolean> {
  // Internal Logic - No Role Check needed as it's called by system
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

// --- RISK SCORE CALCULATION (Called by Cron/Engine) ---
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

  // 2. Apply Dynamic Rules from DB
  for (const rule of rules) {
    const threshold = Number(rule.value);
    
    if (rule.type === "CONVERSION_RATE_LIMIT" && clickCount > 20) {
      if (conversionRate > threshold) {
        score += 30;
        await logFraudAlert(affiliateId, "SUSPICIOUS_CONVERSION", `Rate ${conversionRate.toFixed(2)}% > ${threshold}%`);
      }
    }
    
    // Add logic for other rule types if needed here (IP LIMIT, etc handled in middleware usually)
  }

  // 3. Base Heuristics (Hardcoded Safety Nets)
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

// --- INTERNAL LOGGING HELPER ---
async function logFraudAlert(affiliateId: string, type: string, details: string) {
  await auditService.systemLog("WARN", "FRAUD_DETECTOR", `Risk Alert: ${type}`, { affiliateId, details });
}

// ==============================================================================
// PART 3: REPORTING (Admin UI Data)
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