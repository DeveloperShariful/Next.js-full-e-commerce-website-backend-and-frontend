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
    return { success: false, error: "Failed to generate authentication URL." };
  }
}

// ============================================================================
// 2. PROCESS GOOGLE OAUTH CALLBACK
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
    return { success: false, error: error.message || "Failed to process Google login." };
  }
}

// ============================================================================
// 3. DISCONNECT GOOGLE ACCOUNT
// ============================================================================
export async function disconnectGoogleAccount() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true },
    });

    if (config?.googleAccessToken) {
      try { await oauth2Client.revokeToken(config.googleAccessToken); } 
      catch (e) { console.warn("Token revoke failed."); }
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
    return { success: false, error: "Failed to disconnect Google account." };
  }
}

// ============================================================================
// 4. SAVE CONNECTED ADS ACCOUNT
// ============================================================================
export async function saveGoogleAdsAccount(accountId: string, accountName: string) {
  try {
    if (!accountId) return { success: false, error: "Account ID is required." };
    const formattedId = accountId.replace(/-/g, "");

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAdsAccountId: formattedId, 
        googleAdsAccountName: accountName,
        googleAdsConnected: true,
        googleAdsLinkStatus: "LINKED", 
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Google Ads account connected successfully!" };
  } catch (error: any) {
    return { success: false, error: "Failed to save Google Ads account." };
  }
}

// ============================================================================
// 5. DISCONNECT GOOGLE ADS ACCOUNT ONLY
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
    return { success: false, error: "Failed to disconnect Google Ads account." };
  }
}

// ============================================================================
// 🚀 6. WOOCOMMERCE STYLE: FETCH ACCOUNTS WITH EXACT NAMES & MANAGER TYPES
// ============================================================================
export async function fetchAvailableAdsAccounts() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true }
    });

    if (!config?.googleAccessToken) return { success: false, error: "Google account not connected." };
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken || devToken.trim() === "") return { success: true, needsManualInput: true, accounts: [] };

    // ১. প্রথমে Accessible Account ID গুলো আনা
    const rootResponse = await fetch("https://googleads.googleapis.com/v24/customers:listAccessibleCustomers", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.googleAccessToken}`,
        "developer-token": devToken.trim(),
      },
      cache: "no-store", 
    });

    if (!rootResponse.ok) return { success: true, needsManualInput: true, accounts: [] }; 

    const rootData = await rootResponse.json();
    const accessibleCustomers = rootData.resourceNames || [];
    if (accessibleCustomers.length === 0) return { success: true, accounts: [], needsManualInput: false };

    let allAccountsMap = new Map();

    // ২. এবার customer_client কোয়েরি করে ম্যানেজার ও সাব-অ্যাকাউন্ট সবগুলোর ১০০% নিখুঁত নাম বের করা
    await Promise.all(
      accessibleCustomers.map(async (resource: string) => {
        const rootId = resource.replace("customers/", "");
        
        try {
          const searchResponse = await fetch(`https://googleads.googleapis.com/v24/customers/${rootId}/googleAds:search`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.googleAccessToken}`,
              "developer-token": devToken.trim(),
              "Content-Type": "application/json",
              "login-customer-id": rootId 
            },
            body: JSON.stringify({
              // customer_client এপিআই ব্যবহার করে সব ডেটা স্ক্যান করা হচ্ছে
              query: "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager FROM customer_client"
            }),
            cache: "no-store",
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const results = searchData.results || [];
            
            results.forEach((row: any) => {
              const client = row.customerClient;
              if (client) {
                const formattedId = String(client.id).replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
                const accName = client.descriptiveName || "Unnamed Account";
                const isManager = client.manager === true;
                const typeLabel = isManager ? "[Manager Account]" : "[Ads Account]";

                allAccountsMap.set(String(client.id), {
                  id: String(client.id),
                  name: `${typeLabel} ${accName} (${formattedId})`,
                  isManager
                });
              }
            });
          }
        } catch (e) {
          console.warn(`Failed to scan tree for ${rootId}`);
        }
      })
    );

    const finalAccounts = Array.from(allAccountsMap.values());
    if (finalAccounts.length === 0) return { success: true, needsManualInput: true, accounts: [] };

    // Manager অ্যাকাউন্টগুলো উপরে দেখানোর জন্য সর্টিং
    finalAccounts.sort((a, b) => {
      if (a.isManager && !b.isManager) return -1;
      if (!a.isManager && b.isManager) return 1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, accounts: finalAccounts, needsManualInput: false };
  } catch (error: any) {
    return { success: true, needsManualInput: true, accounts: [] };
  }
}

// ============================================================================
// 🚀 7. MAGIC FEATURE: AUTO-FETCH OR AUTO-CREATE CONVERSION TRACKING
// ============================================================================
export async function autoFetchAndSaveConversions(accountId: string) {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true }
    });
    
    if (!config?.googleAccessToken) return { success: false, error: "Token not found." };
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken) return { success: false, error: "Developer token missing." };

    const formattedAccountId = accountId.replace(/-/g, "");

    const headers = {
      "Authorization": `Bearer ${config.googleAccessToken}`,
      "developer-token": devToken.trim(),
      "Content-Type": "application/json",
      "login-customer-id": formattedAccountId 
    };

    // 🚀 ধাপ ১: অ্যাকাউন্টে কোনো Purchase কনভার্সন আছে কিনা চেক করা
    const query = "SELECT conversion_action.id, conversion_action.type, conversion_action.tag_snippets FROM conversion_action WHERE conversion_action.type = 'PURCHASE' AND conversion_action.status = 'ENABLED' LIMIT 1";

    const searchRes = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`, {
        method: "POST", headers, cache: "no-store", body: JSON.stringify({ query }),
    });

    let snippets = [];

    if (searchRes.ok) {
      const data = await searchRes.json();
      const results = data.results || [];
      if (results.length > 0) {
        snippets = results[0]?.conversionAction?.tagSnippets || [];
      }
    }

    // 🚀 ধাপ ২: যদি কনভার্সন না থাকে, তবে অটোমেটিক নতুন একটি ক্রিয়েট করা (WooCommerce Style)
    if (snippets.length === 0) {
      const createRes = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/conversionActions:mutate`, {
        method: "POST", headers, cache: "no-store",
        body: JSON.stringify({
          operations: [{
            create: {
              name: "GoBike Store Purchase (Auto Created)",
              category: "PURCHASE",
              type: "WEBPAGE",
              status: "ENABLED",
              valueSettings: { default_value: 0.0, always_use_default_value: false }
            }
          }]
        })
      });

      if (createRes.ok) {
        // ক্রিয়েট হওয়ার পর আবার কোয়েরি করে নতুন কোড (tag snippet) আনা হচ্ছে
        const newSearchRes = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`, {
          method: "POST", headers, cache: "no-store", body: JSON.stringify({ query }),
        });
        const newData = await newSearchRes.json();
        snippets = newData.results?.[0]?.conversionAction?.tagSnippets || [];
      } else {
        return { success: true, found: false, message: "No conversion found and API lacks permission to create one automatically." };
      }
    }

    if (snippets.length === 0) return { success: true, found: false, message: "Tag snippet generation failed." };

    const eventSnippet = snippets[0].eventSnippet || "";
    const globalSiteTag = snippets[0].globalSiteTag || "";

    // 🚀 ধাপ ৩: Regex দিয়ে AW-ID এবং Label কেটে বের করা
    const idMatch = globalSiteTag.match(/(AW-\d+)/);
    const convId = idMatch ? idMatch[1] : null;

    const labelMatch = eventSnippet.match(/'send_to':\s*'AW-\d+\/([^']+)'/);
    const convLabel = labelMatch ? labelMatch[1] : null;

    if (convId && convLabel) {
       // ডাটাবেজে সেভ করা
       await db.marketingIntegration.update({
         where: { id: "marketing_config" },
         data: { googleAdsConversionId: convId, googleAdsConversionLabel: convLabel }
       });
       revalidatePath("/admin/marketing/merchant-center");
       return { success: true, found: true, convId, convLabel, autoCreated: true };
    }

    return { success: true, found: false, message: "Could not parse conversion tags." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}