// lib/global-settings-cache.ts

import { db } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { cache } from "react"; // React এর ডুপ্লিকেট রিকোয়েস্ট থামানোর জন্য

// ============================================================================
// 1. STORE SETTINGS CACHE
// ট্যাগ: 'store-settings'
// ============================================================================
export const getCachedStoreSettings = unstable_cache(
  async () => {
    try {
      return await db.storeSettings.findUnique({
        where: { id: "settings" },
        include: { logoMedia: true, faviconMedia: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (StoreSettings):", error);
      return null;
    }
  },
  ["store-settings-cache-key"], // ইউনিক ক্যাশ কি (Key)
  { tags: ["store-settings"], revalidate: 86400 } // 24 ঘণ্টা পর অটো আপডেট, অথবা revalidateTag কল করলে সাথে সাথে আপডেট
);

// ============================================================================
// 2. SEO GLOBAL CONFIG CACHE
// ট্যাগ: 'seo-config'
// ============================================================================
export const getCachedSeoConfig = unstable_cache(
  async () => {
    try {
      return await db.seoGlobalConfig.findUnique({
        where: { id: "global_seo" },
        include: { ogMedia: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (SeoConfig):", error);
      return null;
    }
  },
  ["seo-config-cache-key"],
  { tags: ["seo-config"], revalidate: 86400 }
);

// ============================================================================
// 3. MARKETING INTEGRATION CACHE
// ট্যাগ: 'marketing-config'
// ============================================================================
export const getCachedMarketingConfig = unstable_cache(
  async () => {
    try {
      return await db.marketingIntegration.findUnique({
        where: { id: "marketing_config" },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (MarketingConfig):", error);
      return null;
    }
  },
  ["marketing-config-cache-key"],
  { tags: ["marketing-config"], revalidate: 86400 }
);

// ============================================================================
// 4. PAYMENT METHODS CACHE
// ট্যাগ: 'payment-methods'
// ============================================================================
export const getCachedPaymentMethods = async () => {
  try {
    return await db.paymentGateway.findMany({ // ✅ Change model name here
      where: { isEnabled: true },
      orderBy: { displayOrder: "asc" },
      // include: { ... } // ❌ 'include' ফেলে দিন, কারণ এখন আর রিলেশনাল টেবিল নেই, সব JSON এ আছে।
    });
  } catch (error) {
    console.error("Cache Error (PaymentMethods):", error);
    return [];
  }
};

// ============================================================================
// 5. PICKUP LOCATIONS CACHE
// ট্যাগ: 'pickup-locations'
// ============================================================================
export const getCachedPickupLocations = unstable_cache(
  async () => {
    try {
      return await db.pickupLocation.findMany({
        where: { isActive: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (PickupLocations):", error);
      return [];
    }
  },
  ["pickup-locations-cache-key"],
  { tags: ["pickup-locations"], revalidate: 86400 }
);

// ============================================================================
// 6. EMAIL CONFIGURATION CACHE
// ট্যাগ: 'email-config'
// ============================================================================
export const getCachedEmailConfig = unstable_cache(
  async () => {
    try {
      return await db.emailConfiguration.findUnique({
        where: { id: "email_config" },
        include: { media: true },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (EmailConfig):", error);
      return null;
    }
  },
  ["email-config-cache-key"],
  { tags: ["email-config"], revalidate: 86400 }
);

// ============================================================================
// 7. TRANSDIRECT SHIPPING CONFIG CACHE
// ট্যাগ: 'transdirect-config'
// ============================================================================
export const getCachedTransdirectConfig = unstable_cache(
  async () => {
    try {
      return await db.transdirectConfig.findUnique({
        where: { id: "transdirect_config" },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (TransdirectConfig):", error);
      return null;
    }
  },
  ["transdirect-config-cache-key"],
  { tags: ["transdirect-config"], revalidate: 86400 }
);

// ============================================================================
// 8. AFFILIATE MLM CONFIG CACHE
// ট্যাগ: 'mlm-config'
// ============================================================================
export const getCachedMLMConfig = unstable_cache(
  async () => {
    try {
      return await db.affiliateMLMConfig.findUnique({
        where: { id: "mlm_config" },
      });
    } catch (error) {
      console.error("⚠️ Cache Error (MLMConfig):", error);
      return null;
    }
  },
  ["mlm-config-cache-key"],
  { tags: ["mlm-config"], revalidate: 86400 }
);

// ============================================================================
// 9. 🚀 AFFILIATE STATUS (REQUEST DEDUPLICATION)
// এটি লং-টার্ম ক্যাশ হবে না, কারণ এটি ইউজার স্পেসিফিক।
// কিন্তু React.cache() ব্যবহার করার ফলে এক পেজ লোডে ৩ বার কল হলেও 
// ডাটাবেজে মাত্র ১ বারই হিট করবে।
// ============================================================================
export const getAffiliateStatusSafe = cache(async (userId?: string) => {
  try {
    if (!userId) return false;
    
    const account = await db.affiliateAccount.findUnique({
      where: { userId: userId },
      select: { status: true }
    });

    const status = account?.status;
    return status === "ACTIVE" || status === "PENDING" || status === "SUSPENDED";
  } catch (error) {
    console.error("⚠️ Request Cache Error (AffiliateStatus):", error);
    return false;
  }
});