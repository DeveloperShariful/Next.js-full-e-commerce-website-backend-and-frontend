// lib/global-settings-cache.ts

import { db } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { cache } from "react"; 
import { z } from "zod"; // ✅ FIXED: Added Zod for strict JSON parsing

// ============================================================================
// 1. STORE SETTINGS CACHE
// ট্যাগ: 'store-settings'
// ============================================================================
export const getCachedStoreSettings = unstable_cache(
  async () => {
    try {
      return await db.storeSettings.findUnique({
        where: { id: "settings" },
        include: { logoMedia: true, faviconMedia: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (StoreSettings):", error);
      return null;
    }
  },
  ["store-settings-cache-key"],
  { tags: ["store-settings"], revalidate: 86400 } 
);

// ============================================================================
// 2. SEO GLOBAL CONFIG CACHE
// ট্যাগ: 'seo-config'
// ============================================================================
export const getCachedSeoConfig = unstable_cache(
  async () => {
    try {
      return await db.seoGlobalConfig.findUnique({
        where: { id: "global_seo" },
        include: { ogMedia: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (SeoConfig):", error);
      return null;
    }
  },
  ["seo-config-cache-key"],
  { tags: ["seo-config"], revalidate: 86400 }
);

// ============================================================================
// 3. MARKETING INTEGRATION CACHE
// ট্যাগ: 'marketing-config'
// ============================================================================
export const getCachedMarketingConfig = unstable_cache(
  async () => {
    try {
      return await db.marketingIntegration.findUnique({
        where: { id: "marketing_config" },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (MarketingConfig):", error);
      return null;
    }
  },
  ["marketing-config-cache-key"],
  { tags: ["marketing-config"], revalidate: 86400 }
);

// ============================================================================
// 4. PAYMENT METHODS CACHE
// ট্যাগ: 'payment-methods'
// ============================================================================
export const getCachedPaymentMethods = unstable_cache(
  async () => {
    try {
      return await db.paymentGateway.findMany({
        where: { isEnabled: true },
        orderBy: { displayOrder: "asc" },
      });
    } catch (error) {
      console.error("Cache Error (PaymentMethods):", error);
      return [];
    }
  },
  ["payment-methods-cache-key"],
  { tags: ["payment-methods"], revalidate: 86400 }
);

// ============================================================================
// 5. PICKUP LOCATIONS CACHE
// ট্যাগ: 'pickup-locations'
// ============================================================================
export const getCachedPickupLocations = unstable_cache(
  async () => {
    try {
      return await db.pickupLocation.findMany({
        where: { isActive: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (PickupLocations):", error);
      return [];
    }
  },
  ["pickup-locations-cache-key"],
  { tags: ["pickup-locations"], revalidate: 86400 }
);

// ============================================================================
// 6. EMAIL CONFIGURATION CACHE
// ট্যাগ: 'email-config'
// ============================================================================
export const getCachedEmailConfig = unstable_cache(
  async () => {
    try {
      return await db.emailConfiguration.findUnique({
        where: { id: "email_config" },
        include: { media: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (EmailConfig):", error);
      return null;
    }
  },
  ["email-config-cache-key"],
  { tags: ["email-config"], revalidate: 86400 }
);

// ============================================================================
// 7. TRANSDIRECT SHIPPING CONFIG CACHE
// ট্যাগ: 'transdirect-config'
// ============================================================================
export const getCachedTransdirectConfig = unstable_cache(
  async () => {
    try {
      return await db.transdirectConfig.findUnique({
        where: { id: "transdirect_config" },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (TransdirectConfig):", error);
      return null;
    }
  },
  ["transdirect-config-cache-key"],
  { tags: ["transdirect-config"], revalidate: 86400 }
);

// ============================================================================
// 8. AFFILIATE PROGRAM SETTINGS CACHE
// ট্যাগ: 'affiliate-config'
// ============================================================================

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
  clickDedupWindowMinutes: z.number().optional().default(1),
});

const GeneralConfigZod = z.object({
  enableAffiliateProgram: z.boolean().optional().default(false),
});

export const getCachedAffiliateSettings = unstable_cache(
  async () => {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateConfig: true, generalConfig: true },
    });

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
      clickDedupWindowMinutes: affConfig.clickDedupWindowMinutes,
    };
  },
  ["affiliate-settings-cache"],
  { tags: ["settings", "affiliate-config"], revalidate: 3600 }
);

// ============================================================================
// 10. FRAUD RULES CACHE
// ট্যাগ: 'fraud-rules'
// ============================================================================

const FraudRuleZod = z.object({
  type: z.enum(["IP_CLICK_LIMIT", "CONVERSION_RATE_LIMIT", "ORDER_VALUE_LIMIT", "BLACKLIST_COUNTRY"]),
  value: z.string(),
  action: z.enum(["BLOCK", "FLAG", "SUSPEND"]),
  reason: z.string().optional(),
});

const FraudRulesArrayZod = z.array(FraudRuleZod).default([]);

export const getCachedFraudRules = unstable_cache(
  async () => {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { affiliateFraudRules: true },
    });

    const parsedRules = FraudRulesArrayZod.safeParse(settings?.affiliateFraudRules);
    return parsedRules.success ? parsedRules.data : [];
  },
  ["fraud-rules-cache"],
  { tags: ["settings", "fraud-rules"], revalidate: 3600 }
);

// ============================================================================
// 11. GLOBAL COMMISSION RULES CACHE
// ট্যাগ: 'commission-rules'
// ============================================================================
export const getCachedGlobalRules = unstable_cache(
  async () => {
    return await db.affiliateCommissionRule.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    });
  },
  ["commission-rules-cache"],
  { tags: ["commission-rules"], revalidate: 3600 }
);

// ============================================================================
// 12. 🚀 AFFILIATE STATUS (REQUEST DEDUPLICATION)
// ============================================================================
export const getAffiliateStatusSafe = cache(async (userId?: string) => {
  try {
    if (!userId) return false;
    
    const account = await db.affiliateAccount.findUnique({
      where: { userId: userId },
      select: { status: true }
    });

    const status = account?.status;
    return status === "ACTIVE" || status === "PENDING" || status === "SUSPENDED";
  } catch (error) {
    console.error("⚠️ Request Cache Error (AffiliateStatus):", error);
    return false;
  }
});