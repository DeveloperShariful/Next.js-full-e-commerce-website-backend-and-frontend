//File Path: app/actions/backend/merchant-center/gmc-auth.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma"; // 👈 আপনার কাস্টম ডাটাবেস ইম্পোর্ট
import { revalidatePath } from "next/cache";

// ============================================================================
// 1. OAUTH CONFIGURATION (Shopify/WooCommerce Level Setup)
// ============================================================================
// Google Cloud Console থেকে পাওয়া Credentials. এগুলো .env ফাইলে থাকতে হবে।
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
// Redirect URI হবে: https://yourdomain.com/api/auth/google/callback
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// Google API Client ইনিশিয়ালাইজেশন
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// গুগলের যেসব পারমিশন আমাদের লাগবে (Content API এবং User Profile)
const SCOPES = [
  "https://www.googleapis.com/auth/content", // Merchant Center এ প্রোডাক্ট সিঙ্ক করার জন্য
  "https://www.googleapis.com/auth/userinfo.email", // কোন ইমেইল দিয়ে কানেক্ট করেছে তা দেখার জন্য
];

// ============================================================================
// 2. GENERATE GOOGLE LOGIN URL
// ============================================================================
/**
 * এডমিন যখন "Connect Google" বাটনে ক্লিক করবে, তখন এই ফাংশন কল হবে।
 * এটি একটি সিকিউর URL তৈরি করে দিবে, যেখানে গিয়ে এডমিন পারমিশন দিবে।
 */
export async function getGoogleAuthUrl() {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Offline access খুবই জরুরি, এটি ছাড়া refresh_token দিবে না
      prompt: "consent",      // Consent দিলে প্রতিবার নতুন করে refresh_token পাওয়া যায়
      scope: SCOPES,
    });

    return { success: true, url: authUrl };
  } catch (error: any) {
    console.error("Error generating Google Auth URL:", error);
    return { success: false, error: "Failed to generate authentication URL." };
  }
}

// ============================================================================
// 3. HANDLE CALLBACK & SAVE TOKENS
// ============================================================================
/**
 * গুগল যখন রিডাইরেক্ট করে কোড (Code) ফেরত পাঠাবে, তখন API Route এই ফাংশনটি কল করবে।
 * এটি কোড এক্সচেঞ্জ করে টোকেন নিবে এবং ডাটাবেসে MarketingIntegration টেবিলে সেভ করবে।
 */
export async function processGoogleCallback(code: string) {
  try {
    // 1. কোড দিয়ে গুগলের কাছ থেকে টোকেন নেওয়া
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2. কোন জিমেইল দিয়ে লগইন করেছে সেটা বের করা
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const adminEmail = userInfo.data.email;

    // 3. ডাটাবেস আপডেট করা (db.upsert ব্যবহার করে)
    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        googleAccountId: adminEmail,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || undefined,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmcSetupStep: 1, // 🔥 FIX: লগইন সাকসেস হলে উইজার্ডকে Step 2 (Select Account) এ পাঠিয়ে দিবে
      },
      create: {
        id: "marketing_config",
        googleAccountId: adminEmail,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmcSetupStep: 1, // 🔥 FIX: উইজার্ড স্টেপ আপডেট
      },
    });

    return { success: true, email: adminEmail };
  } catch (error: any) {
    console.error("Error processing Google Callback:", error);
    return { success: false, error: error.message || "Failed to process Google login." };
  }
}

// ============================================================================
// 4. DISCONNECT GOOGLE ACCOUNT
// ============================================================================
/**
 * এডমিন যখন "Disconnect" এ ক্লিক করবে, তখন ডাটাবেস থেকে টোকেন রিমুভ হবে 
 * এবং গুগলের সার্ভার থেকেও টোকেন রিভোক (Revoke) করে দেওয়া হবে সিকিউরিটির জন্য।
 */
export async function disconnectGoogleAccount() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: { googleAccessToken: true },
    });

    // গুগলের সার্ভার থেকে টোকেন ইনভ্যালিড করা (Best Practice)
    if (config?.googleAccessToken) {
      try {
        await oauth2Client.revokeToken(config.googleAccessToken);
      } catch (revokeError) {
        console.warn("Token revoke failed at Google API, but will delete locally.", revokeError);
      }
    }

    // ডাটাবেস থেকে গুগলের ক্রেডেনশিয়াল মুছে ফেলা
    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAccountId: null,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        gmcContentApiEnabled: false, // ডিসকানেক্ট করলে সিঙ্ক অটো অফ হয়ে যাবে
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Google account disconnected successfully." };
  } catch (error: any) {
    console.error("Error disconnecting Google account:", error);
    return { success: false, error: "Failed to disconnect Google account." };
  }
}