//File Path: app/actions/backend/marketing/gmc-onboarding.actions.ts
//
// Merchant API (v1)-এ migrate করা হয়েছে — accounts.authinfo() → accounts.list(),
// accounts.update()+accounts.claimwebsite() → accounts.homepage.updateHomepage()+claim().
// googleapis@169.0.0-এর bundled .d.ts টাইপ ডেফিনিশন সরাসরি পড়ে যাচাই করা।

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { security } from "@/lib/security";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

// ============================================================================
// HELPER: GET AUTHENTICATED CLIENT
// ============================================================================
async function getAuthenticatedClient() {
  const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });

  if (!config?.googleRefreshToken) {
    throw new Error("Google account is not fully connected.");
  }

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });

  return { auth: oauth2Client, config };
}

// ============================================================================
// 1. FETCH AVAILABLE MERCHANT ACCOUNTS
// ============================================================================
export async function fetchAvailableMerchantAccounts() {
  await security.assertAdmin();
  try {
    const { auth } = await getAuthenticatedClient();
    const merchantapi = google.merchantapi({ version: "accounts_v1", auth });

    const response = await merchantapi.accounts.list({});
    const accounts = response.data.accounts || [];

    const formattedAccounts = accounts
      .filter((acc) => acc.accountId != null)
      .map((acc) => ({
        id: String(acc.accountId),
        name: acc.accountName ?? `Merchant ID: ${acc.accountId}`,
      }));

    return { success: true, accounts: formattedAccounts };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching merchant accounts:", msg);
    return { success: false, error: "Failed to fetch Google Merchant accounts. Make sure your Google account has access." };
  }
}

// ============================================================================
// 2. SAVE SELECTED ACCOUNT & ADVANCE STEP
// ============================================================================
export async function saveSelectedMerchantAccount(merchantId: string, merchantName: string) {
  await security.assertAdmin();
  try {
    if (!merchantId || !/^\d+$/.test(merchantId.trim())) {
      return { success: false, error: "Invalid Merchant ID — must be a numeric value." };
    }

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        gmcMerchantId: merchantId.trim(),
        gmcMerchantName: merchantName,
        gmcSetupStep: 2,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error saving merchant account:", error);
    return { success: false, error: "Failed to save selected account." };
  }
}

// ============================================================================
// 3. AUTO VERIFY & CLAIM DOMAIN
// ============================================================================
export async function autoClaimWebsiteDomain() {
  await security.assertAdmin();
  try {
    // Localhost bypass — domain claim not possible locally
    if (SITE_URL.includes("localhost")) {
      await db.marketingIntegration.update({
        where: { id: "marketing_config" },
        data: { gmcDomainClaimed: true, gmcSetupStep: 3 },
      });
      revalidatePath("/admin/marketing/merchant-center");
      return { success: true, message: "Localhost bypass: Domain claimed virtually!" };
    }

    const { auth, config } = await getAuthenticatedClient();
    if (!config?.gmcMerchantId) return { success: false, error: "No Merchant Center account selected." };

    const merchantapi = google.merchantapi({ version: "accounts_v1", auth });
    const homepageName = `accounts/${config.gmcMerchantId}/homepage`;

    // প্রথমে homepage URI সেট করা (v2.1-এর accounts.update({websiteUrl}) এর সমতুল্য)
    await merchantapi.accounts.homepage.updateHomepage({
      name: homepageName,
      updateMask: "uri",
      requestBody: { uri: SITE_URL },
    });

    // তারপর claim করা (v2.1-এর accounts.claimwebsite() এর সমতুল্য)
    await merchantapi.accounts.homepage.claim({ name: homepageName });

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: { gmcDomainClaimed: true, gmcSetupStep: 3 },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Domain successfully claimed!" };
  } catch (error: unknown) {
    const errorMsg =
      (error instanceof Error ? error.message : "Unknown error");
    console.error("Error claiming domain:", errorMsg);
    return { success: false, error: `Domain Claim Failed: ${errorMsg}` };
  }
}

// ============================================================================
// 4. COMPLETE SETUP WIZARD
// ============================================================================
export async function completeGmcSetup() {
  await security.assertAdmin();
  try {
    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: { gmcSetupStep: 4, gmcContentApiEnabled: true },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to complete setup." };
  }
}
