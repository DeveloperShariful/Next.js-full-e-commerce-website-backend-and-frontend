//File Path: app/actions/backend/marketing/gmc-settings.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { security } from "@/lib/security";

export interface GmcSettingsData {
  gmcContentApiEnabled: boolean;
  gmcMerchantId: string;
  gmcTargetCountry: string;
  gmcLanguage: string;
}

export interface ConversionSettingsData {
  googleAdsConversionId: string;
  googleAdsConversionLabel: string;
  googleAdsEnhancedConversionsEnabled: boolean;
}

// ============================================================================
// 1. GET GMC SETTINGS (read-only — no assertAdmin needed, page is middleware-protected)
// ============================================================================
export async function getGmcSettings() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        gmcContentApiEnabled: true,
        gmcMerchantId: true,
        gmcTargetCountry: true,
        gmcLanguage: true,
        googleAccountId: true,
        // Only read boolean — never send the actual token to the client
        googleRefreshToken: true,
      },
    });

    if (!config) {
      return {
        success: true,
        data: { gmcContentApiEnabled: false, gmcMerchantId: "", gmcTargetCountry: "AU", gmcLanguage: "en" },
        isConnected: false,
        accountEmail: null,
      };
    }

    return {
      success: true,
      data: {
        gmcContentApiEnabled: config.gmcContentApiEnabled,
        gmcMerchantId: config.gmcMerchantId || "",
        gmcTargetCountry: config.gmcTargetCountry || "AU",
        gmcLanguage: config.gmcLanguage || "en",
      },
      isConnected: !!config.googleRefreshToken,
      accountEmail: config.googleAccountId,
    };
  } catch (error: unknown) {
    console.error("Error fetching GMC settings:", error);
    return { success: false, error: "Failed to fetch settings." };
  }
}

// ============================================================================
// 2. UPDATE GMC SETTINGS
// ============================================================================
export async function updateGmcSettings(data: GmcSettingsData) {
  await security.assertAdmin();
  try {
    if (data.gmcContentApiEnabled && !data.gmcMerchantId) {
      return { success: false, error: "Merchant Center ID is required to enable Content API." };
    }

    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        gmcContentApiEnabled: data.gmcContentApiEnabled,
        gmcMerchantId: data.gmcMerchantId.trim(),
        gmcTargetCountry: data.gmcTargetCountry.toUpperCase(),
        gmcLanguage: data.gmcLanguage.toLowerCase(),
      },
      create: {
        id: "marketing_config",
        gmcContentApiEnabled: data.gmcContentApiEnabled,
        gmcMerchantId: data.gmcMerchantId.trim(),
        gmcTargetCountry: data.gmcTargetCountry.toUpperCase(),
        gmcLanguage: data.gmcLanguage.toLowerCase(),
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Settings saved successfully." };
  } catch (error: unknown) {
    console.error("Error updating GMC settings:", error);
    return { success: false, error: "An error occurred while saving settings." };
  }
}

// ============================================================================
// 3. SAVE GOOGLE ADS CONVERSION & TRACKING SETTINGS
// ============================================================================
export async function saveGoogleAdsConversionSettings(data: ConversionSettingsData) {
  await security.assertAdmin();
  try {
    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAdsConversionId: data.googleAdsConversionId || null,
        googleAdsConversionLabel: data.googleAdsConversionLabel || null,
        googleAdsEnhancedConversionsEnabled: data.googleAdsEnhancedConversionsEnabled,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Conversion tracking settings updated successfully." };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save conversion settings.";
    console.error("Error saving Google Ads conversion settings:", error);
    return { success: false, error: msg };
  }
}
