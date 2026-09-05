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

export interface LocalInventorySettingsData {
  gmcLocalInventoryEnabled: boolean;
  gmcStoreCode: string;
  gmcStorePickupMethod: string; // "" | "buy" | "reserve" | "ship to store" | "not supported"
  gmcStorePickupSla: string; // "" | "same day" | "next day" | "2-day" … "6-day" | "multi-week"
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
// 3. SAVE LOCAL PRODUCT INVENTORY FEED SETTINGS
// ----------------------------------------------------------------------------
// আলাদা action (updateGmcSettings-এর সাথে merge করলে ওই form save করলে এই
// field গুলো wipe হয়ে যেত — saveGoogleAdsConversionSettings-এর মতোই আলাদা রাখা)।
// ============================================================================
const VALID_PICKUP_METHODS = ["", "buy", "reserve", "ship to store", "not supported"];
const VALID_PICKUP_SLAS = [
  "", "same day", "next day", "2-day", "3-day", "4-day", "5-day", "6-day", "multi-week",
];

export async function saveLocalInventorySettings(data: LocalInventorySettingsData) {
  await security.assertAdmin();
  try {
    const storeCode = data.gmcStoreCode.trim();
    if (data.gmcLocalInventoryEnabled && !storeCode) {
      return { success: false, error: "Store code is required to enable the local inventory feed." };
    }
    if (storeCode.length > 64) {
      return { success: false, error: "Store code cannot be longer than 64 characters." };
    }

    const pickupMethod = data.gmcStorePickupMethod.trim().toLowerCase();
    const pickupSla = data.gmcStorePickupSla.trim().toLowerCase();
    if (!VALID_PICKUP_METHODS.includes(pickupMethod)) {
      return { success: false, error: `Invalid pickup method: ${pickupMethod}` };
    }
    if (!VALID_PICKUP_SLAS.includes(pickupSla)) {
      return { success: false, error: `Invalid pickup SLA: ${pickupSla}` };
    }

    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        gmcLocalInventoryEnabled: data.gmcLocalInventoryEnabled,
        gmcStoreCode: storeCode || null,
        gmcStorePickupMethod: pickupMethod || null,
        gmcStorePickupSla: pickupSla || null,
      },
      create: {
        id: "marketing_config",
        gmcLocalInventoryEnabled: data.gmcLocalInventoryEnabled,
        gmcStoreCode: storeCode || null,
        gmcStorePickupMethod: pickupMethod || null,
        gmcStorePickupSla: pickupSla || null,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Local inventory settings saved." };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save local inventory settings.";
    console.error("Error saving local inventory settings:", error);
    return { success: false, error: msg };
  }
}

// ============================================================================
// 4. SAVE GOOGLE ADS CONVERSION & TRACKING SETTINGS
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
