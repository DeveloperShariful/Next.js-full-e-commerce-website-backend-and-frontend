//File Path: app/actions/backend/merchant-center/gmc-auth.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/content", 
  "https://www.googleapis.com/auth/userinfo.email", 
  "https://www.googleapis.com/auth/siteverification", 
  "https://www.googleapis.com/auth/adwords" 
];

export async function getGoogleAuthUrl() {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", 
      prompt: "consent",      
      scope: SCOPES,
    });
    return { success: true, url: authUrl };
  } catch (error: any) {
    console.error("Error generating Google Auth URL:", error);
    return { success: false, error: "Failed to generate authentication URL." };
  }
}

export async function processGoogleCallback(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const adminEmail = userInfo.data.email;
    const adminPicture = userInfo.data.picture; 

    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        googleAccountId: adminEmail,
        googleAccountImage: adminPicture, 
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmcSetupStep: 1, 
      },
      create: {
        id: "marketing_config",
        googleAccountId: adminEmail,
        googleAccountImage: adminPicture, 
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmcSetupStep: 1, 
      },
    });

    return { success: true, email: adminEmail };
  } catch (error: any) {
    console.error("Error processing Google Callback:", error);
    return { success: false, error: error.message || "Failed to process Google login." };
  }
}

export async function disconnectGoogleAccount() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true },
    });

    if (config?.googleAccessToken) {
      try { await oauth2Client.revokeToken(config.googleAccessToken); } 
      catch (e) { console.warn("Token revoke failed in background.", e); }
    }

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAccountId: null,
        googleAccountImage: null, 
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        gmcContentApiEnabled: false,
        gmcSetupStep: 0,
        googleAdsAccountId: null,
        googleAdsAccountName: null,
        googleAdsConnected: false,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Google account disconnected." };
  } catch (error: any) {
    console.error("Error disconnecting Google account:", error);
    return { success: false, error: "Failed to disconnect Google account." };
  }
}

export async function saveGoogleAdsAccount(accountId: string, accountName: string) {
  try {
    if (!accountId) return { success: false, error: "Google Ads Account ID is required." };

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAdsAccountId: accountId.replace(/-/g, ""), 
        googleAdsAccountName: accountName || `Account ${accountId}`,
        googleAdsConnected: true,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Google Ads account connected successfully!" };
  } catch (error: any) {
    console.error("Error saving Google Ads account:", error);
    return { success: false, error: "Failed to save Google Ads account." };
  }
}

export async function disconnectGoogleAdsAccount() {
  try {
    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAdsAccountId: null,
        googleAdsAccountName: null,
        googleAdsConnected: false,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Google Ads account disconnected." };
  } catch (error: any) {
    console.error("Error disconnecting Google Ads account:", error);
    return { success: false, error: "Failed to disconnect Google Ads account." };
  }
}

// ============================================================================
// 🚀 FETCH GOOGLE ADS ACCOUNTS (Using Stable v16 REST API - NO MOCK DATA)
// ============================================================================
export async function fetchAvailableAdsAccounts() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true }
    });

    if (!config?.googleAccessToken) return { success: false, error: "Google account not connected." };

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    
    // যদি টোকেন না থাকে, এটি সরাসরি ম্যানুয়াল ইনপুট বক্সে ব্যাক করবে
    if (!devToken) {
      return { success: true, needsManualInput: true, accounts: [] };
    }

    // 🚀 UPDATED: v17 এর জায়গায় v16 এন্ডপয়েন্ট ব্যবহার করা হয়েছে
    const response = await fetch("https://googleads.googleapis.com/v16/customers:listAccessibleCustomers", {
      headers: {
        "Authorization": `Bearer ${config.googleAccessToken}`,
        "developer-token": devToken,
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `API Error: Status Code ${response.status}`;

      console.error("\n=================== 🔴 GOOGLE ADS API ERROR (v16) 🔴 ===================");
      console.error(`Request URL: https://googleads.googleapis.com/v16/customers:listAccessibleCustomers`);
      console.error(`HTTP Status: ${response.status} (${response.statusText})`);
      console.error(`Error Details:`, JSON.stringify(errData, null, 2));
      console.error("========================================================================\n");

      return { success: false, error: errMsg }; 
    }

    const data = await response.json();
    const accounts = (data.resourceNames || []).map((resource: string) => {
      const id = resource.replace("customers/", "");
      return {
        id: id,
        name: `Ads Account: ${id.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`, 
      };
    });

    return { success: true, accounts, needsManualInput: false };
  } catch (error: any) {
    console.error("\n=================== 💥 GOOGLE ADS API EXCEPTION 💥 ===================");
    console.error(error);
    console.error("====================================================================\n");
    return { success: false, error: error.message || "Failed to fetch accounts from Google API." };
  }
}