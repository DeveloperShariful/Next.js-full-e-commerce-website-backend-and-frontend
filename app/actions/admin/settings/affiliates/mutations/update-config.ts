// File: app/actions/admin/settings/affiliate/mutations/update-config.ts

"use server";

import { revalidatePath } from "next/cache";
import { affiliateGeneralSchema } from "../schemas";
import { ActionResponse, AffiliateGeneralSettings } from "../types";
import { configService } from "../_services/config-service";

/**
 * SERVER ACTION: Update General Affiliate Configuration
 * This is the API endpoint called by the frontend form.
 */
export async function updateGeneralSettings(
  data: AffiliateGeneralSettings
): Promise<ActionResponse> {
  try {
    // 1. Validation (Double check on server side)
    const result = affiliateGeneralSchema.safeParse(data);

    if (!result.success) {
      // Return formatted validation errors
      return {
        success: false,
        message: "Validation failed. Please check your inputs.",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // 2. Business Logic (Call Service Layer)
    await configService.updateSettings(result.data);

    // 3. Cache Revalidation
    // Revalidate the settings page to show new data
    revalidatePath("/admin/settings/affiliate");
    revalidatePath("/admin/settings/affiliate/general");
    
    // 🔥 Revalidate Global Layout so the entire app (Context) gets new config
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Affiliate configuration updated successfully.",
    };
  } catch (error) {
    console.error("[Mutation] Update Settings Error:", error);
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}