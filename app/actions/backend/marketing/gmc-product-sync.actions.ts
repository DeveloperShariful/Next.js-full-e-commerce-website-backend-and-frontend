//File Path: app/actions/backend/marketing/gmc-product-sync.actions.ts

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { security } from "@/lib/security";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface GmcConfig {
  googleRefreshToken: string | null;
  gmcMerchantId: string | null;
  gmcLanguage: string | null;
  gmcTargetCountry: string | null;
  gmcContentApiEnabled: boolean;
  gmcAttributeMapping: Prisma.JsonValue;
}

interface ProductAttribute {
  name: string;
  values: string[];
}

interface ProductTag {
  name: string;
}

interface ProductForSync {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  googleTitle: string | null;
  googleDescription: string | null;
  googleIsBundle: boolean;
  googleProductCategory: string | null;
  featuredImage: string | null;
  price: Prisma.Decimal;
  stock: number;
  trackQuantity: boolean;
  condition: string;
  barcode: string | null;
  mpn: string | null;
  gender: string | null;
  ageGroup: string | null;
  weight: Prisma.Decimal | null;
  length: Prisma.Decimal | null;
  width: Prisma.Decimal | null;
  height: Prisma.Decimal | null;
  size: string | null;
  color: string | null;
  material: string | null;
  pattern: string | null;
  productType: string | null;
  metafields: Prisma.JsonValue;
  brand: { name: string } | null;
  tags: ProductTag[];
  attributes: ProductAttribute[];
  categories: { id: string; name: string; googleCategoryName: string | null }[];
  images: { url: string }[];
}

// ============================================================================
// 1. GET GOOGLE CLIENT
// ============================================================================
async function getGoogleContentClient(config: GmcConfig) {
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
function extractMappedValue(mappedKeys: string[], product: ProductForSync): string | undefined {
  if (!mappedKeys || mappedKeys.length === 0) return undefined;

  for (const key of mappedKeys) {
    if (key === "product_tags" && product.tags?.length > 0) {
      return product.tags.map((t) => t.name).join(", ");
    }
    if (key === "product_type") {
      return product.productType ?? undefined;
    }
    if (key.startsWith("attr_")) {
      const targetSlug = key.replace("attr_", "");
      const foundAttr = product.attributes?.find((a) => {
        const attrSlug = a.name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");
        return attrSlug === targetSlug;
      });
      if (foundAttr && foundAttr.values.length > 0) {
        return foundAttr.values.join("/");
      }
    }
  }
  return undefined;
}

// ============================================================================
// 3. HELPER: FORMAT URL (replaces dev/local URLs with real site URL)
// ============================================================================
function formatGmcUrl(url: string | null | undefined): string {
  if (!url) return "";
  // Replace any localhost or staging origin with the real production SITE_URL
  return url.replace(/^https?:\/\/(localhost:\d+|[^/]*sharifulbuilds\.com)/, SITE_URL);
}

// ============================================================================
// 4. HELPER: STRIP HTML
// ============================================================================
function stripHtmlTags(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ============================================================================
// 4b. HELPER: PARSE GOOGLE TAXONOMY ID
// Google's taxonomy file format: "3951 - Vehicles & Parts > Vehicles > Cycles > Electric Bikes"
// Content API only accepts: "3951" (ID) or "Vehicles & Parts > ..." (path) — NOT the combined format
// This extracts the numeric ID which is the most reliable format
// ============================================================================
function parseTaxonomyId(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  // e.g. "3951 - Vehicles & Parts > ..." → "3951"
  const match = trimmed.match(/^(\d+)\s*-/);
  if (match) return match[1];
  // If it's already a pure number or pure path, return as-is
  return trimmed || undefined;
}

// ============================================================================
// 5. MAIN PRODUCT SYNC ENGINE
// ============================================================================
export async function syncProductToGoogle(productId: string) {
  await security.assertAdmin();
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
          orderBy: { position: "asc" },
          select: { url: true },
        },
      },
    }) as ProductForSync | null;

    if (!product) return { success: false, error: "Product not found." };

    const mappingRules =
      config.gmcAttributeMapping
        ? typeof config.gmcAttributeMapping === "string"
          ? JSON.parse(config.gmcAttributeMapping)
          : (config.gmcAttributeMapping as Record<string, unknown>)
        : null;

    const shoppingContent = await getGoogleContentClient(config as GmcConfig);

    // Ignore googleTitle if it contains SEO template variables (e.g. from WooCommerce Rank Math import)
    const isSeoTemplate = (s: string) => /%[a-z_]+%/i.test(s);
    const finalTitle =
      product.googleTitle && product.googleTitle.trim() !== "" && !isSeoTemplate(product.googleTitle)
        ? product.googleTitle
        : product.name;

    const finalDescription =
      product.googleDescription && product.googleDescription.trim() !== ""
        ? product.googleDescription
        : product.description || product.shortDescription || product.name;

    // Extract Google-specific fields from metafields JSON
    let google_size = "";
    let google_size_system = "";
    let google_size_type = "";
    let google_color = "";
    let google_material = "";
    let google_pattern = "";
    let google_multipack: number | undefined = undefined;
    let google_adult_content = false;
    let google_availability_date = "";

    // Start with Facebook/shared column values as base fallback
    if (product.size) google_size = product.size;
    if (product.color) google_color = product.color;
    if (product.material) google_material = product.material;
    if (product.pattern) google_pattern = product.pattern;

    // Google-specific metafields take priority — they override the shared columns
    if (product.metafields && typeof product.metafields === "object" && !Array.isArray(product.metafields)) {
      const meta = product.metafields as unknown as Record<string, unknown>;
      if (typeof meta.google_size === "string" && meta.google_size) google_size = meta.google_size;
      if (typeof meta.google_size_system === "string") google_size_system = meta.google_size_system;
      if (typeof meta.google_size_type === "string") google_size_type = meta.google_size_type;
      if (typeof meta.google_color === "string" && meta.google_color) google_color = meta.google_color;
      if (typeof meta.google_material === "string" && meta.google_material) google_material = meta.google_material;
      if (typeof meta.google_pattern === "string" && meta.google_pattern) google_pattern = meta.google_pattern;
      if (meta.google_adult_content === true) google_adult_content = true;
      if (typeof meta.google_availability_date === "string") google_availability_date = meta.google_availability_date;
      if (meta.google_multipack) {
        google_multipack = parseInt(String(meta.google_multipack)) || undefined;
      }
    }

    const googleProductParams: Record<string, unknown> = {
      offerId: product.id,
      title: finalTitle,
      description: stripHtmlTags(finalDescription),
      link: formatGmcUrl(`${SITE_URL}/product/${product.slug}`),
      imageLink: formatGmcUrl(product.featuredImage),
      contentLanguage: config.gmcLanguage || "en",
      targetCountry: config.gmcTargetCountry || "AU",
      channel: "online",
      availability: product.trackQuantity === false || product.stock > 0 ? "in stock" : "out of stock",
      condition: product.condition.toLowerCase(),
      price: { value: Number(product.price).toFixed(2), currency: "AUD" },
      brand: product.brand?.name || "Generic",
      gtin: product.barcode || undefined,
      mpn: product.mpn || undefined,
      gender: product.gender || undefined,
      ageGroup: product.ageGroup || undefined,
      isBundle: product.googleIsBundle,
    };

    if (product.images && product.images.length > 1) {
      googleProductParams.additionalImageLinks = product.images.slice(1, 11).map((img) => formatGmcUrl(img.url));
    }

    // Category mapping — parse taxonomy ID from stored value
    // (taxonomy file stores "3951 - Vehicles & Parts > ...", API needs just "3951")
    const rawGoogleCategory =
      product.googleProductCategory ||
      product.categories.find((c) => c.googleCategoryName)?.googleCategoryName ||
      (mappingRules?.attributes?.defaultCategory as string | undefined);
    const googleCategory = parseTaxonomyId(rawGoogleCategory);
    if (googleCategory) googleProductParams.googleProductCategory = googleCategory;

    if (product.categories.length > 0) {
      googleProductParams.productTypes = [product.categories.map((c) => c.name).join(" > ")];
    }

    if (product.weight) googleProductParams.shippingWeight = { value: Number(product.weight), unit: "kg" };
    if (product.length && product.width && product.height) {
      googleProductParams.shippingLength = { value: Number(product.length), unit: "cm" };
      googleProductParams.shippingWidth = { value: Number(product.width), unit: "cm" };
      googleProductParams.shippingHeight = { value: Number(product.height), unit: "cm" };
    }

    if (google_size) googleProductParams.sizes = [google_size];
    if (google_size_system) googleProductParams.sizeSystem = google_size_system;
    if (google_size_type) googleProductParams.sizeType = google_size_type;
    if (google_color) googleProductParams.color = google_color;
    if (google_material) googleProductParams.material = google_material;
    if (google_pattern) googleProductParams.pattern = google_pattern;
    if (google_multipack) googleProductParams.multipack = google_multipack;
    if (google_adult_content) googleProductParams.adult = google_adult_content;
    if (google_availability_date) {
      googleProductParams.availabilityDate = new Date(google_availability_date).toISOString();
    }

    // Apply attribute mapping rules
    if (mappingRules?.attributes) {
      const attrs = mappingRules.attributes as Record<string, string[]>;
      if (!googleProductParams.color) googleProductParams.color = extractMappedValue(attrs.color ?? [], product);
      if (!googleProductParams.sizes) {
        const sizeVal = extractMappedValue(attrs.size ?? [], product);
        if (sizeVal) googleProductParams.sizes = [sizeVal];
      }
      if (!googleProductParams.material) googleProductParams.material = extractMappedValue(attrs.material ?? [], product);
      if (!googleProductParams.pattern) googleProductParams.pattern = extractMappedValue(attrs.pattern ?? [], product);
      if (!googleProductParams.gender) googleProductParams.gender = extractMappedValue(attrs.gender ?? [], product);
      if (!googleProductParams.ageGroup) googleProductParams.ageGroup = extractMappedValue(attrs.ageGroup ?? [], product);
    }

    if (mappingRules?.customLabels) {
      const labels = mappingRules.customLabels as Record<string, string[]>;
      googleProductParams.customLabel0 = extractMappedValue(labels.customLabel0 ?? [], product);
      googleProductParams.customLabel1 = extractMappedValue(labels.customLabel1 ?? [], product);
      googleProductParams.customLabel2 = extractMappedValue(labels.customLabel2 ?? [], product);
      googleProductParams.customLabel3 = extractMappedValue(labels.customLabel3 ?? [], product);
      googleProductParams.customLabel4 = extractMappedValue(labels.customLabel4 ?? [], product);
    }

    // Remove undefined / empty string values
    Object.keys(googleProductParams).forEach((key) => {
      if (googleProductParams[key] === undefined || googleProductParams[key] === "") {
        delete googleProductParams[key];
      }
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
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: { error?: { message?: string; errors?: unknown[] } } }; message?: string };
    const errorMessage = errorObj.response?.data?.error?.message ?? (error instanceof Error ? error.message : "Unknown error");
    const errorDetails = errorObj.response?.data?.error?.errors ?? null;

    console.error("GMC Sync Error for product:", productId, errorMessage);

    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId, channel: "GOOGLE" } },
      update: {
        status: "FAILED",
        errorMessage,
        googleIssues: (errorDetails as Prisma.InputJsonValue) ?? Prisma.DbNull,
        lastSyncedAt: new Date(),
      },
      create: {
        productId,
        channel: "GOOGLE",
        status: "FAILED",
        errorMessage,
        googleIssues: (errorDetails as Prisma.InputJsonValue) ?? Prisma.DbNull,
        lastSyncedAt: new Date(),
      },
    });

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// 6. REMOVE PRODUCT FROM GOOGLE
// ============================================================================
export async function removeProductFromGoogle(productId: string) {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) return { success: false, error: "GMC not enabled." };

    const shoppingContent = await getGoogleContentClient(config as GmcConfig);
    const lang = (config.gmcLanguage || "en").toLowerCase().trim();
    const country = (config.gmcTargetCountry || "AU").toUpperCase().trim();
    const googleProductId = `online:${lang}:${country}:${productId}`;

    await shoppingContent.products.delete({ merchantId: config.gmcMerchantId, productId: googleProductId });

    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId, channel: "GOOGLE" } },
      update: { status: "EXCLUDED", errorMessage: "Manually removed from sales channel.", googleIssues: Prisma.DbNull },
      create: { productId, channel: "GOOGLE", status: "EXCLUDED", errorMessage: "Manually removed from sales channel." },
    });

    return { success: true };
  } catch (error: unknown) {
    const errorObj = error as { response?: { status?: number }; status?: number; message?: string };
    const statusCode = errorObj.response?.status ?? errorObj.status ?? 400;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (statusCode === 404 || errorMessage.toLowerCase().includes("not found")) {
      await db.productChannelStatus.upsert({
        where: { productId_channel: { productId, channel: "GOOGLE" } },
        update: { status: "EXCLUDED", errorMessage: "Manually removed from sales channel.", googleIssues: Prisma.DbNull },
        create: { productId, channel: "GOOGLE", status: "EXCLUDED", errorMessage: "Manually removed from sales channel." },
      });
      return { success: true };
    }

    console.error("GMC Delete Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// 7. UPDATE PRODUCT CHANNEL VISIBILITY
// ============================================================================
export async function updateProductChannelVisibility(productId: string, status: "SYNCED" | "EXCLUDED") {
  await security.assertAdmin();
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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ============================================================================
// 8. BATCH SYNC CONTROLLER (parallel with concurrency limit)
// ============================================================================
export async function bulkUpdateProductVisibility(
  updates: { productId: string; status: "SYNCED" | "EXCLUDED" }[]
) {
  await security.assertAdmin();
  try {
    if (!updates || updates.length === 0) return { success: true };

    // Process in chunks of 5 to avoid Google API rate limits
    const CHUNK_SIZE = 5;
    const errors: string[] = [];

    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map((update) =>
          update.status === "EXCLUDED"
            ? removeProductFromGoogle(update.productId)
            : syncProductToGoogle(update.productId)
        )
      );
      results.forEach((res, idx) => {
        if (!res.success) errors.push(`Product ${chunk[idx].productId}: ${res.error}`);
      });
    }

    revalidatePath("/admin/marketing/merchant-center");

    if (errors.length > 0) {
      return { success: false, error: `${errors.length} product(s) failed: ${errors[0]}` };
    }
    return { success: true, message: "Bulk sync completed successfully!" };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process bulk sync.";
    console.error("Error in bulkUpdateProductVisibility:", error);
    return { success: false, error: msg };
  }
}

// ============================================================================
// 9. SYNC LIVE PRODUCT STATUSES FROM GOOGLE (on-demand, not on every page load)
// ============================================================================
export async function syncLiveProductStatuses() {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) return { success: false };

    const shoppingContent = await getGoogleContentClient(config as GmcConfig);

    const response = await shoppingContent.productstatuses.list({ merchantId: config.gmcMerchantId });
    const googleStatuses = response.data.resources || [];
    if (googleStatuses.length === 0) return { success: true };

    // Batch-fetch all local statuses and product IDs to avoid N+1 queries
    const [existingStatuses, existingProducts] = await Promise.all([
      db.productChannelStatus.findMany({
        where: { channel: "GOOGLE" },
        select: { productId: true, status: true },
      }),
      db.product.findMany({
        where: { deletedAt: null },
        select: { id: true },
      }),
    ]);

    const excludedSet = new Set(
      existingStatuses.filter((s) => s.status === "EXCLUDED").map((s) => s.productId)
    );
    const validProductIds = new Set(existingProducts.map((p) => p.id));

    // Build upsert operations
    const upsertOps = googleStatuses
      .map((gStatus) => {
        const parts = gStatus.productId?.split(":");
        const localProductId = parts ? parts[parts.length - 1] : null;
        if (!localProductId || excludedSet.has(localProductId) || !validProductIds.has(localProductId)) {
          return null;
        }

        const destinationStatuses = gStatus.destinationStatuses || [];
        const isDisapproved = destinationStatuses.some((d) => d.status === "disapproved");
        const isPending = destinationStatuses.some((d) => d.status === "pending");

        let finalStatus: "SYNCED" | "FAILED" | "PENDING" = "SYNCED";
        let errorMessage: string | null = null;
        let googleIssues: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;

        if (isDisapproved) {
          finalStatus = "FAILED";
          const issues = gStatus.itemLevelIssues || [];
          errorMessage = issues.length > 0 ? issues[0].description ?? "Disapproved by Google." : "Disapproved by Google.";
          googleIssues = issues as unknown as Prisma.InputJsonValue;
        } else if (isPending) {
          finalStatus = "PENDING";
          errorMessage = "Pending policy review by Google.";
        }

        return db.productChannelStatus.upsert({
          where: { productId_channel: { productId: localProductId, channel: "GOOGLE" } },
          update: { status: finalStatus, errorMessage, googleIssues, lastSyncedAt: new Date() },
          create: { productId: localProductId, channel: "GOOGLE", status: finalStatus, errorMessage, googleIssues, lastSyncedAt: new Date() },
        });
      })
      .filter(Boolean);

    if (upsertOps.length > 0) {
      await Promise.all(upsertOps);
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error syncing live product statuses:", msg);
    return { success: false, error: msg };
  }
}

// ============================================================================
// 10. SYNC SINGLE LIVE PRODUCT STATUS (instant diagnostics)
// ============================================================================
export async function syncSingleProductStatusFromGoogle(productId: string) {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) {
      return { success: false, error: "GMC is not enabled." };
    }

    const shoppingContent = await getGoogleContentClient(config as GmcConfig);
    const lang = (config.gmcLanguage || "en").toLowerCase().trim();
    const country = (config.gmcTargetCountry || "AU").toUpperCase().trim();
    const googleProductId = `online:${lang}:${country}:${productId}`;

    let finalStatus: "SYNCED" | "FAILED" | "PENDING" = "PENDING";
    let errorMessage: string | null = null;
    let googleIssues: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;

    try {
      const response = await shoppingContent.productstatuses.get({
        merchantId: config.gmcMerchantId,
        productId: googleProductId,
      });

      const gStatus = response.data;
      const destinationStatuses = gStatus.destinationStatuses || [];
      const isDisapproved = destinationStatuses.some((d) => d.status === "disapproved");
      const isPending = destinationStatuses.some((d) => d.status === "pending");

      if (isDisapproved) {
        finalStatus = "FAILED";
        const issues = gStatus.itemLevelIssues || [];
        errorMessage = issues.length > 0 ? issues[0].description ?? "Disapproved by Google." : "Disapproved by Google.";
        // Store ALL issues for detailed UI display
        googleIssues = issues as unknown as Prisma.InputJsonValue;
      } else if (isPending) {
        finalStatus = "PENDING";
        errorMessage = "Pending policy review by Google.";
      } else {
        finalStatus = "SYNCED";
      }
    } catch (apiError: unknown) {
      const errObj = apiError as { status?: number; message?: string };
      if (errObj.status === 404 || errObj.message?.toLowerCase().includes("not found")) {
        finalStatus = "PENDING";
        errorMessage = "Not synced yet or pending policy review by Google.";
      } else {
        throw apiError;
      }
    }

    const updatedStatus = await db.productChannelStatus.upsert({
      where: { productId_channel: { productId, channel: "GOOGLE" } },
      update: { status: finalStatus, errorMessage, googleIssues, lastSyncedAt: new Date() },
      create: { productId, channel: "GOOGLE", status: finalStatus, errorMessage, googleIssues, lastSyncedAt: new Date() },
    });

    revalidatePath("/admin/marketing/merchant-center");

    return {
      success: true,
      status: updatedStatus.status,
      errorMessage: updatedStatus.errorMessage,
      googleIssues: updatedStatus.googleIssues,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in syncSingleProductStatusFromGoogle:", msg);
    return { success: false, error: msg };
  }
}
