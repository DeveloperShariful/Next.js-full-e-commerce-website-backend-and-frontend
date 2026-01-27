// File: app/api/cron/affiliate-check/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { fraudService } from "@/app/actions/admin/settings/affiliates/_services/fraud-service";
import { sendNotification } from "@/app/api/email/send-notification"; // Ensure correct path

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(req: Request) {
  try {
    // 1. Security Check
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("🔄 Starting Affiliate Cron Job...");

    // ==========================================
    // JOB 1: AUTO TIER UPGRADE
    // ==========================================
    const tiers = await db.affiliateTier.findMany({
      orderBy: { minSalesAmount: 'desc' } // Highest tier first
    });

    const affiliates = await db.affiliateAccount.findMany({
      where: { status: "ACTIVE" },
      include: { tier: true, user: true }
    });

    let upgradeCount = 0;

    for (const affiliate of affiliates) {
      const earnings = affiliate.totalEarnings.toNumber();
      const salesCount = await db.referral.count({
        where: { affiliateId: affiliate.id, status: "PAID" }
      });

      // Find best eligible tier
      const eligibleTier = tiers.find(t => 
        earnings >= t.minSalesAmount.toNumber() && 
        salesCount >= t.minSalesCount
      );

      // If eligible and better than current
      if (eligibleTier && eligibleTier.id !== affiliate.tierId) {
        const currentReq = affiliate.tier?.minSalesAmount.toNumber() || 0;
        
        // Ensure we are upgrading, not downgrading
        if (eligibleTier.minSalesAmount.toNumber() > currentReq) {
          
          await db.affiliateAccount.update({
            where: { id: affiliate.id },
            data: { tierId: eligibleTier.id }
          });
          
          upgradeCount++;
          console.log(`🚀 Upgraded ${affiliate.slug} to ${eligibleTier.name}`);

          // Notify Affiliate
          await sendNotification({
            trigger: "TIER_UPGRADED",
            recipient: affiliate.user.email,
            data: {
                affiliate_name: affiliate.user.name,
                tier_name: eligibleTier.name
            },
            userId: affiliate.userId
          });
        }
      }
    }

    // ==========================================
    // JOB 2: FRAUD ANALYSIS
    // ==========================================
    const activeAffiliates = await db.affiliateClick.findMany({
      where: { 
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h activity
      },
      select: { affiliateId: true },
      distinct: ['affiliateId']
    });

    for (const item of activeAffiliates) {
      await fraudService.updateRiskScore(item.affiliateId);
    }

    return NextResponse.json({ 
      success: true, 
      upgraded: upgradeCount, 
      fraudChecks: activeAffiliates.length 
    });

  } catch (error: any) {
    console.error("Cron Job Failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}