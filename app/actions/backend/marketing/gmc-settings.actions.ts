//File Path: app/actions/backend/marketing/gmc-settings.actions.ts

"use server";

import { db } from "@/lib/prisma"; 
import { revalidatePath } from "next/cache";

// টাইপ ডিফাইন করা, যাতে টাইপস্ক্রিপ্টে কোনো এরর না আসে
export interface GmcSettingsData {
  gmcContentApiEnabled: boolean;
  gmcMerchantId: string;
  gmcTargetCountry: string;
  gmcLanguage: string;
}

export interface ConversionSettingsData {
  googleAdsConversionId: string;
  googleAdsConversionLabel: string;
  googleAdsEnhancedConversionsEnabled: boolean;
}

// ============================================================================
// 1. GET GMC SETTINGS
// ============================================================================
/**
 * ড্যাশবোর্ড লোড হওয়ার সময় এই ফাংশন কল হবে।
 * এটি কারেন্ট সেটিংস এবং গুগল কানেক্টেড আছে কি না, তার স্টেটাস পাঠাবে।
 */
export async function getGmcSettings() {
  try {
    const config = await db.marketingIntegration.findUnique({
      where: { id: "marketing_config" },
      select: {
        gmcContentApiEnabled: true,
        gmcMerchantId: true,
        gmcTargetCountry: true,
        gmcLanguage: true,
        googleAccountId: true,     // UI তে দেখানোর জন্য (Connected as: xyz@gmail.com)
        googleRefreshToken: true,  // এটি থাকলে বুঝবো কানেকশন ফুললি একটিভ
      },
    });

    // যদি ডাটাবেসে এন্ট্রি না থাকে, তবে ডিফল্ট ভ্যালু পাঠাবো
    if (!config) {
      return {
        success: true,
        data: {
          gmcContentApiEnabled: false,
          gmcMerchantId: "",
          gmcTargetCountry: "AU",
          gmcLanguage: "en",
        },
        isConnected: false,
        accountEmail: null,
      };
    }

    return {
      success: true,
      data: {
        gmcContentApiEnabled: config.gmcContentApiEnabled,
        gmcMerchantId: config.gmcMerchantId || "",
        gmcTargetCountry: config.gmcTargetCountry || "AU",
        gmcLanguage: config.gmcLanguage || "en",
      },
      isConnected: !!config.googleRefreshToken, // Refresh Token থাকলেই কানেক্টেড
      accountEmail: config.googleAccountId,
    };
  } catch (error: any) {
    console.error("Error fetching GMC settings:", error);
    return { success: false, error: "Failed to fetch settings." };
  }
}

// ============================================================================
// 2. UPDATE GMC SETTINGS
// ============================================================================
/**
 * সেটিংস ফর্ম সাবমিট হলে এই ফাংশন ডাটা আপডেট করবে। 
 * ইনপুট ভ্যালিডেশন এবং স্যানিটাইজেশন এখানেই হবে।
 */
export async function updateGmcSettings(data: GmcSettingsData) {
  try {
    // Basic Validation
    if (data.gmcContentApiEnabled && !data.gmcMerchantId) {
      return { 
        success: false, 
        error: "Merchant Center ID is required to enable Content API." 
      };
    }

    // Upsert method ব্যবহার করা হয়েছে যাতে প্রথমবার হলে Create হয়, না হলে Update হয়।
    await db.marketingIntegration.upsert({
      where: { id: "marketing_config" },
      update: {
        gmcContentApiEnabled: data.gmcContentApiEnabled,
        gmcMerchantId: data.gmcMerchantId.trim(),
        gmcTargetCountry: data.gmcTargetCountry.toUpperCase(), // ISO format e.g., 'AU'
        gmcLanguage: data.gmcLanguage.toLowerCase(), // e.g., 'en'
      },
      create: {
        id: "marketing_config",
        gmcContentApiEnabled: data.gmcContentApiEnabled,
        gmcMerchantId: data.gmcMerchantId.trim(),
        gmcTargetCountry: data.gmcTargetCountry.toUpperCase(),
        gmcLanguage: data.gmcLanguage.toLowerCase(),
      },
    });

    // Next.js এর ক্যাশ ক্লিয়ার করে পেজ রিফ্রেশ করার জন্য
    revalidatePath("/admin/marketing/merchant-center");

    return { 
      success: true, 
      message: "Settings saved successfully." 
    };
  } catch (error: any) {
    console.error("Error updating GMC settings:", error);
    return { 
      success: false, 
      error: "An error occurred while saving settings." 
    };
  }
}

// ============================================================================
// 🚀 3. SAVE GOOGLE ADS CONVERSION & TRACKING SETTINGS
// ============================================================================
/**
 * এটি ফ্রন্টএন্ড সেটিংস থেকে আসা কনভার্সন আইডি, লেবেল এবং
 * এনহ্যান্সড ট্র্যাকিং অপশনটি ডাটাবেজে আপডেট করবে।
 */
export async function saveGoogleAdsConversionSettings(data: ConversionSettingsData) {
  try {
    await db.marketingIntegration.update({
      where: { id: "marketing_config" },
      data: {
        googleAdsConversionId: data.googleAdsConversionId || null,
        googleAdsConversionLabel: data.googleAdsConversionLabel || null,
        googleAdsEnhancedConversionsEnabled: data.googleAdsEnhancedConversionsEnabled,
      },
    });

    // Next.js ক্যাশ রিসেট করা
    revalidatePath("/admin/marketing/merchant-center");

    return { 
      success: true, 
      message: "Conversion tracking settings updated successfully." 
    };
  } catch (error: any) {
    console.error("Error saving Google Ads conversion settings:", error);
    return { 
      success: false, 
      error: error.message || "Failed to save conversion settings." 
    };
  }
}