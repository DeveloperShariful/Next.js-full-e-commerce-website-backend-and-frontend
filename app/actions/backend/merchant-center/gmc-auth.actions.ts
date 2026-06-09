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
// 7. FETCH AVAILABLE ADS ACCOUNTS (🚀 FIXED: NO MORE SILENT FAILURES)
// ============================================================================
export async function fetchAvailableAdsAccounts() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true, googleRefreshToken: true }
    });

    if (!config?.googleAccessToken) return { success: false, error: "Google account not connected." };
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken || devToken.trim() === "") return { success: true, needsManualInput: true, accounts: [] };

    let activeToken = config.googleAccessToken;
    try {
      const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth.setCredentials({ refresh_token: config.googleRefreshToken });
      const { token } = await oauth.getAccessToken();
      if (token) activeToken = token;
    } catch (e) {
      console.error("Token refresh error in fetch accounts.");
    }

    const response = await fetch("https://googleads.googleapis.com/v24/customers:listAccessibleCustomers", {
      method: "GET",
      headers: { "Authorization": `Bearer ${activeToken}`, "developer-token": devToken.trim() },
      cache: "no-store", 
    });

    // 🚀 FIX: আমি এই জায়গাটা বাদ দিয়েছিলাম! এখন গুগলের এরর সরাসরি স্ক্রিনে এবং টার্মিনালে দেখাবে
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("\n❌ GOOGLE API ERROR (FETCH ACCOUNTS):", JSON.stringify(errData, null, 2));
      return { 
        success: false, 
        error: errData?.error?.message || "Failed to fetch accounts. Token might be expired or restricted.", 
        accounts: [] 
      }; 
    }

    const data = await response.json();
    const resourceNames = data.resourceNames || [];

    if (resourceNames.length === 0) return { success: true, accounts: [], needsManualInput: false };

    const accountsWithNames = await Promise.all(
      resourceNames.map(async (resource: string) => {
        const customerId = resource.replace("customers/", "");
        const formattedId = customerId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
        
        try {
          const metadataResponse = await fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:search`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeToken}`,
              "developer-token": devToken.trim(),
              "Content-Type": "application/json",
              "login-customer-id": customerId 
            },
            body: JSON.stringify({
              query: "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1"
            }),
            cache: "no-store",
          });

          if (metadataResponse.ok) {
            const metaData = await metadataResponse.json();
            const customerObj = metaData[0]?.results?.[0]?.customer;
            
            if (customerObj) {
              const accName = customerObj.descriptiveName || "Unnamed Account";
              const isManager = customerObj.manager === true;
              const typeLabel = isManager ? "[Manager]" : "[Ads Account]";

              return { id: customerId, name: `${typeLabel} ${accName} (${formattedId})` };
            }
          }
          return { id: customerId, name: `Ads Account: ${formattedId}` };
        } catch (apiSubError) {
          return { id: customerId, name: `Ads Account: ${formattedId}` };
        }
      })
    );

    const sortedAccounts = accountsWithNames.sort((a, b) => {
      if (a.name.includes("[Manager]")) return -1;
      if (b.name.includes("[Manager]")) return 1;
      return 0;
    });

    return { success: true, accounts: sortedAccounts, needsManualInput: false };
  } catch (error: any) {
    console.error("Ads API Exception:", error);
    return { success: false, error: "Server Exception Occurred.", accounts: [] };
  }
}

// ============================================================================
// 🚀 7. MAGIC FEATURE: AUTO-FETCH & SAVE CONVERSION TRACKING ID & LABEL (FIXED REGEX)
// ============================================================================
export async function autoFetchAndSaveConversions(accountId: string) {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true, googleRefreshToken: true }
    });
    
    if (!config?.googleAccessToken) return { success: false, error: "Token not found." };
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken) return { success: false, error: "Developer token missing." };

    let activeToken = config.googleAccessToken;
    try {
      const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth.setCredentials({ refresh_token: config.googleRefreshToken });
      const { token } = await oauth.getAccessToken();
      if (token) activeToken = token;
    } catch (e) {}

    const formattedAccountId = accountId.replace(/-/g, "");
    const headers = {
      "Authorization": `Bearer ${activeToken}`,
      "developer-token": devToken.trim(),
      "Content-Type": "application/json",
      "login-customer-id": formattedAccountId 
    };

    const query = `
      SELECT conversion_action.id, conversion_action.type, conversion_action.tag_snippets 
      FROM conversion_action 
      WHERE conversion_action.status = 'ENABLED' 
      ORDER BY conversion_action.id DESC LIMIT 1
    `;

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

    if (snippets.length === 0) {
       return { success: true, found: false, message: "Could not find any active Conversion Action. Please create one manually in Google Ads." };
    }

    const eventSnippet = snippets[0].eventSnippet || "";
    const globalSiteTag = snippets[0].globalSiteTag || "";

    // 🚀 ১০০% বুলেটপ্রুফ রেগুলার এক্সপ্রেশন (সিঙ্গেল/ডাবল কোটেশন যাই থাকুক, আইডি ও লেবেল কেটে বের করবে)
    const idMatch = globalSiteTag.match(/AW-\d+/) || eventSnippet.match(/AW-\d+/);
    const convId = idMatch ? idMatch[0] : null;

    // লেবেল কাটার ফ্লেক্সিবল লজিক
    const labelMatch = eventSnippet.match(/AW-\d+\/([a-zA-Z0-9_ -]+)/);
    const convLabel = labelMatch ? labelMatch[1] : null;

    if (convId && convLabel) {
       await db.marketingIntegration.update({
         where: { id: "marketing_config" },
         data: { googleAdsConversionId: convId, googleAdsConversionLabel: convLabel }
       });
       revalidatePath("/admin/marketing/merchant-center");
       return { success: true, found: true, convId, convLabel };
    }

    return { success: true, found: false, message: "Found a conversion action but could not parse the exact tags." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 🚀 8. NEW FEATURE: FETCH ALL AVAILABLE CONVERSION ACTIONS (FOR THE DROPDOWN)
// ============================================================================
export async function fetchAvailableConversionActions(accountId: string) {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true, googleRefreshToken: true }
    });
    
    if (!config?.googleAccessToken) return { success: false, error: "Google account not connected." };
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!devToken) return { success: false, error: "Developer token is missing." };

    let activeToken = config.googleAccessToken;
    try {
      const oauth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth.setCredentials({ refresh_token: config.googleRefreshToken });
      const { token } = await oauth.getAccessToken();
      if (token) activeToken = token;
    } catch (e) {}

    const formattedAccountId = accountId.replace(/-/g, "");
    const headers = {
      "Authorization": `Bearer ${activeToken}`,
      "developer-token": devToken.trim(),
      "Content-Type": "application/json",
      "login-customer-id": formattedAccountId 
    };

    // 🚀 গুগলের সবকটি একটিভ কনভার্সন অ্যাকশন নিয়ে আসার কোয়েরি
    const query = `
      SELECT conversion_action.id, conversion_action.name, conversion_action.tag_snippets 
      FROM conversion_action 
      WHERE conversion_action.status = 'ENABLED'
    `;

    const response = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`, {
        method: "POST", headers, cache: "no-store", body: JSON.stringify({ query }),
    });

    if (!response.ok) {
       const err = await response.json().catch(()=>({}));
       return { success: false, error: err?.error?.message || "Failed to fetch conversion actions." };
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
       return { success: true, actions: [] };
    }

    // 🚀 প্রতিটি কনভার্সনের নাম, আইডি এবং তাদের ভেতরের ট্যাগ কেটে লিস্ট বানানো হচ্ছে
    const actionsList = results.map((row: any) => {
      const action = row.conversionAction || {};
      const name = action.name || "Unnamed Action";
      const id = String(action.id || "");
      const snippets = action.tagSnippets || [];
      
      let convId = "";
      let convLabel = "";

      if (snippets.length > 0) {
        const eventSnippet = snippets[0].eventSnippet || "";
        const globalSiteTag = snippets[0].globalSiteTag || "";

        const idMatch = globalSiteTag.match(/AW-\d+/) || eventSnippet.match(/AW-\d+/);
        convId = idMatch ? idMatch[0] : "";

        const labelMatch = eventSnippet.match(/AW-\d+\/([a-zA-Z0-9_ -]+)/);
        convLabel = labelMatch ? labelMatch[1] : "";
      }

      return {
        id,
        name, // যেমন: "Go Bike's Purchase"
        convId,
        convLabel
      };
    });

    return { success: true, actions: actionsList };
  } catch (error: any) {
    console.error("Error in fetchAvailableConversionActions:", error);
    return { success: false, error: error.message };
  }
}