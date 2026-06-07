//File Path: app/actions/backend/merchant-center/gmc-product-sync.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; // JSON null এবং DbNull এরর সমাধানের জন্য প্রিজমা ইম্পোর্ট
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
function extractMappedValue(mappedKeys: string[], product: any) {
  if (!mappedKeys || !Array.isArray(mappedKeys) || mappedKeys.length === 0) return undefined;

  for (const key of mappedKeys) {
    if (key === "product_tags" && product.tags?.length > 0) {
      return product.tags.map((t: any) => t.name).join(", ");
    }
    if (key === "product_type") {
      return product.productType;
    }
    if (key.startsWith("attr_")) {
      const targetSlug = key.replace("attr_", "");
      const foundAttr = product.attributes?.find((a: any) => {
        const attrSlug = a.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        return attrSlug === targetSlug;
      });

      if (foundAttr && foundAttr.values && foundAttr.values.length > 0) {
        return foundAttr.values.join("/");
      }
    }
  }
  return undefined; 
}

// ============================================================================
// 3. MAIN PRODUCT SYNC ENGINE (With Dynamic Stock & Auto Bypasses)
// ============================================================================
export async function syncProductToGoogle(productId: string) {
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });

    if (!config?.gmcContentApiEnabled) return { success: false, error: "GMC Auto Sync is disabled." };

    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        tags: true,
        attributes: true,
        categories: { select: { id: true, name: true, googleCategoryName: true } },
        images: {
          where: { variantId: null },
          orderBy: { position: 'asc' },
          select: { url: true }
        }
      },
    });

    if (!product) return { success: false, error: "Product not found." };

    const mappingRules = config.gmcAttributeMapping 
      ? (typeof config.gmcAttributeMapping === "string" ? JSON.parse(config.gmcAttributeMapping) : config.gmcAttributeMapping)
      : null;

    const shoppingContent = await getGoogleContentClient(config);

    const googleProductParams: any = {
      offerId: product.id,
      title: product.name,
      description: stripHtmlTags(product.description || product.shortDescription || product.name),
      link: formatGmcUrl(`${SITE_URL}/product/${product.slug}`),
      imageLink: formatGmcUrl(product.featuredImage),
      contentLanguage: config.gmcLanguage || "en",
      targetCountry: config.gmcTargetCountry || "AU",
      channel: "online",
      
      availability: (product.trackQuantity === false || product.stock > 0) ? "in stock" : "out of stock",
      condition: "new",
      price: { value: Number(product.price).toFixed(2), currency: "AUD" }, 
      
      brand: product.brand?.name || "GoBike",
      gtin: product.barcode || undefined,
      mpn: product.mpn || undefined,
    };

    if (product.images && product.images.length > 1) {
      googleProductParams.additionalImageLinks = product.images
        .slice(1, 11)
        .map((img) => formatGmcUrl(img.url));
    }

    let googleCategory = product.categories.find(c => c.googleCategoryName)?.googleCategoryName;
    if (!googleCategory && mappingRules?.attributes?.defaultCategory) {
      googleCategory = mappingRules.attributes.defaultCategory;
    }
    if (googleCategory) {
      googleProductParams.googleProductCategory = googleCategory;
    }

    if (product.categories.length > 0) {
      googleProductParams.productTypes = [
        product.categories.map((c) => c.name).join(" > ")
      ];
    }

    if (product.weight) {
      googleProductParams.shippingWeight = { value: Number(product.weight), unit: "kg" };
    }
    if (product.length && product.width && product.height) {
      googleProductParams.shippingLength = { value: Number(product.length), unit: "cm" };
      googleProductParams.shippingWidth = { value: Number(product.width), unit: "cm" };
      googleProductParams.shippingHeight = { value: Number(product.height), unit: "cm" };
    }

    if (mappingRules && mappingRules.attributes) {
      googleProductParams.color = extractMappedValue(mappingRules.attributes.color, product);
      googleProductParams.size = extractMappedValue(mappingRules.attributes.size, product);
      googleProductParams.material = extractMappedValue(mappingRules.attributes.material, product);
      googleProductParams.pattern = extractMappedValue(mappingRules.attributes.pattern, product);
      googleProductParams.gender = extractMappedValue(mappingRules.attributes.gender, product);
      googleProductParams.ageGroup = extractMappedValue(mappingRules.attributes.ageGroup, product);
    }

    if (mappingRules && mappingRules.customLabels) {
      googleProductParams.customLabel0 = extractMappedValue(mappingRules.customLabels.customLabel0, product);
      googleProductParams.customLabel1 = extractMappedValue(mappingRules.customLabels.customLabel1, product);
      googleProductParams.customLabel2 = extractMappedValue(mappingRules.customLabels.customLabel2, product);
      googleProductParams.customLabel3 = extractMappedValue(mappingRules.customLabels.customLabel3, product);
      googleProductParams.customLabel4 = extractMappedValue(mappingRules.customLabels.customLabel4, product);
    }

    Object.keys(googleProductParams).forEach(key => {
      if (googleProductParams[key] === undefined) delete googleProductParams[key];
    });

    const response = await shoppingContent.products.insert({
      merchantId: config.gmcMerchantId!,
      requestBody: googleProductParams,
    });

    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId: product.id, channel: "GOOGLE" } },
      update: {
        status: "SYNCED",
        channelProductId: response.data.id,
        errorMessage: null,
        googleIssues: Prisma.DbNull,
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

    return { success: true, message: "Product synced successfully." };

  } catch (error: any) {
    console.error("GMC Sync Error for product:", productId, error.message);

    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorDetails = error.response?.data?.error?.errors || null; 

    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId: productId, channel: "GOOGLE" } },
      update: {
        status: "FAILED",
        errorMessage: errorMessage,
        googleIssues: errorDetails || Prisma.DbNull, 
        lastSyncedAt: new Date(),
      },
      create: {
        productId: productId,
        channel: "GOOGLE",
        status: "FAILED",
        errorMessage: errorMessage,
        googleIssues: errorDetails || Prisma.DbNull,
        lastSyncedAt: new Date(),
      },
    });

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// 4. REMOVE PRODUCT FROM GOOGLE (With 404 "Not Found" Bypass!)
// ============================================================================
export async function removeProductFromGoogle(productId: string) {
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) return { success: false };

    const shoppingContent = await getGoogleContentClient(config);

    const lang = (config.gmcLanguage || "en").toLowerCase().trim();
    const country = (config.gmcTargetCountry || "AU").toUpperCase().trim();
    
    const googleProductId = `online:${lang}:${country}:${productId}`;

    await shoppingContent.products.delete({
      merchantId: config.gmcMerchantId,
      productId: googleProductId,
    });

    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId, channel: "GOOGLE" } },
      update: {
        status: "EXCLUDED",
        errorMessage: "Manually removed from sales channel.",
        googleIssues: Prisma.DbNull, 
      },
      create: {
        productId,
        channel: "GOOGLE",
        status: "EXCLUDED",
        errorMessage: "Manually removed from sales channel.",
      }
    });

    return { success: true };
  } catch (error: any) {
    const statusCode = error.response?.status || error.status || 400;
    const errorMessage = error.response?.data?.error?.message || error.message;

    // 🚀 THE ULTIMATE 404 BYPASS:
    // গুগল যদি বলে "প্রোডাক্ট খুঁজে পাওয়া যায়নি (404)", তার মানে এটি অলরেডি ডিলিট হয়ে গেছে।
    // এটি আমাদের জন্য সফলতাই (Success)! তাই আমরা সেভলি ডাটাবেস আপডেট করে সাকসেস রিটার্ন করবো।
    if (statusCode === 404 || errorMessage.toLowerCase().includes("not found")) {
      console.warn(`GMC Delete: Product ${productId} already deleted on Google side. Marking local status as EXCLUDED.`);
      
      await db.productChannelStatus.upsert({
        where: { productId_channel: { productId, channel: "GOOGLE" } },
        update: {
          status: "EXCLUDED",
          errorMessage: "Manually removed from sales channel.",
          googleIssues: Prisma.DbNull,
        },
        create: {
          productId,
          channel: "GOOGLE",
          status: "EXCLUDED",
          errorMessage: "Manually removed from sales channel.",
        }
      });
      return { success: true };
    }

    console.error("GMC Delete Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// 5. UPDATE PRODUCT CHANNEL VISIBILITY
// ============================================================================
export async function updateProductChannelVisibility(productId: string, status: "SYNCED" | "EXCLUDED") {
  try {
    if (status === "EXCLUDED") {
      const res = await removeProductFromGoogle(productId);
      if (!res.success) return { success: false, error: res.error };
    } else {
      const res = await syncProductToGoogle(productId);
      if (!res.success) return { success: false, error: res.error };
    }
    
    revalidatePath("/admin/marketing/merchant-center");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 🚀 6. NEW: BATCH SAVE & SYNC CONTROLLER
// ============================================================================
/**
 * এক ক্লিকে অনেকগুলো প্রোডাক্টের ড্রপডাউন আপডেট একসাথে প্রসেস করার সার্ভার অ্যাকশন
 */
export async function bulkUpdateProductVisibility(
  updates: { productId: string; status: "SYNCED" | "EXCLUDED" }[]
) {
  try {
    if (!updates || updates.length === 0) return { success: true };

    // লুপ চালিয়ে সব প্রোডাক্ট এক এক করে প্রসেস করা হবে
    for (const update of updates) {
      if (update.status === "EXCLUDED") {
        const res = await removeProductFromGoogle(update.productId);
        if (!res.success) {
          return { success: false, error: `Failed for product ID ${update.productId}: ${res.error}` };
        }
      } else {
        const res = await syncProductToGoogle(update.productId);
        if (!res.success) {
          return { success: false, error: `Failed for product ID ${update.productId}: ${res.error}` };
        }
      }
    }

    revalidatePath("/admin/marketing/merchant-center");
    return { success: true, message: "Bulk sync completed successfully!" };
  } catch (error: any) {
    console.error("Error in bulkUpdateProductVisibility:", error);
    return { success: false, error: error.message || "Failed to process bulk sync." };
  }
}

// ============================================================================
// 7. SYNC LIVE PRODUCT STATUSES FROM GOOGLE (With Race Condition Fix)
// ============================================================================
export async function syncLiveProductStatuses() {
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) return { success: false };

    const shoppingContent = await getGoogleContentClient(config);

    const response = await shoppingContent.productstatuses.list({
      merchantId: config.gmcMerchantId,
    });

    const googleStatuses = response.data.resources || [];
    if (googleStatuses.length === 0) return { success: true };

    for (const gStatus of googleStatuses) {
      const parts = gStatus.productId?.split(":");
      const localProductId = parts ? parts[parts.length - 1] : null;

      if (!localProductId) continue;

      const existingStatus = await db.productChannelStatus.findUnique({
        where: { productId_channel: { productId: localProductId, channel: "GOOGLE" } },
        select: { status: true }
      });

      if (existingStatus?.status === "EXCLUDED") {
        continue; 
      }

      const localProductExists = await db.product.findUnique({
        where: { id: localProductId },
        select: { id: true }
      });
      if (!localProductExists) continue;

      const destinationStatuses = gStatus.destinationStatuses || [];
      const isDisapproved = destinationStatuses.some(d => d.status === "disapproved");
      const isPending = destinationStatuses.some(d => d.status === "pending");

      let finalStatus: "SYNCED" | "FAILED" | "PENDING" = "SYNCED";
      let errorMessage: string | null = null;
      let googleIssues: any = null;

      if (isDisapproved) {
        finalStatus = "FAILED";
        const issues = gStatus.itemLevelIssues || [];
        errorMessage = issues.length > 0 ? issues[0].description || "Disapproved by Google." : "Disapproved by Google.";
        googleIssues = issues;
      } else if (isPending) {
        finalStatus = "PENDING";
        errorMessage = "Pending policy review by Google.";
      }

      await db.productChannelStatus.upsert({
        where: { productId_channel: { productId: localProductId, channel: "GOOGLE" } },
        update: {
          status: finalStatus,
          errorMessage: errorMessage,
          googleIssues: googleIssues || Prisma.DbNull,
          lastSyncedAt: new Date(),
        },
        create: {
          productId: localProductId,
          channel: "GOOGLE",
          status: finalStatus,
          errorMessage: errorMessage,
          googleIssues: googleIssues || Prisma.DbNull,
          lastSyncedAt: new Date(),
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error syncing live product statuses:", error.message);
    return { success: false, error: error.message };
  }
}

// Helpers
function stripHtmlTags(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatGmcUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.includes("localhost:3000")) {
    return url.replace("http://localhost:3000", "https://gobike.au");
  }
  if (url.includes("sharifulbuilds.com")) {
    return url.replace("https://sharifulbuilds.com", "https://gobike.au");
  }
  return url;
}