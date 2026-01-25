//app/api/cron/affiliate-check/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { fraudService } from "@/app/actions/admin/settings/affiliates/_services/fraud-service";

export const dynamic = 'force-dynamic'; // No caching

export async function GET(req: Request) {
  try {
    // 1. Security Check (CRON_SECRET should be in .env)
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("🔄 Starting Affiliate Cron Job...");

    // ====================================================
    // TASK 1: AUTO TIER UPGRADE
    // ====================================================
    
    // Fetch all tiers ordered by requirements (Higher first)
    const tiers = await db.affiliateTier.findMany({
      orderBy: { minSalesAmount: 'desc' }
    });

    const affiliates = await db.affiliateAccount.findMany({
      where: { status: "ACTIVE" },
      include: { tier: true }
    });

    let upgradeCount = 0;

    for (const affiliate of affiliates) {
      const earnings = affiliate.totalEarnings.toNumber();
      const salesCount = await db.referral.count({
        where: { affiliateId: affiliate.id, status: "PAID" }
      });

      // Find the highest tier they qualify for
      const eligibleTier = tiers.find(t => 
        earnings >= t.minSalesAmount.toNumber() && 
        salesCount >= t.minSalesCount
      );

      // If eligible and not already on that tier (or higher)
      if (eligibleTier && eligibleTier.id !== affiliate.tierId) {
        // Prevent downgrading if they are already on a special tier? 
        // Logic: Only upgrade if the new tier requires MORE sales than current
        const currentReq = affiliate.tier?.minSalesAmount.toNumber() || 0;
        
        if (eligibleTier.minSalesAmount.toNumber() > currentReq) {
          await db.affiliateAccount.update({
            where: { id: affiliate.id },
            data: { tierId: eligibleTier.id }
          });
          upgradeCount++;
          console.log(`🚀 Upgraded ${affiliate.slug} to ${eligibleTier.name}`);
        }
      }
    }

    // ====================================================
    // TASK 2: FRAUD RISK ANALYSIS
    // ====================================================
    
    // Check recently active affiliates only to save resources
    const activeAffiliates = await db.affiliateClick.findMany({
      where: { 
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
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