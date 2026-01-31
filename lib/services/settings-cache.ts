// File: lib/services/settings-cache.ts

import { db } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getCachedAffiliateSettings = unstable_cache(
  async () => {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: {
        affiliateConfig: true,
        generalConfig: true,
      },
    });

    if (!settings) return null;

    const affConfig = (settings.affiliateConfig as any) || {};
    const genConfig = (settings.generalConfig as any) || {};

    return {
      isActive: genConfig.enableAffiliateProgram ?? false,
      programName: affConfig.programName || "Affiliate Program",
      commissionRate: affConfig.commissionRate ?? 10,
      commissionType: affConfig.commissionType || "PERCENTAGE", 
      excludeShipping: affConfig.excludeShipping ?? true,
      excludeTax: affConfig.excludeTax ?? true,
      cookieDuration: affConfig.cookieDuration ?? 30,
      allowSelfReferral: affConfig.allowSelfReferral ?? false,
      holdingPeriod: affConfig.holdingPeriod ?? 14,
      autoApprovePayout: affConfig.autoApprovePayout ?? false,
      isLifetimeLinkOnPurchase: affConfig.isLifetimeLinkOnPurchase ?? false,
      zeroValueReferrals: affConfig.zeroValueReferrals ?? false,
    };
  },
  ["affiliate-settings-cache"],
  { tags: ["settings", "affiliate-config"], revalidate: 3600 }
);

export const getCachedMLMConfig = unstable_cache(
  async () => {
    const config = await db.affiliateMLMConfig.findUnique({
      where: { id: "mlm_config" },
    });

    if (!config) {
      return {
        isEnabled: false,
        maxLevels: 3,
        commissionBasis: "SALES_AMOUNT",
        levelRates: { "1": 10, "2": 5, "3": 2 },
      };
    }

    return {
      isEnabled: config.isEnabled,
      maxLevels: config.maxLevels,
      commissionBasis: config.commissionBasis,
      levelRates: config.levelRates as Record<string, number>,
    };
  },
  ["mlm-config-cache"],
  { tags: ["mlm-config"], revalidate: 3600 }
);

export const getCachedFraudRules = unstable_cache(
  async () => {
    return await db.affiliateFraudRule.findMany();
  },
  ["fraud-rules-cache"],
  { tags: ["fraud-rules"], revalidate: 3600 }
);

export const getCachedGlobalRules = unstable_cache(
  async () => {
    return await db.affiliateCommissionRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" }
    });
  },
  ["commission-rules-cache"],
  { tags: ["commission-rules"], revalidate: 3600 }
);