//app/actions/admin/settings/affiliate/_services/fraud-service.ts

import { db } from "@/lib/prisma";

/**
 * SERVICE LAYER: FRAUD DETECTION SHIELD
 * Analyzes patterns to detect suspicious activity.
 */
export const fraudService = {

  /**
   * Check for Self-Referral (Buying from own link)
   * Returns TRUE if fraud detected
   */
  async detectSelfReferral(affiliateId: string, buyerEmail: string, buyerIp: string): Promise<boolean> {
    const affiliate = await db.affiliateAccount.findUnique({
      where: { id: affiliateId },
      include: { user: true }
    });

    if (!affiliate) return false;

    // 1. Email Match
    if (affiliate.user.email === buyerEmail) return true;

    // 2. IP Match (Check logs)
    // Note: We check the last login IP or click logs. 
    // Ideally, User model should store 'lastIp'. Assuming we check recent clicks here.
    const lastClick = await db.affiliateClick.findFirst({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" }
    });

    if (lastClick && lastClick.ipAddress === buyerIp) {
      return true; // Suspicious: Buyer IP matches Affiliate's last click IP
    }

    return false;
  },

  /**
   * Calculate and Update Risk Score for an Affiliate
   * Runs various checks and assigns a score (0-100).
   */
  async updateRiskScore(affiliateId: string) {
    let score = 0;

    // 1. Fetch Data
    const referrals = await db.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const clicks = await db.affiliateClick.count({
      where: { affiliateId }
    });

    const conversionCount = referrals.length;

    // RULE 1: Impossible Conversion Rate (> 20% is suspicious for cold traffic)
    if (clicks > 50 && conversionCount > 0) {
      const rate = (conversionCount / clicks) * 100;
      if (rate > 20) score += 20;
      if (rate > 50) score += 50; // Very high risk
    }

    // RULE 2: Rapid Transactions (Multiple orders in < 10 mins)
    // Logic: Group by time windows (simplified here)
    // ...

    // RULE 3: Flagged Referrals Count
    const flaggedCount = referrals.filter(r => r.isFlagged).length;
    score += (flaggedCount * 15);

    // Cap at 100
    if (score > 100) score = 100;

    // Update DB
    await db.affiliateAccount.update({
      where: { id: affiliateId },
      data: { riskScore: score }
    });

    return score;
  },

  /**
   * Get High Risk Affiliates for Dashboard
   */
  async getHighRiskAffiliates() {
    return await db.affiliateAccount.findMany({
      where: { riskScore: { gt: 50 } }, // Score > 50
      include: { 
        user: { select: { name: true, email: true } } 
      },
      orderBy: { riskScore: "desc" }
    });
  },

  /**
   * Get Recent Flagged Transactions
   */
  async getFlaggedReferrals() {
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
};