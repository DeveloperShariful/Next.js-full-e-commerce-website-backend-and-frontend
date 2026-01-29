// File: app/actions/admin/settings/affiliate/_services/general-config-service.ts

"use server";

import { db } from "@/lib/prisma";
import { AffiliateGeneralSettings, AffiliateConfigDTO, ActionResponse } from "../types";
import { revalidatePath } from "next/cache";
import { auditService } from "@/lib/services/audit-service";
import { affiliateGeneralSchema } from "../schemas";
import { syncUser } from "@/lib/auth-sync";

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
    // 1. Auth Check
    const auth = await syncUser();
    if (!auth || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(auth.role)) {
        return { success: false, message: "Unauthorized access." };
    }

    // 2. Validation
    const result = affiliateGeneralSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const payload = result.data;

    // 3. Fetch Existing Config to Merge
    const current = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true, affiliateConfig: true },
    });

    const existingGeneral = (current?.generalConfig as any) || {};
    
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

    // 4. Update DB
    await db.$transaction(async (tx) => {
      await tx.storeSettings.upsert({
        where: { id: "settings" },
        create: {
          storeName: "My Store",
          currency: "AUD",
          generalConfig: {
            ...existingGeneral,
            enableAffiliateProgram: payload.isActive,
          },
          affiliateConfig: affiliateConfigPayload as any,
        },
        update: {
          generalConfig: {
            ...existingGeneral,
            enableAffiliateProgram: payload.isActive,
          },
          affiliateConfig: affiliateConfigPayload as any,
        },
      });

      await auditService.log({
        userId: auth.id,
        action: "UPDATE",
        entity: "StoreSettings",
        entityId: "settings",
        oldData: current?.affiliateConfig,
        newData: affiliateConfigPayload,
        meta: { module: "AFFILIATE_CONFIG" }
      });
    });

    // 5. Revalidate Global Layout (Important for Context)
    revalidatePath("/admin/settings/affiliate");
    revalidatePath("/", "layout");

    return { success: true, message: "Configuration updated successfully." };
  } catch (error: any) {
    return { success: false, message: "Internal server error." };
  }
}