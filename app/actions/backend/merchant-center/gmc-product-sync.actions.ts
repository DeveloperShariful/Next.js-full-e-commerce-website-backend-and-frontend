//File Path: app/actions/backend/merchant-center/gmc-product-sync.actions.ts
"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

// ============================================================================
// 1. GET GOOGLE CLIENT
// ============================================================================
async function getGoogleContentClient(config: any) {
  if (!config.googleRefreshToken || !config.gmcMerchantId) {
    throw new Error("Google account is not fully connected or Merchant ID is missing.");
  }
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });
  return google.content({ version: "v2.1", auth: oauth2Client });
}

// ============================================================================
// 2. HELPER: DYNAMIC ATTRIBUTE EXTRACTOR
// ============================================================================
/**
 * এই ফাংশনটি ইউজারের সেভ করা রুলস (Array of Slugs) চেক করে 
 * প্রোডাক্টের ভেতর থেকে সঠিক ডাটা বের করে আনবে।
 */
function extractMappedValue(mappedKeys: string[], product: any) {
  if (!mappedKeys || !Array.isArray(mappedKeys) || mappedKeys.length === 0) return undefined;

  for (const key of mappedKeys) {
    // ১. যদি Tags ম্যাপ করা থাকে
    if (key === "product_tags" && product.tags?.length > 0) {
      return product.tags.map((t: any) => t.name).join(", ");
    }
    // ২. যদি Product Type ম্যাপ করা থাকে
    if (key === "product_type") {
      return product.productType;
    }
    // ৩. যদি ডাটাবেসের কোনো Attribute ম্যাপ করা থাকে (যেমন: attr_frame-color)
    if (key.startsWith("attr_")) {
      const targetSlug = key.replace("attr_", "");
      const foundAttr = product.attributes?.find((a: any) => {
        const attrSlug = a.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        return attrSlug === targetSlug;
      });

      // গুগলের নিয়ম অনুযায়ী মাল্টিপল কালার থাকলে "/" দিয়ে পাঠাতে হয় (যেমন: Red/Black)
      if (foundAttr && foundAttr.values && foundAttr.values.length > 0) {
        return foundAttr.values.join("/");
      }
    }
  }
  return undefined; // কোনো ম্যাচ না পেলে undefined (গুগল ইগনোর করবে)
}

// ============================================================================
// 3. MAIN PRODUCT SYNC ENGINE
// ============================================================================
export async function syncProductToGoogle(productId: string) {
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });

    if (!config?.gmcContentApiEnabled) return { success: false, error: "GMC Auto Sync is disabled." };

    // ১. প্রোডাক্টের ফুল ডাটা (Tags, Attributes, Category সহ) ফেচ করা
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        tags: true,
        attributes: true,
        categories: { select: { id: true, googleCategoryName: true } },
      },
    });

    if (!product) return { success: false, error: "Product not found." };

    // ২. ম্যাপিং কনফিগারেশন পার্স করা
    const mappingRules = config.gmcAttributeMapping 
      ? (typeof config.gmcAttributeMapping === "string" ? JSON.parse(config.gmcAttributeMapping) : config.gmcAttributeMapping)
      : null;

    // ৩. গুগল ক্লায়েন্ট ইনিশিয়ালাইজেশন
    const shoppingContent = await getGoogleContentClient(config);

    // ৪. গুগলের জন্য ডাটা প্যাক করা (The Magic Mapping)
    const googleProductParams: any = {
      offerId: product.id,
      title: product.name,
      description: product.description || product.shortDescription || product.name,
      link: `${SITE_URL}/product/${product.slug}`,
      imageLink: product.featuredImage || "",
      contentLanguage: config.gmcLanguage || "en",
      targetCountry: config.gmcTargetCountry || "AU",
      channel: "online",
      
      availability: product.stock > 0 ? "in stock" : "out of stock",
      condition: "new",
      price: { value: Number(product.price).toFixed(2), currency: "AUD" }, // AUD dynamically setteable
      
      // Standard Identifiers
      brand: product.brand?.name || undefined,
      gtin: product.barcode || undefined,
      mpn: product.mpn || undefined,
    };

    // ৫. ক্যাটাগরি ম্যাপিং যোগ করা (প্রোডাক্টের প্রথম ক্যাটাগরি থেকে নিবে)
    const googleCategory = product.categories.find(c => c.googleCategoryName)?.googleCategoryName;
    if (googleCategory) {
      googleProductParams.googleProductCategory = googleCategory;
    }

    // ৬. ডায়নামিক অ্যাট্রিবিউট ম্যাপিং (Dynamic Attribute Extraction)
    if (mappingRules && mappingRules.attributes) {
      googleProductParams.color = extractMappedValue(mappingRules.attributes.color, product);
      googleProductParams.size = extractMappedValue(mappingRules.attributes.size, product);
      googleProductParams.material = extractMappedValue(mappingRules.attributes.material, product);
      googleProductParams.pattern = extractMappedValue(mappingRules.attributes.pattern, product);
      googleProductParams.gender = extractMappedValue(mappingRules.attributes.gender, product);
      googleProductParams.ageGroup = extractMappedValue(mappingRules.attributes.ageGroup, product);
    }

    // ৭. কাস্টম লেবেল ম্যাপিং (Google Ads এর জন্য)
    if (mappingRules && mappingRules.customLabels) {
      googleProductParams.customLabel0 = extractMappedValue(mappingRules.customLabels.customLabel0, product);
      googleProductParams.customLabel1 = extractMappedValue(mappingRules.customLabels.customLabel1, product);
      googleProductParams.customLabel2 = extractMappedValue(mappingRules.customLabels.customLabel2, product);
      googleProductParams.customLabel3 = extractMappedValue(mappingRules.customLabels.customLabel3, product);
      googleProductParams.customLabel4 = extractMappedValue(mappingRules.customLabels.customLabel4, product);
    }

    // Remove undefined fields before sending to Google
    Object.keys(googleProductParams).forEach(key => {
      if (googleProductParams[key] === undefined) delete googleProductParams[key];
    });

    // ৮. গুগলে রিকোয়েস্ট পাঠানো
    const response = await shoppingContent.products.insert({
      merchantId: config.gmcMerchantId!,
      requestBody: googleProductParams,
    });

    // ৯. সফল হলে ডাটাবেসে স্ট্যাটাস সেভ করা
    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId: product.id, channel: "GOOGLE" } },
      update: {
        status: "SYNCED",
        channelProductId: response.data.id,
        errorMessage: null,
        googleIssues: response.data.customAttributes as any || null, // Гугл (Google) 의 상세 경고 (Warnings)
        lastSyncedAt: new Date(),
      },
      create: {
        productId: product.id,
        channel: "GOOGLE",
        status: "SYNCED",
        channelProductId: response.data.id,
        lastSyncedAt: new Date(),
      },
    });

    revalidatePath("/admin/marketing/merchant-center");
    revalidatePath("/admin/marketing/merchant-center/sync-logs");
    
    return { success: true, message: "Product synced successfully." };

  } catch (error: any) {
    console.error("GMC Sync Error for product:", productId, error.message);

    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorDetails = error.response?.data?.error?.errors || null; // 상세 에러 내용 (JSON)

    // রিজেক্ট হলে FAILED স্ট্যাটাস এবং গুগলের আসল এরর JSON সহ সেভ করা
    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId: productId, channel: "GOOGLE" } },
      update: {
        status: "FAILED",
        errorMessage: errorMessage,
        googleIssues: errorDetails, // Save the detailed JSON array of issues
        lastSyncedAt: new Date(),
      },
      create: {
        productId: productId,
        channel: "GOOGLE",
        status: "FAILED",
        errorMessage: errorMessage,
        googleIssues: errorDetails,
        lastSyncedAt: new Date(),
      },
    });

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// 4. REMOVE PRODUCT FROM GOOGLE
// ============================================================================
export async function removeProductFromGoogle(productId: string) {
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) return { success: false };

    const shoppingContent = await getGoogleContentClient(config);
    const googleProductId = `online:${config.gmcLanguage}:${config.gmcTargetCountry}:${productId}`;

    await shoppingContent.products.delete({
      merchantId: config.gmcMerchantId,
      productId: googleProductId,
    });

    await db.productChannelStatus.updateMany({
      where: { productId: productId, channel: "GOOGLE" },
      data: { status: "EXCLUDED", errorMessage: "Manually removed from sales channel." },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}