//app/actions/backend/marketing/gsc-indexing.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface GscConfig {
  gscVerificationCode: string;
  gscServiceAccountJson: string;
}

// ============================================================================
// 1. GET GOOGLE SEARCH CONSOLE CONFIG
// ============================================================================
export async function getGscConfig() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        gscVerificationCode: true,
        gscServiceAccountJson: true
      }
    });

    return {
      success: true,
      data: {
        gscVerificationCode: config?.gscVerificationCode || "",
        gscServiceAccountJson: config?.gscServiceAccountJson || ""
      }
    };
  } catch (error: any) {
    console.error("Error reading GSC config:", error);
    return { success: false, error: "Failed to read Search Console settings." };
  }
}

// ============================================================================
// 2. SAVE GOOGLE SEARCH CONSOLE CONFIG
// ============================================================================
export async function saveGscConfig(data: GscConfig) {
  try {
    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        gscVerificationCode: data.gscVerificationCode.trim(),
        gscServiceAccountJson: data.gscServiceAccountJson.trim()
      },
      create: {
        id: "marketing_config",
        gscVerificationCode: data.gscVerificationCode.trim(),
        gscServiceAccountJson: data.gscServiceAccountJson.trim()
      }
    });

    revalidatePath("/admin/marketing/search-console");
    return { success: true, message: "Google Search Console configuration saved!" };
  } catch (error: any) {
    console.error("Error saving GSC config:", error);
    return { success: false, error: "Failed to save Search Console configuration." };
  }
}

// ============================================================================
// 🚀 3. FORCE INSTANT GOOGLE INDEXING (New Object Format Fix)
// ============================================================================
export async function forceGoogleIndexing(url: string, type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED") {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { gscServiceAccountJson: true }
    });

    if (!config?.gscServiceAccountJson || config.gscServiceAccountJson.trim() === "") {
      return { success: false, error: "Google Service Account JSON Key is missing. Please upload it first." };
    }

    let credentials;
    try {
      credentials = JSON.parse(config.gscServiceAccountJson);
    } catch (e) {
      return { success: false, error: "Invalid JSON format inside Service Account Key." };
    }

    if (!credentials.client_email || !credentials.private_key) {
      return { success: false, error: "Missing required fields (client_email / private_key) in Service Account JSON." };
    }

    // 🚀 FIX: লেটেস্ট google-auth-library নিয়মানুযায়ী সিঙ্গেল অবজেক্ট আকারে JWT তৈরি করা হয়েছে
    const jwtClient = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/indexing"]
    });

    const indexing = google.indexing({
      version: "v3",
      auth: jwtClient
    });

    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url.trim(),
        type: type
      }
    });

    return { 
      success: true, 
      message: "Crawl request successfully accepted by Google!", 
      details: response.data 
    };
  } catch (error: any) {
    console.error("GSC Indexing API Error:", error);
    const apiErrorMsg = error.response?.data?.error?.message || error.message;
    return { success: false, error: apiErrorMsg };
  }
}