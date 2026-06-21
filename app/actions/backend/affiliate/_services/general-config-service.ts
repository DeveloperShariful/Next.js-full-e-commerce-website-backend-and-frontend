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
// DEFAULTS (used for both read and error fallback)
// =========================================

const DEFAULTS: AffiliateGeneralSettings = {
  // Program
  isActive:            false,
  programName:         "Affiliate Program",
  termsUrl:            "",
  registrationEnabled: true,
  autoApprove:         false,
  maxAffiliatesLimit:  null,
  requireTermsAccept:  true,
  welcomeEmailEnabled: true,

  // Commission
  commissionRate:                 10,
  commissionType:                 "PERCENTAGE",
  excludeShipping:                true,
  excludeTax:                     true,
  autoApplyCoupon:                false,
  zeroValueReferrals:             false,
  maxCommissionCap:               null,
  enableProfitMarginProtection:   false,
  minProfitMargin:                20,
  firstReferralBonus:             false,
  firstReferralBonusAmount:       5,
  firstReferralBonusType:         "FIXED",

  // Tracking
  referralParam:            "ref",
  customSlugsEnabled:       false,
  autoCreateSlug:           false,
  slugLimit:                5,
  cookieDuration:           30,
  allowSelfReferral:        false,
  isLifetimeLinkOnPurchase: false,
  lifetimeDuration:         null,
  attributionModel:         "LAST_CLICK",
  trackCancelledOrders:     true,
  trackRefundedOrders:      true,

  // Payouts
  holdingPeriod:       14,
  autoApprovePayout:   false,
  minimumPayout:       50,
  payoutMethods:       ["STORE_CREDIT"],
  requireKycForPayout: false,

  // Compliance
  kycRequiredDocuments: ["NATIONAL_ID"],
  taxFormRequired:      false,
  taxFormThreshold:     600,

  // Automation
  tierAutoUpgrade:         false,
  tierEvaluationFrequency: "MONTHLY",
  commissionEmailEnabled:  true,
  payoutEmailEnabled:      true,

  // Integrations
  postbackGlobalUrl: "",
  postbackSecret:    "",
};

// =========================================
// READ
// =========================================

export async function getSettings(): Promise<AffiliateGeneralSettings | null> {
  try {
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true, affiliateConfig: true },
    });

    const genConfig =
      settings?.generalConfig && typeof settings.generalConfig === "object"
        ? (settings.generalConfig as Record<string, unknown>)
        : {};

    const aff =
      settings?.affiliateConfig && typeof settings.affiliateConfig === "object"
        ? (settings.affiliateConfig as Record<string, unknown>)
        : {};

    return {
      // Program
      isActive:            Boolean(genConfig.enableAffiliateProgram ?? false),
      programName:         String(aff.programName   || DEFAULTS.programName),
      termsUrl:            aff.termsUrl    ? String(aff.termsUrl)    : "",
      registrationEnabled: Boolean(aff.registrationEnabled ?? DEFAULTS.registrationEnabled),
      autoApprove:         Boolean(aff.autoApprove  ?? DEFAULTS.autoApprove),
      maxAffiliatesLimit:  aff.maxAffiliatesLimit != null ? Number(aff.maxAffiliatesLimit) : null,
      requireTermsAccept:  Boolean(aff.requireTermsAccept ?? DEFAULTS.requireTermsAccept),
      welcomeEmailEnabled: Boolean(aff.welcomeEmailEnabled ?? DEFAULTS.welcomeEmailEnabled),

      // Commission
      commissionRate:               Number(aff.commissionRate   || DEFAULTS.commissionRate),
      commissionType:               (aff.commissionType as "PERCENTAGE" | "FIXED") || DEFAULTS.commissionType,
      excludeShipping:              Boolean(aff.excludeShipping   ?? DEFAULTS.excludeShipping),
      excludeTax:                   Boolean(aff.excludeTax        ?? DEFAULTS.excludeTax),
      autoApplyCoupon:              Boolean(aff.autoApplyCoupon   ?? DEFAULTS.autoApplyCoupon),
      zeroValueReferrals:           Boolean(aff.zeroValueReferrals ?? DEFAULTS.zeroValueReferrals),
      maxCommissionCap:             aff.maxCommissionCap != null ? Number(aff.maxCommissionCap) : null,
      enableProfitMarginProtection: Boolean(aff.enableProfitMarginProtection ?? DEFAULTS.enableProfitMarginProtection),
      minProfitMargin:              Number(aff.minProfitMargin    || DEFAULTS.minProfitMargin),
      firstReferralBonus:           Boolean(aff.firstReferralBonus ?? DEFAULTS.firstReferralBonus),
      firstReferralBonusAmount:     Number(aff.firstReferralBonusAmount || DEFAULTS.firstReferralBonusAmount),
      firstReferralBonusType:       (aff.firstReferralBonusType as "PERCENTAGE" | "FIXED") || DEFAULTS.firstReferralBonusType,

      // Tracking
      referralParam:            String(aff.referralParam    || DEFAULTS.referralParam),
      customSlugsEnabled:       Boolean(aff.customSlugsEnabled ?? DEFAULTS.customSlugsEnabled),
      autoCreateSlug:           Boolean(aff.autoCreateSlug  ?? DEFAULTS.autoCreateSlug),
      slugLimit:                Number(aff.slugLimit         || DEFAULTS.slugLimit),
      cookieDuration:           Number(aff.cookieDuration   || DEFAULTS.cookieDuration),
      allowSelfReferral:        Boolean(aff.allowSelfReferral ?? DEFAULTS.allowSelfReferral),
      isLifetimeLinkOnPurchase: Boolean(aff.isLifetimeLinkOnPurchase ?? DEFAULTS.isLifetimeLinkOnPurchase),
      lifetimeDuration:         aff.lifetimeDuration != null ? Number(aff.lifetimeDuration) : null,
      attributionModel:         (aff.attributionModel as "LAST_CLICK" | "FIRST_CLICK") || DEFAULTS.attributionModel,
      trackCancelledOrders:     Boolean(aff.trackCancelledOrders ?? DEFAULTS.trackCancelledOrders),
      trackRefundedOrders:      Boolean(aff.trackRefundedOrders  ?? DEFAULTS.trackRefundedOrders),

      // Payouts
      holdingPeriod:       Number(aff.holdingPeriod      || DEFAULTS.holdingPeriod),
      autoApprovePayout:   Boolean(aff.autoApprovePayout ?? DEFAULTS.autoApprovePayout),
      minimumPayout:       Number(aff.minimumPayout       || DEFAULTS.minimumPayout),
      payoutMethods:       Array.isArray(aff.payoutMethods) ? aff.payoutMethods.map(String) : DEFAULTS.payoutMethods,
      requireKycForPayout: Boolean(aff.requireKycForPayout ?? DEFAULTS.requireKycForPayout),

      // Compliance
      kycRequiredDocuments: Array.isArray(aff.kycRequiredDocuments) ? aff.kycRequiredDocuments.map(String) : DEFAULTS.kycRequiredDocuments,
      taxFormRequired:      Boolean(aff.taxFormRequired ?? DEFAULTS.taxFormRequired),
      taxFormThreshold:     Number(aff.taxFormThreshold  || DEFAULTS.taxFormThreshold),

      // Automation
      tierAutoUpgrade:         Boolean(aff.tierAutoUpgrade ?? DEFAULTS.tierAutoUpgrade),
      tierEvaluationFrequency: (aff.tierEvaluationFrequency as "DAILY" | "WEEKLY" | "MONTHLY") || DEFAULTS.tierEvaluationFrequency,
      commissionEmailEnabled:  Boolean(aff.commissionEmailEnabled ?? DEFAULTS.commissionEmailEnabled),
      payoutEmailEnabled:      Boolean(aff.payoutEmailEnabled     ?? DEFAULTS.payoutEmailEnabled),

      // Integrations
      postbackGlobalUrl: aff.postbackGlobalUrl ? String(aff.postbackGlobalUrl) : "",
      postbackSecret:    aff.postbackSecret    ? String(aff.postbackSecret)    : "",
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return DEFAULTS;
  }
}

// =========================================
// WRITE
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

    const p = result.data;

    const currentSettings = await getSettings();
    const { hasChanges, changes, oldValues } = currentSettings
      ? getChanges(currentSettings, p)
      : { hasChanges: true, changes: p, oldValues: null };

    if (!hasChanges) return { success: true, message: "No changes detected." };

    const rawSettings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true, affiliateConfig: true },
    });

    const existingGeneral = (rawSettings?.generalConfig as Record<string, unknown>) || {};
    const newGeneralConfig = { ...existingGeneral, enableAffiliateProgram: p.isActive };

    const affiliateConfigPayload: AffiliateConfigDTO = {
      // Program
      programName: p.programName,
      termsUrl: p.termsUrl,
      registrationEnabled: p.registrationEnabled,
      autoApprove: p.autoApprove,
      maxAffiliatesLimit: p.maxAffiliatesLimit ?? null,
      requireTermsAccept: p.requireTermsAccept,
      welcomeEmailEnabled: p.welcomeEmailEnabled,

      // Commission
      commissionRate: p.commissionRate,
      commissionType: p.commissionType,
      excludeShipping: p.excludeShipping,
      excludeTax: p.excludeTax,
      autoApplyCoupon: p.autoApplyCoupon,
      zeroValueReferrals: p.zeroValueReferrals,
      maxCommissionCap: p.maxCommissionCap ?? null,
      enableProfitMarginProtection: p.enableProfitMarginProtection,
      minProfitMargin: p.minProfitMargin,
      firstReferralBonus: p.firstReferralBonus,
      firstReferralBonusAmount: p.firstReferralBonusAmount,
      firstReferralBonusType: p.firstReferralBonusType,

      // Tracking
      referralParam: p.referralParam,
      customSlugsEnabled: p.customSlugsEnabled,
      autoCreateSlug: p.autoCreateSlug,
      slugLimit: p.slugLimit,
      cookieDuration: p.cookieDuration,
      allowSelfReferral: p.allowSelfReferral,
      isLifetimeLinkOnPurchase: p.isLifetimeLinkOnPurchase,
      lifetimeDuration: p.lifetimeDuration ?? null,
      attributionModel: p.attributionModel,
      trackCancelledOrders: p.trackCancelledOrders,
      trackRefundedOrders: p.trackRefundedOrders,

      // Payouts
      holdingPeriod: p.holdingPeriod,
      autoApprovePayout: p.autoApprovePayout,
      minimumPayout: p.minimumPayout,
      payoutMethods: p.payoutMethods,
      requireKycForPayout: p.requireKycForPayout,

      // Compliance
      kycRequiredDocuments: p.kycRequiredDocuments,
      taxFormRequired: p.taxFormRequired,
      taxFormThreshold: p.taxFormThreshold,

      // Automation
      tierAutoUpgrade: p.tierAutoUpgrade,
      tierEvaluationFrequency: p.tierEvaluationFrequency,
      commissionEmailEnabled: p.commissionEmailEnabled,
      payoutEmailEnabled: p.payoutEmailEnabled,

      // Integrations
      postbackGlobalUrl: p.postbackGlobalUrl || "",
      // Only save postbackSecret if user provided a value (don't overwrite with blank)
      ...(p.postbackSecret ? { postbackSecret: p.postbackSecret } : {}),
    };

    const newAffiliateConfig = {
      ...(rawSettings?.affiliateConfig as Record<string, unknown>),
      ...affiliateConfigPayload,
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
        meta: { module: "AFFILIATE_CONFIG" },
      });
    });

    revalidatePath("/admin/affiliate");
    return { success: true, message: "Configuration saved successfully." };
  } catch (error: unknown) {
    console.error(error);
    const msg = error instanceof Error ? error.message : "Internal server error.";
    return { success: false, message: msg };
  }
}
