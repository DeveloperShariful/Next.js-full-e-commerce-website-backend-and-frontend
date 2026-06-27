//File Path: app/actions/backend/marketing/gmc-auth.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { security } from "@/lib/security";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

const SCOPES = [
  "https://www.googleapis.com/auth/content",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/siteverification",
  "https://www.googleapis.com/auth/adwords",
  "https://www.googleapis.com/auth/tagmanager.readonly",
];

// ============================================================================
// HELPER: Refresh access token and return the active token
// ============================================================================
async function getActiveToken(refreshToken: string): Promise<string | null> {
  try {
    const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    oauth.setCredentials({ refresh_token: refreshToken });
    const { token } = await oauth.getAccessToken();
    return token ?? null;
  } catch {
    console.warn("Token refresh failed.");
    return null;
  }
}

// ============================================================================
// HELPER: Fetch config and validate token for Google Ads API calls
// ============================================================================
async function getAdsToken(): Promise<{ token: string; devToken: string; config: { googleAdsAccountId: string | null } } | null> {
  const config = await db.marketingIntegration.findUnique({
    where: { id: "marketing_config" },
    select: { googleAccessToken: true, googleRefreshToken: true, googleAdsAccountId: true },
  });
  if (!config?.googleAccessToken) return null;

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) return null;

  const activeToken =
    config.googleRefreshToken
      ? (await getActiveToken(config.googleRefreshToken)) ?? config.googleAccessToken
      : config.googleAccessToken;

  return { token: activeToken, devToken: devToken.trim(), config: { googleAdsAccountId: config.googleAdsAccountId } };
}

// ============================================================================
// 1. GENERATE AUTHENTICATION URL
// ============================================================================
export async function getGoogleAuthUrl() {
  await security.assertAdmin();
  try {
    const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
    return { success: true, url: authUrl };
  } catch (error: unknown) {
    console.error("Error generating Google Auth URL:", error);
    return { success: false, error: "Failed to generate authentication URL." };
  }
}

// ============================================================================
// 2. PROCESS GOOGLE OAUTH CALLBACK (called from API route, not client)
// ============================================================================
export async function processGoogleCallback(code: string) {
  try {
    const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
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
        googleRefreshToken: tokens.refresh_token ?? undefined,
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process Google login.";
    console.error("Error processing Google Callback:", error);
    return { success: false, error: msg };
  }
}

// ============================================================================
// 3. DISCONNECT GOOGLE ACCOUNT
// ============================================================================
export async function disconnectGoogleAccount() {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true },
    });

    if (config?.googleAccessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
        await oauth2Client.revokeToken(config.googleAccessToken);
      } catch {
        console.warn("Token revoke failed in background.");
      }
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
  } catch (error: unknown) {
    console.error("Error disconnecting Google account:", error);
    return { success: false, error: "Failed to disconnect Google account." };
  }
}

// ============================================================================
// 4. SAVE CONNECTED ADS ACCOUNT
// ============================================================================
export async function saveGoogleAdsAccount(accountId: string, accountName: string) {
  await security.assertAdmin();
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
  } catch (error: unknown) {
    console.error("Error saving Google Ads account:", error);
    return { success: false, error: "Failed to save Google Ads account." };
  }
}

// ============================================================================
// 5. DISCONNECT GOOGLE ADS ACCOUNT
// ============================================================================
export async function disconnectGoogleAdsAccount() {
  await security.assertAdmin();
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
  } catch (error: unknown) {
    console.error("Error disconnecting Google Ads account:", error);
    return { success: false, error: "Failed to disconnect Google Ads account." };
  }
}

// ============================================================================
// 6. FETCH AVAILABLE ADS ACCOUNTS
// ============================================================================
export async function fetchAvailableAdsAccounts() {
  await security.assertAdmin();
  try {
    const adsAuth = await getAdsToken();
    if (!adsAuth) {
      const config = await db.marketingIntegration.findUnique({
        where: { id: "marketing_config" },
        select: { googleAccessToken: true },
      });
      if (!config?.googleAccessToken) return { success: false, error: "Google account not connected.", accounts: [] };

      const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      if (!devToken || devToken.trim() === "") return { success: true, needsManualInput: true, accounts: [] };
      return { success: false, error: "Token unavailable.", accounts: [] };
    }

    const { token, devToken } = adsAuth;

    const response = await fetch("https://googleads.googleapis.com/v24/customers:listAccessibleCustomers", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "developer-token": devToken },
      cache: "no-store",
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      console.error("Google Ads List API Error:", JSON.stringify(errData));
      return {
        success: false,
        error: errData?.error?.message || "Failed to fetch accounts.",
        accounts: [],
      };
    }

    const data = await response.json() as { resourceNames?: string[] };
    const resourceNames = data.resourceNames || [];
    if (resourceNames.length === 0) return { success: true, accounts: [], needsManualInput: false };

    const accountsWithNames = await Promise.all(
      resourceNames.map(async (resource: string) => {
        const customerId = resource.replace("customers/", "");
        const formattedId = customerId.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
        try {
          const metaRes = await fetch(
            `https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:search`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "developer-token": devToken,
                "Content-Type": "application/json",
                "login-customer-id": customerId,
              },
              body: JSON.stringify({
                query: "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1",
              }),
              cache: "no-store",
            }
          );
          if (metaRes.ok) {
            const metaData = await metaRes.json() as { results?: { customer?: { descriptiveName?: string; manager?: boolean } }[] }[];
            const customerObj = metaData[0]?.results?.[0]?.customer;
            if (customerObj) {
              const accName = customerObj.descriptiveName || "Unnamed Account";
              const typeLabel = customerObj.manager ? "[Manager]" : "[Ads Account]";
              return { id: customerId, name: `${typeLabel} ${accName} (${formattedId})` };
            }
          }
        } catch {
          // fallback to ID only
        }
        return { id: customerId, name: `Ads Account: ${formattedId}` };
      })
    );

    const sortedAccounts = accountsWithNames.sort((a, b) => {
      if (a.name.includes("[Manager]")) return -1;
      if (b.name.includes("[Manager]")) return 1;
      return 0;
    });

    return { success: true, accounts: sortedAccounts, needsManualInput: false };
  } catch (error: unknown) {
    console.error("Ads API Exception:", error);
    return { success: false, error: "Server Exception Occurred.", accounts: [] };
  }
}

// ============================================================================
// 7. AUTO-FETCH CONVERSION TRACKING FROM ADS
// ============================================================================
export async function autoFetchAndSaveConversions(accountId: string) {
  await security.assertAdmin();
  try {
    const adsAuth = await getAdsToken();
    if (!adsAuth) return { success: false, error: "Token not found or developer token missing." };

    const { token, devToken } = adsAuth;
    const formattedAccountId = accountId.replace(/-/g, "");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "developer-token": devToken,
      "Content-Type": "application/json",
      "login-customer-id": formattedAccountId,
    };

    const query = `
      SELECT conversion_action.id, conversion_action.type, conversion_action.tag_snippets
      FROM conversion_action
      WHERE conversion_action.status = 'ENABLED'
      ORDER BY conversion_action.id DESC LIMIT 1
    `;

    const searchRes = await fetch(
      `https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`,
      { method: "POST", headers, cache: "no-store", body: JSON.stringify({ query }) }
    );

    if (!searchRes.ok) {
      return { success: true, found: false, message: "Could not find any active Conversion Action." };
    }

    const data = await searchRes.json() as { results?: { conversionAction?: { tagSnippets?: { eventSnippet?: string; globalSiteTag?: string }[] } }[] };
    const results = data.results || [];
    const snippets = results[0]?.conversionAction?.tagSnippets ?? [];

    if (snippets.length === 0) {
      return { success: true, found: false, message: "No active Conversion Action found. Please create one manually in Google Ads." };
    }

    const eventSnippet = snippets[0].eventSnippet ?? "";
    const globalSiteTag = snippets[0].globalSiteTag ?? "";

    const idMatch = globalSiteTag.match(/AW-\d+/) ?? eventSnippet.match(/AW-\d+/);
    const convId = idMatch ? idMatch[0] : null;

    const labelMatch = eventSnippet.match(/AW-\d+\/([a-zA-Z0-9_ -]+)/);
    const convLabel = labelMatch ? labelMatch[1] : null;

    if (convId && convLabel) {
      await db.marketingIntegration.update({
        where: { id: "marketing_config" },
        data: { googleAdsConversionId: convId, googleAdsConversionLabel: convLabel },
      });
      revalidatePath("/admin/marketing/merchant-center");
      return { success: true, found: true, convId, convLabel };
    }

    return { success: true, found: false, message: "Found a conversion action but could not parse the tags." };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ============================================================================
// 8. FETCH ALL AVAILABLE CONVERSION ACTIONS (for dropdown)
// ============================================================================
export async function fetchAvailableConversionActions(accountId: string) {
  await security.assertAdmin();
  try {
    const adsAuth = await getAdsToken();
    if (!adsAuth) return { success: false, error: "Google account not connected or developer token missing." };

    const { token, devToken } = adsAuth;
    const formattedAccountId = accountId.replace(/-/g, "");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "developer-token": devToken,
      "Content-Type": "application/json",
      "login-customer-id": formattedAccountId,
    };

    const query = `
      SELECT conversion_action.id, conversion_action.name, conversion_action.tag_snippets
      FROM conversion_action
      WHERE conversion_action.status = 'ENABLED'
    `;

    const response = await fetch(
      `https://googleads.googleapis.com/v24/customers/${formattedAccountId}/googleAds:search`,
      { method: "POST", headers, cache: "no-store", body: JSON.stringify({ query }) }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
      return { success: false, error: err?.error?.message || "Failed to fetch conversion actions." };
    }

    const data = await response.json() as { results?: { conversionAction?: { id?: unknown; name?: string; tagSnippets?: { eventSnippet?: string; globalSiteTag?: string }[] } }[] };
    const results = data.results ?? [];

    if (results.length === 0) return { success: true, actions: [] };

    const actionsList = results.map((row) => {
      const action = row.conversionAction ?? {};
      const name = action.name ?? "Unnamed Action";
      const id = String(action.id ?? "");
      const snippets = action.tagSnippets ?? [];

      let convId = "";
      let convLabel = "";

      if (snippets.length > 0) {
        const eventSnippet = snippets[0].eventSnippet ?? "";
        const globalSiteTag = snippets[0].globalSiteTag ?? "";
        const idMatch = globalSiteTag.match(/AW-\d+/) ?? eventSnippet.match(/AW-\d+/);
        convId = idMatch ? idMatch[0] : "";
        const labelMatch = eventSnippet.match(/AW-\d+\/([a-zA-Z0-9_ -]+)/);
        convLabel = labelMatch ? labelMatch[1] : "";
      }

      return { id, name, convId, convLabel };
    });

    return { success: true, actions: actionsList };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in fetchAvailableConversionActions:", error);
    return { success: false, error: msg };
  }
}
