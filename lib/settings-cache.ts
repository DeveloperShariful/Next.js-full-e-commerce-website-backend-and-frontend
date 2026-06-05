// File: lib/settings-cache.ts

import { db } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { z } from "zod";

/**
 * ==================================================================
 * 🛡️ ZOD SCHEMAS FOR 100% STRICT RUNTIME VALIDATION (NO 'any' OR 'as')
 * ==================================================================
 */

const AffiliateConfigZod = z.object({
  programName: z.string().optional().default("Affiliate Program"),
  commissionRate: z.number().optional().default(10),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional().default("PERCENTAGE"),
  excludeShipping: z.boolean().optional().default(true),
  excludeTax: z.boolean().optional().default(true),
  cookieDuration: z.number().optional().default(30),
  allowSelfReferral: z.boolean().optional().default(false),
  holdingPeriod: z.number().optional().default(14),
  autoApprovePayout: z.boolean().optional().default(false),
  isLifetimeLinkOnPurchase: z.boolean().optional().default(false),
  zeroValueReferrals: z.boolean().optional().default(false),
});

const GeneralConfigZod = z.object({
  enableAffiliateProgram: z.boolean().optional().default(false),
});

const MLMConfigZod = z.object({
  isEnabled: z.boolean().optional().default(false),
  maxLevels: z.number().optional().default(3),
  commissionBasis: z.enum(["SALES_AMOUNT", "PROFIT_MARGIN", "CV"]).optional().default("SALES_AMOUNT"),
  levelRates: z.record(z.string(), z.number()).optional().default({ "1": 10, "2": 5, "3": 2 }),
});

const FraudRuleZod = z.object({
  type: z.enum(["IP_CLICK_LIMIT", "CONVERSION_RATE_LIMIT", "ORDER_VALUE_LIMIT", "BLACKLIST_COUNTRY"]),
  value: z.string(),
  action: z.enum(["BLOCK", "FLAG", "SUSPEND"]),
  reason: z.string().optional(),
});

const FraudRulesArrayZod = z.array(FraudRuleZod).default([]);

/**
 * ==================================================================
 * 🚀 CACHE FUNCTIONS
 * ==================================================================
 */

export const getCachedAffiliateSettings = unstable_cache(
  async () => {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: {
        affiliateConfig: true,
        generalConfig: true,
      },
    });

    // 100% Strict parsing without 'any' or 'as'
    const affParse = AffiliateConfigZod.safeParse(settings?.affiliateConfig);
    const genParse = GeneralConfigZod.safeParse(settings?.generalConfig);

    const affConfig = affParse.success ? affParse.data : AffiliateConfigZod.parse({});
    const genConfig = genParse.success ? genParse.data : GeneralConfigZod.parse({});

    return {
      isActive: genConfig.enableAffiliateProgram,
      programName: affConfig.programName,
      commissionRate: affConfig.commissionRate,
      commissionType: affConfig.commissionType,
      excludeShipping: affConfig.excludeShipping,
      excludeTax: affConfig.excludeTax,
      cookieDuration: affConfig.cookieDuration,
      allowSelfReferral: affConfig.allowSelfReferral,
      holdingPeriod: affConfig.holdingPeriod,
      autoApprovePayout: affConfig.autoApprovePayout,
      isLifetimeLinkOnPurchase: affConfig.isLifetimeLinkOnPurchase,
      zeroValueReferrals: affConfig.zeroValueReferrals,
    };
  },
  ["affiliate-settings-cache"],
  { tags: ["settings", "affiliate-config"], revalidate: 3600 }
);

export const getCachedMLMConfig = unstable_cache(
  async () => {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { mlmConfig: true },
    });

    // 100% Strict parsing without 'any' or 'as'
    const parsedData = MLMConfigZod.safeParse(settings?.mlmConfig);
    const config = parsedData.success ? parsedData.data : MLMConfigZod.parse({});

    return {
      isEnabled: config.isEnabled,
      maxLevels: config.maxLevels,
      commissionBasis: config.commissionBasis,
      levelRates: config.levelRates,
    };
  },
  ["mlm-config-cache"],
  { tags: ["settings", "mlm-config"], revalidate: 3600 }
);

export const getCachedFraudRules = unstable_cache(
  async () => {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateFraudRules: true },
    });

    // 100% Strict parsing without 'any' or 'as'
    const parsedRules = FraudRulesArrayZod.safeParse(settings?.affiliateFraudRules);
    
    if (parsedRules.success) {
      return parsedRules.data;
    }
    
    return [];
  },
  ["fraud-rules-cache"],
  { tags: ["settings", "fraud-rules"], revalidate: 3600 }
);

export const getCachedGlobalRules = unstable_cache(
  async () => {
    // This table remains untouched in the new schema, so query remains the same
    return await db.affiliateCommissionRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" }
    });
  },
  ["commission-rules-cache"],
  { tags: ["commission-rules"], revalidate: 3600 }
);