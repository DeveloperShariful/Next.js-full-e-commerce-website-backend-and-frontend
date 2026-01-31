// File: app/actions/admin/settings/affiliate/_services/general-config-service.ts

"use server";

import { db } from "@/lib/prisma";
import { AffiliateGeneralSettings, AffiliateConfigDTO, ActionResponse } from "../types";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
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

    if (!settings) return null;

    const genConfig = (settings.generalConfig as any) || {};
    const affConfig = (settings.affiliateConfig as AffiliateConfigDTO) || {};

    return {
      isActive: genConfig.enableAffiliateProgram ?? false,
      programName: affConfig.programName || "Affiliate Program",
      termsUrl: affConfig.termsUrl || "",
      excludeShipping: affConfig.excludeShipping ?? true,
      excludeTax: affConfig.excludeTax ?? true,
      autoApplyCoupon: affConfig.autoApplyCoupon ?? false,
      zeroValueReferrals: affConfig.zeroValueReferrals ?? false,
      referralParam: affConfig.referralParam || "ref",
      customSlugsEnabled: affConfig.customSlugsEnabled ?? false,
      autoCreateSlug: affConfig.autoCreateSlug ?? false,
      slugLimit: Number(affConfig.slugLimit) || 5,
      cookieDuration: Number(affConfig.cookieDuration) || 30,
      allowSelfReferral: affConfig.allowSelfReferral ?? false,
      isLifetimeLinkOnPurchase: affConfig.isLifetimeLinkOnPurchase ?? false,
      lifetimeDuration: affConfig.lifetimeDuration ?? null,
      holdingPeriod: Number(affConfig.holdingPeriod) || 14,
      autoApprovePayout: affConfig.autoApprovePayout ?? false,
      minimumPayout: Number(affConfig.minimumPayout) || 50,
      payoutMethods: Array.isArray(affConfig.payoutMethods) 
        ? affConfig.payoutMethods 
        : ["STORE_CREDIT"],
      commissionRate: Number(affConfig.commissionRate) || 10,
      commissionType: affConfig.commissionType || "PERCENTAGE",
    };
  } catch (error) {
    throw new Error("Failed to load configuration");
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

    const existingGeneral = (rawSettings?.generalConfig as any) || {};
    
    const newGeneralConfig = {
      ...existingGeneral,
      enableAffiliateProgram: payload.isActive,
    };

    const newAffiliateConfig = {
      ...(rawSettings?.affiliateConfig as any),
      ...affiliateConfigPayload 
    };

    await db.$transaction(async (tx) => {
      await tx.storeSettings.upsert({
        where: { id: "settings" },
        create: {
          storeName: "My Store",
          currency: "AUD",
          generalConfig: newGeneralConfig,
          affiliateConfig: newAffiliateConfig as any,
        },
        update: {
          generalConfig: newGeneralConfig,
          affiliateConfig: newAffiliateConfig as any,
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

    revalidatePath("/admin/settings/affiliate");
    return { success: true, message: "Configuration updated successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Internal server error." };
  }
}