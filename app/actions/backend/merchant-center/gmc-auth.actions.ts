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
    console.error("Error processing Google Callback:", error);
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
// 4. SAVE CONNECTED ADS ACCOUNT
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
        googleAdsLinkStatus: "LINKED", 
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
    console.error("Error disconnecting Google Ads account:", error);
    return { success: false, error: "Failed to disconnect Google Ads account." };
  }
}

// ============================================================================
// 6. FETCH AVAILABLE ADS ACCOUNTS
// ============================================================================
export async function fetchAvailableAdsAccounts() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true }
    });

    if (!config?.googleAccessToken) return { success: false, error: "Google account not connected." };

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    
    if (!devToken || devToken.trim() === "") {
      return { success: true, needsManualInput: true, accounts: [] };
    }

    const response = await fetch("https://googleads.googleapis.com/v24/customers:listAccessibleCustomers", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.googleAccessToken}`,
        "developer-token": devToken.trim(),
      },
      cache: "no-store", 
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `API Error: Status Code ${response.status}`;
      if (response.status === 404 || response.status === 403 || response.status === 401) {
         return { success: true, needsManualInput: true, accounts: [] }; 
      }
      return { success: false, error: errMsg }; 
    }

    const data = await response.json();
    const resourceNames = data.resourceNames || [];

    if (resourceNames.length === 0) {
      return { success: true, accounts: [], needsManualInput: false };
    }

    const accountsWithNames = await Promise.all(
      resourceNames.map(async (resource: string) => {
        const customerId = resource.replace("customers/", "");
        const formattedId = customerId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
        
        try {
          const metadataResponse = await fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:search`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.googleAccessToken}`,
              "developer-token": devToken.trim(),
              "Content-Type": "application/json",
              "login-customer-id": customerId 
            },
            body: JSON.stringify({
              query: "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.manager FROM customer LIMIT 1"
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

              return {
                id: customerId,
                name: `${typeLabel} ${accName} (${formattedId})`
              };
            }
          }
        } catch (apiSubError) {
          console.warn(`Failed to fetch details for account ${customerId}:`, apiSubError);
        }

        return { id: customerId, name: `[Unknown] Account ID: ${formattedId}` };
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
    return { success: true, needsManualInput: true, accounts: [] };
  }
}

// ============================================================================
// 🚀 7. NEW: AUTO-FETCH & SAVE CONVERSION TRACKING ID & LABEL
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

    // 🚀 গুগলের ডাটাবেজ থেকে "PURCHASE" টাইপের কনভার্সন অ্যাকশন খোঁজা হচ্ছে
    const query = "SELECT conversion_action.id, conversion_action.type, conversion_action.tag_snippets FROM conversion_action WHERE conversion_action.type = 'PURCHASE' AND conversion_action.status = 'ENABLED' LIMIT 1";

    const res = await fetch(`https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.googleAccessToken}`,
          "developer-token": devToken.trim(),
          "Content-Type": "application/json",
          "login-customer-id": formattedAccountId 
        },
        body: JSON.stringify({ query }),
        cache: "no-store",
    });

    if (!res.ok) {
       return { success: false, error: "Failed to fetch conversion actions. This might be a Manager Account." };
    }
    
    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) {
       return { success: true, found: false, message: "No active Purchase conversion found in Google Ads. You can create one manually." };
    }

    const snippets = results[0]?.conversionAction?.tagSnippets || [];
    if (snippets.length === 0) {
       return { success: true, found: false, message: "No tag snippets found for the conversion action." };
    }

    const eventSnippet = snippets[0].eventSnippet || "";
    const globalSiteTag = snippets[0].globalSiteTag || "";

    // 🚀 Regex Magic: কোড ব্লক থেকে AW-ID এবং Label কেটে বের করা
    const idMatch = globalSiteTag.match(/(AW-\d+)/);
    const convId = idMatch ? idMatch[1] : null;

    const labelMatch = eventSnippet.match(/'send_to':\s*'AW-\d+\/([^']+)'/);
    const convLabel = labelMatch ? labelMatch[1] : null;

    if (convId && convLabel) {
       // ডাটাবেজে অটোমেটিক সেভ করে দেওয়া হচ্ছে
       await db.marketingIntegration.update({
         where: { id: "marketing_config" },
         data: {
           googleAdsConversionId: convId,
           googleAdsConversionLabel: convLabel
         }
       });
       revalidatePath("/admin/marketing/merchant-center");
       return { success: true, found: true, convId, convLabel };
    }

    return { success: true, found: false, message: "Could not parse conversion tags from Google." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}