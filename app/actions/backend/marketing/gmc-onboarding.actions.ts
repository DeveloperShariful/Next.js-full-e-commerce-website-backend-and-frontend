//File Path: app/actions/backend/marketing/gmc-onboarding.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

  return oauth2Client;
}

// ============================================================================
// 1. FETCH AVAILABLE MERCHANT ACCOUNTS
// ============================================================================
/**
 * এডমিন লগইন করার পর, তার জিমেইলের আন্ডারে থাকা সব Merchant Center একাউন্ট ফেচ করবে।
 */
export async function fetchAvailableMerchantAccounts() {
  try {
    const auth = await getAuthenticatedClient();
    const shoppingContent = google.content({ version: "v2.1", auth });

    // Google API থেকে একাউন্ট লিস্ট আনা
    const response = await shoppingContent.accounts.authinfo();
    const accounts = response.data.accountIdentifiers || [];

    // 🔥 FIX: TypeScript কে গ্যারান্টি দেওয়া হচ্ছে যে এগুলো অবশ্যই String হবে
    const formattedAccounts = accounts
      .filter((acc) => acc.merchantId != null) // Null চেক
      .map((acc) => {
        const accData = acc as Record<string, any>; // Type Casting Fix
        return {
          id: String(acc.merchantId), // গ্যারান্টি String
          name: String(accData.accountName || `Merchant ID: ${acc.merchantId}`), // গ্যারান্টি String
        };
      });

    return { success: true, accounts: formattedAccounts };
  } catch (error: any) {
    console.error("Error fetching merchant accounts:", error.message);
    return { success: false, error: "Failed to fetch Google Merchant accounts. Make sure your Google account has access." };
  }
}

// ============================================================================
// 2. SAVE SELECTED ACCOUNT & ADVANCE STEP
// ============================================================================
/**
 * উইজার্ডের Step 2 থেকে এডমিন যখন একাউন্ট সিলেক্ট করে Submit করবে।
 */
export async function saveSelectedMerchantAccount(merchantId: string, merchantName: string) {
  try {
    if (!merchantId) return { success: false, error: "Merchant ID is required." };

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        gmcMerchantId: merchantId,
        gmcMerchantName: merchantName,
        gmcSetupStep: 2, // Step 1 = Auth, Step 2 = Account Selected
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving merchant account:", error);
    return { success: false, error: "Failed to save selected account." };
  }
}

// ============================================================================
// 3. AUTO VERIFY & CLAIM DOMAIN (Shopify Style)
// ============================================================================
/**
 * এটি গুগলের Content API ব্যবহার করে ওয়েবসাইটের ডোমেইন ক্লেইম করবে।
 * (নোট: ইউজারের জিমেইলে আগে থেকেই Google Search Console-এ ডোমেইন ভেরিফাই করা থাকতে হবে,
 * যা স্ট্যান্ডার্ড প্র্যাকটিস। তা না হলে এটি ক্লিয়ার এরর মেসেজ দিবে।)
 */
export async function autoClaimWebsiteDomain() {
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });

    // 🔥 FIX FOR LOCALHOST:
    // লোকালহোস্টে থাকলে গুগলের আসল API কল না করে সরাসরি Step 3 তে পাঠিয়ে দিবে।
    if (SITE_URL.includes("localhost")) {
      await db.marketingIntegration.update({
        where: { id: "marketing_config" },
        data: {
          gmcDomainClaimed: true, // লোকালহোস্টে ফেক ক্লেইম
          gmcSetupStep: 3,        // Move to Step 3
        },
      });
      revalidatePath("/admin/marketing/merchant-center");
      return { success: true, message: "Localhost bypass: Domain claimed virtually!" };
    }

    // ============================================
    // নিচের অংশটুকু লাইভ ওয়েবসাইটের জন্য (আগের মতোই থাকবে)
    // ============================================
    const auth = await getAuthenticatedClient();
    if (!config?.gmcMerchantId) return { success: false, error: "No Merchant Center account selected." };

    const shoppingContent = google.content({ version: "v2.1", auth });

    // ওয়েবসাইটের URL আপডেট করা
    await shoppingContent.accounts.update({
      merchantId: config.gmcMerchantId,
      accountId: config.gmcMerchantId,
      requestBody: { websiteUrl: SITE_URL },
    });

    // ডোমেইন ক্লেইম রিকোয়েস্ট
    await shoppingContent.accounts.claimwebsite({
      merchantId: config.gmcMerchantId,
      accountId: config.gmcMerchantId,
    });

    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        gmcDomainClaimed: true,
        gmcSetupStep: 2,
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Domain successfully claimed!" };
  } catch (error: any) {
    console.error("Error claiming domain:", error.message);
    const errorMsg = error.response?.data?.error?.message || error.message;
    return { success: false, error: `Domain Claim Failed: ${errorMsg}` };
  }
}

// ============================================================================
// 4. COMPLETE SETUP WIZARD
// ============================================================================
/**
 * ম্যাপিং বা সব কাজ শেষ হলে উইজার্ড কমপ্লিট করে মেইন ড্যাশবোর্ড ওপেন করবে।
 */
export async function completeGmcSetup() {
  try {
    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        gmcSetupStep: 4, // 4 = Completed (Main Dashboard Will Show)
        gmcContentApiEnabled: true, // সিঙ্ক অটো অন হয়ে যাবে
      },
    });
    
    revalidatePath("/admin/marketing/merchant-center");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to complete setup." };
  }
}