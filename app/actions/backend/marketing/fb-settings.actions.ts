//app/actions/backend/marketing/fb-settings.actions.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface FbSettingsData {
  fbEnabled: boolean;
  fbPixelId: string;
  fbAccessToken: string;
  fbTestEventCode: string;
  fbDomainVerification: string;
}

// ============================================================================
// 1. GET FACEBOOK SETTINGS
// ============================================================================
export async function getFbSettings() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        fbEnabled: true,
        fbPixelId: true,
        fbAccessToken: true,
        fbTestEventCode: true,
        fbDomainVerification: true,
      },
    });

    if (!config) {
      return {
        success: true,
        data: {
          fbEnabled: false,
          fbPixelId: "",
          fbAccessToken: "",
          fbTestEventCode: "",
          fbDomainVerification: "",
        }
      };
    }

    return {
      success: true,
      data: {
        fbEnabled: config.fbEnabled,
        fbPixelId: config.fbPixelId || "",
        fbAccessToken: config.fbAccessToken || "",
        fbTestEventCode: config.fbTestEventCode || "",
        fbDomainVerification: config.fbDomainVerification || "",
      }
    };
  } catch (error: any) {
    console.error("Error fetching Facebook settings:", error);
    return { success: false, error: "Failed to fetch Facebook settings." };
  }
}

// ============================================================================
// 1B. GET FACEBOOK PRODUCT SYNC STATS
// ============================================================================
export async function getFbProductStats() {
  try {
    const [syncShow, syncOnly, excluded, total] = await Promise.all([
      db.product.count({ where: { status: "ACTIVE", deletedAt: null, facebookSyncMode: "SYNC_AND_SHOW" } }),
      db.product.count({ where: { status: "ACTIVE", deletedAt: null, facebookSyncMode: "SYNC_ONLY" } }),
      db.product.count({ where: { status: "ACTIVE", deletedAt: null, facebookSyncMode: "EXCLUDED" } }),
      db.product.count({ where: { status: "ACTIVE", deletedAt: null } }),
    ]);
    // products with NULL facebookSyncMode are treated as SYNC_AND_SHOW by default
    const nullCount = total - syncShow - syncOnly - excluded;
    return { success: true, data: { syncShow: syncShow + nullCount, syncOnly, excluded, total } };
  } catch {
    return { success: false, data: { syncShow: 0, syncOnly: 0, excluded: 0, total: 0 } };
  }
}

// ============================================================================
// 2. UPDATE FACEBOOK SETTINGS
// ============================================================================
export async function updateFbSettings(data: FbSettingsData) {
  try {
    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        fbEnabled: data.fbEnabled,
        fbPixelId: data.fbPixelId.trim(),
        fbAccessToken: data.fbAccessToken.trim(),
        fbTestEventCode: data.fbTestEventCode.trim(),
        fbDomainVerification: data.fbDomainVerification.trim(),
      },
      create: {
        id: "marketing_config",
        fbEnabled: data.fbEnabled,
        fbPixelId: data.fbPixelId.trim(),
        fbAccessToken: data.fbAccessToken.trim(),
        fbTestEventCode: data.fbTestEventCode.trim(),
        fbDomainVerification: data.fbDomainVerification.trim(),
      },
    });

    revalidatePath("/admin/marketing/facebook");
    return { success: true, message: "Facebook settings saved successfully!" };
  } catch (error: any) {
    console.error("Error updating Facebook settings:", error);
    return { success: false, error: "An error occurred while saving Facebook settings." };
  }
}