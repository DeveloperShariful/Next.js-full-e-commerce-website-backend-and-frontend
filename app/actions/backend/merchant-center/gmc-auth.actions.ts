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

// ============================================================================
// 1. GENERATE AUTHENTICATION URL
// ============================================================================
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

// ============================================================================
// 2. PROCESS GOOGLE OAUTH CALLBACK (Saves Token and User Info)
// ============================================================================
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

// ============================================================================
// 3. DISCONNECT GOOGLE ACCOUNT (Complete Wipeout of GMC, Ads, and Conversion Data)
// ============================================================================
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
        googleAdsLinkStatus: "UNLINKED",
        googleAdsConversionId: null,
        googleAdsConversionLabel: null,
        googleAdsEnhancedConversionsEnabled: false,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Google account disconnected." };
  } catch (error: any) {
    console.error("Error disconnecting Google account:", error);
    return { success: false, error: "Failed to disconnect Google account." };
  }
}

// ============================================================================
// 4. SAVE CONNECTED ADS ACCOUNT (Updates Linking and default conversion setup)
// ============================================================================
export async function saveGoogleAdsAccount(accountId: string, accountName: string) {
  try {
    if (!accountId) return { success: false, error: "Google Ads Account ID is required." };

    const formattedId = accountId.replace(/-/g, "");

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAdsAccountId: formattedId, 
        googleAdsAccountName: accountName || `Ads Account: ${accountId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`,
        googleAdsConnected: true,
        googleAdsLinkStatus: "LINKED", // ডোমেইন ও অ্যাকাউন্ট সফলভাবে লিঙ্ক করা হয়েছে
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Google Ads account connected successfully!" };
  } catch (error: any) {
    console.error("Error saving Google Ads account:", error);
    return { success: false, error: "Failed to save Google Ads account." };
  }
}

// ============================================================================
// 5. DISCONNECT GOOGLE ADS ACCOUNT ONLY (Wipes Ads data while maintaining GMC)
// ============================================================================
export async function disconnectGoogleAdsAccount() {
  try {
    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAdsAccountId: null,
        googleAdsAccountName: null,
        googleAdsConnected: false,
        googleAdsLinkStatus: "UNLINKED",
        googleAdsConversionId: null,
        googleAdsConversionLabel: null,
        googleAdsEnhancedConversionsEnabled: false,
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
// 🚀 6. FETCH AVAILABLE ADS ACCOUNTS (Upgraded to Stable v17 REST API)
// ============================================================================
/**
 * এই ফাংশনটি গুগলের এপিআই ভার্সন ১৭ ব্যবহার করে সাকসেসফুলি অ্যাকাউন্ট লিস্ট আনবে।
 * এছাড়াও প্রতিটি কাস্টমার আইডির ডেসক্রিপটিভ নাম ও কারেন্সি কোড প্যারালালি ফেচ করবে।
 */
export async function fetchAvailableAdsAccounts() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true }
    });

    if (!config?.googleAccessToken) return { success: false, error: "Google account not connected." };

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    
    // ডেভলপার টোকেন না থাকলে সরাসরি ম্যানুয়াল মোড অ্যাক্টিভ হবে
    if (!devToken) {
      return { success: true, needsManualInput: true, accounts: [] };
    }

    // 🚀 গুগলের সম্পূর্ণ সচল ও একটিভ v17 API কল করা হয়েছে (৪MD৪ সমাধান)
    const response = await fetch("https://googleads.googleapis.com/v17/customers:listAccessibleCustomers", {
      headers: {
        "Authorization": `Bearer ${config.googleAccessToken}`,
        "developer-token": devToken,
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `API Error: Status Code ${response.status}`;

      console.error("\n=================== 🔴 GOOGLE ADS API ERROR (v17) 🔴 ===================");
      console.error(`Request URL: https://googleads.googleapis.com/v17/customers:listAccessibleCustomers`);
      console.error(`HTTP Status: ${response.status} (${response.statusText})`);
      console.error(`Error Details:`, JSON.stringify(errData, null, 2));
      console.error("========================================================================\n");

      return { success: false, error: errMsg }; 
    }

    const data = await response.json();
    const resourceNames = data.resourceNames || [];

    if (resourceNames.length === 0) {
      return { success: true, accounts: [], needsManualInput: false };
    }

    // 🚀 এন্টারপ্রাইজ ফিচার: প্রতিটি কাস্টমার আইডির ডেসক্রিপটিভ নাম ও কারেন্সি বের করা
    const accountsWithNames = await Promise.all(
      resourceNames.map(async (resource: string) => {
        const customerId = resource.replace("customers/", "");
        
        try {
          // কাস্টমার মেটাডেটা সার্চ করার জন্য সার্চ স্ট্রীম কুয়েরি পাঠানো হচ্ছে
          const metadataResponse = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.googleAccessToken}`,
              "developer-token": devToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: "SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1"
            })
          });

          if (metadataResponse.ok) {
            const metaData = await metadataResponse.json();
            const customerObj = metaData[0]?.results?.[0]?.customer;
            
            if (customerObj && customerObj.descriptiveName) {
              return {
                id: customerId,
                name: `${customerObj.descriptiveName} (${customerObj.currencyCode || "AUD"}) - ${customerId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`
              };
            }
          }
        } catch (apiSubError) {
          console.warn(`Failed to fetch descriptive name for Ads account ${customerId}:`, apiSubError);
        }

        // Fallback: যদি মেটাডাটা রিড করার পারমিশন না থাকে তবে কাস্টম নাম দেখাবে
        return {
          id: customerId,
          name: `Ads Account: ${customerId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`,
        };
      })
    );

    return { success: true, accounts: accountsWithNames, needsManualInput: false };
  } catch (error: any) {
    console.error("\n=================== 💥 GOOGLE ADS API EXCEPTION 💥 ===================");
    console.error(error);
    console.error("====================================================================\n");
    return { success: false, error: error.message || "Failed to fetch accounts from Google API." };
  }
}