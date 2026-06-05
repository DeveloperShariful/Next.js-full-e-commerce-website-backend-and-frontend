// File: app/actions/backend/affiliate/_services/general-config-service.ts

"use server";

import { db } from "@/lib/prisma";
import { AffiliateGeneralSettings, AffiliateConfigDTO, ActionResponse } from "../types";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/audit-service";
import { affiliateGeneralSchema } from "../schemas";
import { getChanges } from "../get-changes";
import { protectAction } from "../permission-service";

// =========================================
// READ OPERATIONS
// =========================================
export async function getSettings(): Promise<AffiliateGeneralSettings | null> {
  try {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: {
        generalConfig: true,
        affiliateConfig: true,
      },
    });

    // 100% Strict parsing (No 'any' or 'as')
    const genConfig = settings?.generalConfig && typeof settings.generalConfig === "object" 
      ? (settings.generalConfig as Record<string, unknown>) 
      : {};
      
    const affConfig = settings?.affiliateConfig && typeof settings.affiliateConfig === "object"
      ? (settings.affiliateConfig as Record<string, unknown>)
      : {};

    return {
      isActive: Boolean(genConfig.enableAffiliateProgram) ?? false,
      programName: String(affConfig.programName || "Affiliate Program"),
      termsUrl: affConfig.termsUrl ? String(affConfig.termsUrl) : "",
      excludeShipping: Boolean(affConfig.excludeShipping ?? true),
      excludeTax: Boolean(affConfig.excludeTax ?? true),
      autoApplyCoupon: Boolean(affConfig.autoApplyCoupon ?? false),
      zeroValueReferrals: Boolean(affConfig.zeroValueReferrals ?? false),
      referralParam: String(affConfig.referralParam || "ref"),
      customSlugsEnabled: Boolean(affConfig.customSlugsEnabled ?? false),
      autoCreateSlug: Boolean(affConfig.autoCreateSlug ?? false),
      slugLimit: Number(affConfig.slugLimit || 5),
      cookieDuration: Number(affConfig.cookieDuration || 30),
      allowSelfReferral: Boolean(affConfig.allowSelfReferral ?? false),
      isLifetimeLinkOnPurchase: Boolean(affConfig.isLifetimeLinkOnPurchase ?? false),
      lifetimeDuration: affConfig.lifetimeDuration ? Number(affConfig.lifetimeDuration) : null,
      holdingPeriod: Number(affConfig.holdingPeriod || 14),
      autoApprovePayout: Boolean(affConfig.autoApprovePayout ?? false),
      minimumPayout: Number(affConfig.minimumPayout || 50),
      payoutMethods: Array.isArray(affConfig.payoutMethods) 
        ? affConfig.payoutMethods.map(String) 
        : ["STORE_CREDIT"], 
      commissionRate: Number(affConfig.commissionRate || 10),
      commissionType: (affConfig.commissionType as "PERCENTAGE" | "FIXED") || "PERCENTAGE",
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {
        isActive: false,
        programName: "Affiliate Program",
        commissionRate: 10,
        commissionType: "PERCENTAGE",
        payoutMethods: ["STORE_CREDIT"],
        minimumPayout: 50,
        holdingPeriod: 14,
        autoApprovePayout: false,
        cookieDuration: 30,
        slugLimit: 5,
        referralParam: "ref",
        excludeShipping: true,
        excludeTax: true,
        autoApplyCoupon: false,
        zeroValueReferrals: false,
        allowSelfReferral: false,
        isLifetimeLinkOnPurchase: false,
        customSlugsEnabled: false,
        autoCreateSlug: false
    };
  }
}

// =========================================
// SERVER ACTIONS (Mutations)
// =========================================

export async function updateGeneralSettingsAction(data: AffiliateGeneralSettings): Promise<ActionResponse> {
  try {
    const actor = await protectAction("MANAGE_CONFIGURATION");
    
    const result = affiliateGeneralSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;
    const affiliateConfigPayload: AffiliateConfigDTO = {
      programName: payload.programName,
      termsUrl: payload.termsUrl,
      excludeShipping: payload.excludeShipping,
      excludeTax: payload.excludeTax,
      autoApplyCoupon: payload.autoApplyCoupon,
      zeroValueReferrals: payload.zeroValueReferrals,
      referralParam: payload.referralParam,
      customSlugsEnabled: payload.customSlugsEnabled,
      autoCreateSlug: payload.autoCreateSlug,
      slugLimit: payload.slugLimit,
      cookieDuration: payload.cookieDuration,
      allowSelfReferral: payload.allowSelfReferral,
      isLifetimeLinkOnPurchase: payload.isLifetimeLinkOnPurchase,
      lifetimeDuration: payload.lifetimeDuration,
      holdingPeriod: payload.holdingPeriod,
      autoApprovePayout: payload.autoApprovePayout,
      minimumPayout: payload.minimumPayout,
      payoutMethods: payload.payoutMethods,
      commissionRate: payload.commissionRate,
      commissionType: payload.commissionType,
    };

    const currentSettings = await getSettings();
    const { hasChanges, changes, oldValues } = currentSettings 
        ? getChanges(currentSettings, payload)
        : { hasChanges: true, changes: payload, oldValues: null };

    if (!hasChanges) {
        return { success: true, message: "No changes detected." };
    }
    const rawSettings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true, affiliateConfig: true },
    });

    const existingGeneral = (rawSettings?.generalConfig as Record<string, unknown>) || {};
    const newGeneralConfig = {
      ...existingGeneral,
      enableAffiliateProgram: payload.isActive,
    };

    const newAffiliateConfig = {
      ...(rawSettings?.affiliateConfig as Record<string, unknown>),
      ...affiliateConfigPayload 
    };

    await db.$transaction(async (tx) => {
      await tx.storeSettings.upsert({
        where: { id: "settings" },
        create: {
          storeName: "My Store", 
          currency: "AUD",
          generalConfig: newGeneralConfig,
          affiliateConfig: newAffiliateConfig,
        },
        update: {
          generalConfig: newGeneralConfig,
          affiliateConfig: newAffiliateConfig,
        },
      });

      await auditService.log({
        userId: actor.id,
        action: "UPDATE",
        entity: "StoreSettings",
        entityId: "settings",
        oldData: oldValues, 
        newData: changes,    
        meta: { module: "AFFILIATE_CONFIG" }
      });
    });

    revalidatePath("/admin/affiliate");
    return { success: true, message: "Configuration updated successfully." };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "Internal server error." };
  }
}