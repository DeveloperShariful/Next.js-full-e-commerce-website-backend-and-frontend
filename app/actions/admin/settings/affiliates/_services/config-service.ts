// File: app/actions/admin/settings/affiliate/_services/config-service.ts

import { db } from "@/lib/prisma";
import { AffiliateGeneralSettings, AffiliateConfigDTO } from "../types";

/**
 * SERVICE LAYER: Handles direct DB operations.
 * Separated from Actions to keep logic clean and reusable.
 */

export const configService = {
  /**
   * Fetch current affiliate settings from DB
   * Merges `generalConfig` (isActive) and `affiliateConfig` (JSON)
   */
  async getSettings(): Promise<AffiliateGeneralSettings | null> {
    try {
      const settings = await db.storeSettings.findUnique({
        where: { id: "settings" },
        select: {
          generalConfig: true,
          affiliateConfig: true,
        },
      });

      if (!settings) return null;

      // Extract raw JSON data with type assertion
      const genConfig = (settings.generalConfig as any) || {};
      const affConfig = (settings.affiliateConfig as AffiliateConfigDTO) || {};

      // Map DB data to our Strict Typed Object (With Defaults)
      return {
        // General
        isActive: genConfig.enableAffiliateProgram ?? false,
        programName: affConfig.programName || "GoBike Partner Program",
        termsUrl: affConfig.termsUrl || "",

        // Commission Logic
        excludeShipping: affConfig.excludeShipping ?? true,
        excludeTax: affConfig.excludeTax ?? true,
        autoApplyCoupon: affConfig.autoApplyCoupon ?? false,
        zeroValueReferrals: affConfig.zeroValueReferrals ?? false,

        // Links
        referralParam: affConfig.referralParam || "ref",
        customSlugsEnabled: affConfig.customSlugsEnabled ?? false,
        autoCreateSlug: affConfig.autoCreateSlug ?? false,
        slugLimit: Number(affConfig.slugLimit) || 5,

        // Tracking
        cookieDuration: Number(affConfig.cookieDuration) || 30,
        allowSelfReferral: affConfig.allowSelfReferral ?? false,
        isLifetimeLinkOnPurchase: affConfig.isLifetimeLinkOnPurchase ?? false,
        lifetimeDuration: affConfig.lifetimeDuration ?? null, // Null = Forever

        // Finance
        holdingPeriod: Number(affConfig.holdingPeriod) || 14,
        autoApprovePayout: affConfig.autoApprovePayout ?? false,
        minimumPayout: Number(affConfig.minimumPayout) || 50,
        payoutMethods: Array.isArray(affConfig.payoutMethods) 
          ? affConfig.payoutMethods 
          : ["STORE_CREDIT"],
      };
    } catch (error) {
      console.error("[ConfigService] Fetch Error:", error);
      throw new Error("Failed to load affiliate configuration.");
    }
  },

  /**
   * Update settings in DB
   * Handles the split between `generalConfig` and `affiliateConfig`
   */
  async updateSettings(data: AffiliateGeneralSettings): Promise<void> {
    try {
      // 1. Fetch existing data to preserve other nested keys (safe update)
      const current = await db.storeSettings.findUnique({
        where: { id: "settings" },
        select: { generalConfig: true },
      });

      const existingGeneral = (current?.generalConfig as any) || {};

      // 2. Prepare JSON payload for `affiliateConfig` column
      const affiliateConfigPayload: AffiliateConfigDTO = {
        programName: data.programName,
        termsUrl: data.termsUrl,
        
        excludeShipping: data.excludeShipping,
        excludeTax: data.excludeTax,
        autoApplyCoupon: data.autoApplyCoupon,
        zeroValueReferrals: data.zeroValueReferrals,

        referralParam: data.referralParam,
        customSlugsEnabled: data.customSlugsEnabled,
        autoCreateSlug: data.autoCreateSlug,
        slugLimit: data.slugLimit,

        cookieDuration: data.cookieDuration,
        allowSelfReferral: data.allowSelfReferral,
        isLifetimeLinkOnPurchase: data.isLifetimeLinkOnPurchase,
        lifetimeDuration: data.lifetimeDuration,

        holdingPeriod: data.holdingPeriod,
        autoApprovePayout: data.autoApprovePayout,
        minimumPayout: data.minimumPayout,
        payoutMethods: data.payoutMethods,
      };

      // 3. Perform Update
      await db.storeSettings.upsert({
        where: { id: "settings" },
        create: {
          storeName: "My Store", // Fallback
          currency: "AUD",
          generalConfig: {
            ...existingGeneral,
            enableAffiliateProgram: data.isActive,
          },
          affiliateConfig: affiliateConfigPayload as any, // Prisma Json handling
        },
        update: {
          generalConfig: {
            ...existingGeneral,
            enableAffiliateProgram: data.isActive,
          },
          affiliateConfig: affiliateConfigPayload as any,
        },
      });
    } catch (error) {
      console.error("[ConfigService] Update Error:", error);
      throw new Error("Database update failed.");
    }
  },
};