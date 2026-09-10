//File Path: app/actions/backend/marketing/gmc-product-sync.actions.ts
//
// ★★★ MERCHANT API (v1) — Content API for Shopping v2.1 এখান থেকে পুরোপুরি সরানো হয়েছে ★★★
// Content API for Shopping অফিসিয়ালি sunset হয়ে গেছে (Aug 18, 2026); এই
// ফাইল এখন সম্পূর্ণ Google Merchant API (v1)-এর মাধ্যমে চলে। লাইভ টেস্ট করে
// (একটা real product দিয়ে, admin UI-এর সাময়িক "Test V2" বাটন দিয়ে) নিশ্চিত
// হওয়ার পরই এই কাটওভার করা হয়েছে — পুরনো offerId/contentLanguage/feedLabel
// scheme হুবহু বজায় রাখা হয়েছে, তাই Google Merchant Center-এ এটা duplicate
// entry তৈরি না করে বিদ্যমান product-গুলোকেই আপডেট করে (যাচাই করা হয়েছে:
// টেস্ট product-এর creationDate অপরিবর্তিত থেকেছে, শুধু lastUpdateDate বদলেছে)।
//
// পুরনো v2.1 ও Merchant API-র মূল পার্থক্য (googleapis@169.0.0-এর bundled
// .d.ts টাইপ ডেফিনিশন + লাইভ API কল সরাসরি যাচাই করে, guess না):
//   - merchantId প্যারামিটার নেই, বরং parent: "accounts/{id}" + একটা
//     আবশ্যিক dataSource: "accounts/{id}/dataSources/{id}" লাগে
//     (MarketingIntegration.gmcDataSourceName-এ সংরক্ষিত, একবার তৈরি করা হয়)।
//   - title/price/gtin ইত্যাদি flat field না, সব productAttributes অবজেক্টের
//     ভেতরে নেস্টেড।
//   - price/salePrice: { value, currency } থেকে { amountMicros, currencyCode }।
//   - gtin (single string) → gtins (string array)। sizes (array) → size
//     (single string)। sizeType (single) → sizeTypes (array)। multipack
//     number → multipack string।
//   - availability/condition/gender/ageGroup এখন protobuf enum (UPPER_SNAKE_CASE,
//     যেমন "IN_STOCK", "NEW") — v2.1-এর lowercase ("in stock", "new") আর
//     গ্রহণযোগ্য না, একটা লাইভ টেস্ট কলে Google-এর প্রকৃত error message থেকে
//     এটা নিশ্চিত হওয়া হয়েছে।
//   - productstatuses.get/list বাদ, এখন accounts.products.get/list-এর
//     productStatus ফিল্ডে থাকে। destinationStatuses-এ আর "status" নেই,
//     বরং approvedCountries/disapprovedCountries/pendingCountries array।
//   - countryOfOrigin নামে কোনো strongly-typed field নেই এই API-তে (যাচাই
//     করা হয়েছে) — তাই customAttributes দিয়ে generic ভাবে পাঠানো হচ্ছে,
//     যেটা Google নিজেই এই ধরনের gap-এর জন্য documented fallback হিসেবে
//     রেখেছে।

"use server";

import { google } from "googleapis";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { security } from "@/lib/security";
import type { merchantapi_products_v1 } from "googleapis/build/src/apis/merchantapi/products_v1";

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
  gmcDataSourceName: string | null;
}

interface ProductAttribute {
  name: string;
  values: string[];
}

interface ProductTag {
  name: string;
}

// VARIABLE product-এর প্রতিটা variant Google-এ আলাদা product হিসেবে যায়
// (item_group_id দিয়ে group করা)। parent product-এর যে ফিল্ডগুলো variant-ভেদে
// বদলায় সেগুলোর variant-লেভেল ভ্যালু এখানে।
interface ProductVariantForSync {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: Prisma.Decimal;
  salePrice: Prisma.Decimal | null;
  stock: number;
  trackQuantity: boolean;
  isPreOrder: boolean;
  googleTitle: string | null;
  googleDescription: string | null;
  image: string | null;
  weight: Prisma.Decimal | null;
  length: Prisma.Decimal | null;
  width: Prisma.Decimal | null;
  height: Prisma.Decimal | null;
  attributes: Prisma.JsonValue;
  images: { url: string }[];
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
  googleOfferIdOverride: string | null;
  googleProductCategory: string | null;
  featuredImage: string | null;
  price: Prisma.Decimal;
  stock: number;
  trackQuantity: boolean;
  isPreOrder: boolean;
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
  sku: string | null;
  salePrice: Prisma.Decimal | null;
  saleStart: Date | null;
  saleEnd: Date | null;
  countryOfManufacture: string | null;
  weightUnit: string | null;
  dimensionUnit: string | null;
  metafields: Prisma.JsonValue;
  brand: { name: string } | null;
  tags: ProductTag[];
  attributes: ProductAttribute[];
  categories: { id: string; name: string; googleCategoryName: string | null }[];
  images: { url: string }[];
  variants: ProductVariantForSync[];
}

// ============================================================================
// 1. GET GOOGLE MERCHANT API CLIENT
// ============================================================================
async function getGoogleMerchantClient(config: GmcConfig) {
  if (!config.googleRefreshToken || !config.gmcMerchantId) {
    throw new Error("Google account is not fully connected or Merchant ID is missing.");
  }
  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });
  // Content API v2.1 আর Merchant API একই OAuth scope
  // (https://www.googleapis.com/auth/content) শেয়ার করে বলে refresh token
  // পুনরায় consent ছাড়াই কাজ করে — Google-এর অফিসিয়াল ডকুমেন্টেশনে যাচাই করা।
  return google.merchantapi({ version: "products_v1", auth: oauth2Client });
}

function getAccountName(config: GmcConfig): string {
  return `accounts/${config.gmcMerchantId}`;
}

// productInput-এর id অংশ বানায়: "{contentLanguage}~{feedLabel}~{offerId}"।
// GoBike-এর offerId (product.id) Prisma cuid/uuid — তাতে ~, /, % কখনো থাকে
// না, তাই plain (tilde) format যথেষ্ট। Google base64url encoding recommend
// করে শুধু তখনই যখন offerId-তে এসব special character থাকার সম্ভাবনা থাকে।
function buildProductSegment(config: GmcConfig, offerId: string): string {
  const contentLanguage = (config.gmcLanguage || "en").toLowerCase().trim();
  const feedLabel = (config.gmcTargetCountry || "AU").toUpperCase().trim();
  return `${contentLanguage}~${feedLabel}~${offerId}`;
}

// ============================================================================
// 1b. VARIANT OFFER-ID SCHEME
// ----------------------------------------------------------------------------
// Google-এর official recommendation: variable product-এর প্রতিটা variant একটা
// আলাদা product হিসেবে পাঠাতে হবে, প্রত্যেকের unique offerId, আর সবগুলোতে একই
// item_group_id (parent-এর offerId)। parent নিজে আলাদা করে পাঠানো হয় না।
//
// offerId স্কিম: "{baseOfferId}_v_{variantId}"। Google থেকে ফিরে আসা offerId →
// local product-এ ম্যাপ করার সময় string parse করা হয় না; বরং DB-র সব
// (product, variant) জোড়া থেকে বৈধ offerId-এর একটা Map/Set বানিয়ে lookup করা
// হয় (syncLiveProductStatuses / cleanupStaleGoogleProducts) — override-এ
// "_v_" থাকলেও তাই ভুল হয় না।
// ============================================================================
// ✅ FIX: আগে এখানে `${baseOfferId}${VARIANT_OFFER_SEP}${variantId}` রিটার্ন
// হতো — দুটোই ৩৬-ক্যারেক্টার UUID হওয়ায় মোট ৭৫ ক্যারেক্টার হয়ে যেতো, Google-এর
// `id` attribute-এর সর্বোচ্চ সীমা (৫০ ক্যারেক্টার) ছাড়িয়ে "Value too long in
// attribute: id" error দিয়ে **সব** variant reject করে দিতো (দেখুন GoBike Crew
// T-Shirt-এর ৮/৮ variant fail)। item_group_id ইতিমধ্যেই আলাদা attribute
// হিসেবে base offerId পাঠায় (নিচে buildVariantProductAttributes দেখুন), তাই
// grouping-এর জন্য offer id-তে base প্রেফিক্স জোড়া লাগানোর দরকারই নেই —
// variantId নিজেই globally unique এবং ৫০-ক্যারেক্টার সীমার মধ্যে, তাই একাই
// যথেষ্ট। google-local-inventory/route.ts-এও এই একই ফরম্যাট ব্যবহার করা
// হয়েছে (দুটো মিলে থাকা জরুরি) — signature অপরিবর্তিত রাখা হলো যাতে বাকি সব
// caller (reverse-lookup সহ) না বদলেই ঠিক থাকে।
function buildVariantOfferId(_baseOfferId: string, variantId: string): string {
  return variantId;
}

// variant.attributes ({ "Color": "Red", "Size": "M" }) থেকে নির্দিষ্ট key খুঁজে
// ভ্যালু বের করে — key ম্যাচিং case-insensitive (admin যেকোনো casing দিতে পারে)।
function pickVariantAttr(
  attributes: Prisma.JsonValue,
  keys: string[],
): string | undefined {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return undefined;
  const map = attributes as Record<string, unknown>;
  for (const rawKey of Object.keys(map)) {
    if (keys.includes(rawKey.toLowerCase().trim())) {
      const val = map[rawKey];
      if (typeof val === "string" && val.trim()) return val.trim();
    }
  }
  return undefined;
}

// কিছু পুরনো/import করা variant-এর `name` "{product name} - {value}" আকারে সেভ
// থাকে (বর্তমান "Generate" শুধু attribute মান লেখে — যেমন "M" / "Red / L")।
// parent title-এর সাথে সেই পুরো নাম আবার জোড়া দিলে GMC-তে title ডাবল হয়ে যায়
// ("GoBike Crew T-Shirt … - GoBike Crew T-Shirt … - 130")। তাই title suffix-এ
// বসানোর আগে variant.name থেকে leading product-name প্রিফিক্স ছেঁটে ফেলা হয়।
function stripProductNamePrefix(variantName: string, productName: string): string {
  const name = (variantName || "").trim();
  const pn = (productName || "").trim();
  if (!pn) return name;
  const prefix = `${pn} - `;
  if (name.toLowerCase().startsWith(prefix.toLowerCase())) {
    return name.slice(prefix.length).trim() || name;
  }
  return name;
}

// parent-এর জন্য বানানো productAttributes-কে base ধরে একটা variant-এর জন্য
// override করা কপি বানায় — title/price/availability/image/identifier/color/size
// সব variant-লেভেল, আর item_group_id সেট করা হয়।
function buildVariantProductAttributes(
  baseAttributes: merchantapi_products_v1.Schema$ProductAttributes,
  product: ProductForSync,
  variant: ProductVariantForSync,
  itemGroupId: string,
): merchantapi_products_v1.Schema$ProductAttributes {
  const attrs: merchantapi_products_v1.Schema$ProductAttributes = { ...baseAttributes };
  const isSeoTemplate = (s: string) => /%[a-z_]+%/i.test(s);

  // ── Grouping ──
  attrs.itemGroupId = itemGroupId;

  // ── Title / description ──
  attrs.title =
    variant.googleTitle && variant.googleTitle.trim() && !isSeoTemplate(variant.googleTitle)
      ? variant.googleTitle.trim()
      : `${baseAttributes.title ?? product.name} - ${stripProductNamePrefix(variant.name, product.name)}`;
  if (variant.googleDescription && variant.googleDescription.trim()) {
    attrs.description = stripHtmlTags(variant.googleDescription);
  }

  // ── Images: variant gallery প্রথম ছবি > variant.image > parent featuredImage ──
  const variantImages = (variant.images || []).map((i) => i.url).filter(Boolean);
  const mainImage = variantImages[0] || variant.image || product.featuredImage;
  if (mainImage) attrs.imageLink = formatGmcUrl(mainImage);
  const extraImages = [
    ...variantImages.slice(1),
    ...(product.images || []).map((i) => i.url).filter((u) => u && u !== product.featuredImage),
  ]
    .filter(Boolean)
    .slice(0, 10)
    .map((u) => formatGmcUrl(u));
  if (extraImages.length > 0) attrs.additionalImageLinks = extraImages;
  else delete attrs.additionalImageLinks;

  // ── Price / sale price ──
  attrs.price = {
    amountMicros: String(Math.round(Number(variant.price) * 1_000_000)),
    currencyCode: "AUD",
  };
  if (
    variant.salePrice &&
    Number(variant.salePrice) > 0 &&
    Number(variant.salePrice) < Number(variant.price)
  ) {
    attrs.salePrice = {
      amountMicros: String(Math.round(Number(variant.salePrice) * 1_000_000)),
      currencyCode: "AUD",
    };
    if (product.saleStart && product.saleEnd) {
      attrs.salePriceEffectiveDate = {
        startTime: toRfc3339(product.saleStart),
        endTime: toRfc3339(product.saleEnd),
      };
    } else {
      delete attrs.salePriceEffectiveDate;
    }
  } else {
    delete attrs.salePrice;
    delete attrs.salePriceEffectiveDate;
  }

  // ── Availability ──
  attrs.availability = variant.isPreOrder
    ? "PREORDER"
    : variant.trackQuantity === false || variant.stock > 0
      ? "IN_STOCK"
      : "OUT_OF_STOCK";

  // ── Identifiers: variant-এর নিজস্ব barcode/sku, নাহলে parent-এর ──
  const gtin = variant.barcode || product.barcode || null;
  const mpn = variant.sku || product.mpn || null;
  attrs.gtins = gtin ? [gtin] : undefined;
  attrs.mpn = mpn || undefined;
  if (!gtin && !mpn) attrs.identifierExists = false;
  else delete attrs.identifierExists;

  // ── Variant-identifying attributes (color / size) ──
  const vColor = pickVariantAttr(variant.attributes, ["color", "colour"]) || baseAttributes.color;
  const vSize = pickVariantAttr(variant.attributes, ["size"]) || baseAttributes.size;
  if (vColor) attrs.color = vColor;
  else delete attrs.color;
  if (vSize) attrs.size = vSize;
  else delete attrs.size;

  // ── Shipping: variant-এর নিজস্ব ওজন/মাপ থাকলে সেটাই ──
  const weightUnit = product.weightUnit ?? "kg";
  const dimUnit = product.dimensionUnit ?? "cm";
  if (variant.weight) attrs.shippingWeight = { value: Number(variant.weight), unit: weightUnit };
  if (variant.length && variant.width && variant.height) {
    attrs.shippingLength = { value: Number(variant.length), unit: dimUnit };
    attrs.shippingWidth = { value: Number(variant.width), unit: dimUnit };
    attrs.shippingHeight = { value: Number(variant.height), unit: dimUnit };
  }

  // undefined/empty বাদ
  (Object.keys(attrs) as (keyof typeof attrs)[]).forEach((key) => {
    if (attrs[key] === undefined || attrs[key] === "") delete attrs[key];
  });

  return attrs;
}

// একটা offerId Google থেকে delete — data-source mismatch হলে (পুরনো legacy feed
// থেকে আসা item) item-এর real dataSource বের করে একবার retry করে।
async function deleteSingleOffer(
  merchantapi: Awaited<ReturnType<typeof getGoogleMerchantClient>>,
  config: GmcConfig,
  offerId: string,
): Promise<void> {
  const offerSegment = buildProductSegment(config, offerId);
  const accountName = getAccountName(config);
  const productInputName = `${accountName}/productInputs/${offerSegment}`;

  try {
    await merchantapi.accounts.productInputs.delete({
      name: productInputName,
      dataSource: config.gmcDataSourceName ?? undefined,
    });
  } catch (deleteError: unknown) {
    const errMsg = deleteError instanceof Error ? deleteError.message.toLowerCase() : "";
    const isDataSourceMismatch = errMsg.includes("datasource") || errMsg.includes("data source");
    if (!isDataSourceMismatch) throw deleteError;

    const productName = `${accountName}/products/${offerSegment}`;
    const lookup = await merchantapi.accounts.products.get({ name: productName });
    const realDataSource = lookup.data.dataSource;
    if (!realDataSource || realDataSource === config.gmcDataSourceName) throw deleteError;

    await merchantapi.accounts.productInputs.delete({ name: productInputName, dataSource: realDataSource });
  }
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
  return url.replace(/^https?:\/\/(localhost:\d+|[^/]*gobike\.au)/, SITE_URL);
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
// ============================================================================
function parseTaxonomyId(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d+)\s*-/);
  if (match) return match[1];
  return trimmed || undefined;
}

// ============================================================================
// 4c. HELPER: ISO 8601 (RFC3339) ফরম্যাটে, মিলিসেকেন্ড ছাড়া
// ============================================================================
function toRfc3339(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ============================================================================
// 5. MAIN PRODUCT SYNC ENGINE (Merchant API — productInputs.insert)
// ----------------------------------------------------------------------------
// SIMPLE / BUNDLE → একটা product insert হয় (offerId = product.id / override)।
// VARIABLE        → Google-এর official recommendation অনুযায়ী প্রতিটা live
//                   variant একটা করে আলাদা product হিসেবে insert হয়
//                   (offerId = "{base}_v_{variantId}"), সবগুলোতে একই
//                   item_group_id (= base offerId)। bare parent আলাদা করে
//                   পাঠানো হয় না — SIMPLE→VARIABLE হলে পুরনো bare item টা
//                   এখানেই best-effort delete হয়। variant-ভেদে বদলায় এমন
//                   ফিল্ড (price, stock/availability, image, gtin/mpn, color,
//                   size, shipping) buildVariantProductAttributes()-এ override।
// ============================================================================
export async function syncProductToGoogle(productId: string) {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });

    if (!config?.gmcContentApiEnabled) return { success: false, error: "GMC Auto Sync is disabled." };
    if (!config.gmcDataSourceName) {
      return { success: false, error: "Merchant API data source not configured yet (gmcDataSourceName missing)." };
    }

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
        variants: {
          where: { deletedAt: null },
          orderBy: { id: "asc" },
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            price: true,
            salePrice: true,
            stock: true,
            trackQuantity: true,
            isPreOrder: true,
            googleTitle: true,
            googleDescription: true,
            image: true,
            weight: true,
            length: true,
            width: true,
            height: true,
            attributes: true,
            images: { orderBy: { position: "asc" }, select: { url: true } },
          },
        },
      },
    }) as ProductForSync | null;

    if (!product) return { success: false, error: "Product not found." };
    // Google-এর imageLink আবশ্যিক। SIMPLE/BUNDLE হলে featuredImage লাগবেই।
    // VARIABLE হলে variant-এর নিজস্ব ছবি (বা featuredImage fallback) দিয়ে চলে —
    // অন্তত একটা image source থাকলেই যথেষ্ট, per-variant validation Google করবে।
    const isVariableProduct = product.productType === "VARIABLE" && product.variants.length > 0;
    if (!isVariableProduct && !product.featuredImage) {
      return { success: false, error: "Product has no featured image. Google requires imageLink — add a featured image first." };
    }
    if (isVariableProduct && !product.featuredImage && !product.variants.some((v) => v.image || (v.images && v.images.length > 0))) {
      return { success: false, error: "This variable product has no images at all. Google requires imageLink — add a featured image or per-variant images first." };
    }

    const mappingRules =
      config.gmcAttributeMapping
        ? typeof config.gmcAttributeMapping === "string"
          ? JSON.parse(config.gmcAttributeMapping)
          : (config.gmcAttributeMapping as Record<string, unknown>)
        : null;

    const merchantapi = await getGoogleMerchantClient(config as GmcConfig);

    const isSeoTemplate = (s: string) => /%[a-z_]+%/i.test(s);
    const finalTitle =
      product.googleTitle && product.googleTitle.trim() !== "" && !isSeoTemplate(product.googleTitle)
        ? product.googleTitle
        : product.name;

    const finalDescription =
      product.googleDescription && product.googleDescription.trim() !== ""
        ? product.googleDescription
        : product.description || product.shortDescription || product.name;

    let google_size = "";
    let google_size_system = "";
    let google_size_type = "";
    let google_color = "";
    let google_material = "";
    let google_pattern = "";
    let google_multipack: number | undefined = undefined;
    let google_adult_content = false;
    let google_availability_date = "";

    if (product.size) google_size = product.size;
    if (product.color) google_color = product.color;
    if (product.material) google_material = product.material;
    if (product.pattern) google_pattern = product.pattern;

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

    const productAttributes: merchantapi_products_v1.Schema$ProductAttributes = {
      title: finalTitle,
      description: stripHtmlTags(finalDescription),
      link: formatGmcUrl(`${SITE_URL}/product/${product.slug}`),
      imageLink: formatGmcUrl(product.featuredImage),
      availability: product.isPreOrder ? "PREORDER" : (product.trackQuantity === false || product.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK"),
      // product.condition আগে থেকেই Prisma enum ProductCondition (NEW/REFURBISHED/USED),
      // যেটা Merchant API-র প্রত্যাশিত uppercase ফরম্যাটের সাথে already মিলে যায়।
      condition: product.condition,
      price: { amountMicros: String(Math.round(Number(product.price) * 1_000_000)), currencyCode: "AUD" },
      brand: product.brand?.name || "Generic",
      gtins: product.barcode ? [product.barcode] : undefined,
      mpn: product.mpn || undefined,
      gender: product.gender || undefined,
      ageGroup: product.ageGroup || undefined,
      isBundle: product.googleIsBundle,
    };

    // Sale price — শুধু তখনই পাঠানো হচ্ছে যখন এটা একটা valid discount
    if (product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.price)) {
      productAttributes.salePrice = { amountMicros: String(Math.round(Number(product.salePrice) * 1_000_000)), currencyCode: "AUD" };
      if (product.saleStart && product.saleEnd) {
        productAttributes.salePriceEffectiveDate = {
          startTime: toRfc3339(product.saleStart),
          endTime: toRfc3339(product.saleEnd),
        };
      }
    }

    // GTIN/MPN দুটোই না থাকলে identifierExists: false — নাহলে Google
    // product-টাকে "incomplete" ধরে disapprove করতে পারে
    if (!product.barcode && !product.mpn) {
      productAttributes.identifierExists = false;
    }

    if (product.images && product.images.length > 1) {
      productAttributes.additionalImageLinks = product.images.slice(1, 11).map((img) => formatGmcUrl(img.url));
    }

    const rawGoogleCategory =
      product.googleProductCategory ||
      product.categories.find((c) => c.googleCategoryName)?.googleCategoryName ||
      (mappingRules?.attributes?.defaultCategory as string | undefined);
    const googleCategory = parseTaxonomyId(rawGoogleCategory);
    if (googleCategory) productAttributes.googleProductCategory = googleCategory;

    if (product.categories.length > 0) {
      productAttributes.productTypes = [product.categories.map((c) => c.name).join(" > ")];
    }

    const weightUnit = product.weightUnit ?? "kg";
    const dimUnit = product.dimensionUnit ?? "cm";
    if (product.weight) productAttributes.shippingWeight = { value: Number(product.weight), unit: weightUnit };
    if (product.length && product.width && product.height) {
      productAttributes.shippingLength = { value: Number(product.length), unit: dimUnit };
      productAttributes.shippingWidth = { value: Number(product.width), unit: dimUnit };
      productAttributes.shippingHeight = { value: Number(product.height), unit: dimUnit };
    }

    if (google_size) productAttributes.size = google_size;
    if (google_size_system) productAttributes.sizeSystem = google_size_system;
    if (google_size_type) productAttributes.sizeTypes = [google_size_type];
    if (google_color) productAttributes.color = google_color;
    if (google_material) productAttributes.material = google_material;
    if (google_pattern) productAttributes.pattern = google_pattern;
    if (google_multipack) productAttributes.multipack = String(google_multipack);
    if (google_adult_content) productAttributes.adult = google_adult_content;
    if (google_availability_date) {
      productAttributes.availabilityDate = new Date(google_availability_date).toISOString();
    }

    if (mappingRules?.attributes) {
      const attrs = mappingRules.attributes as Record<string, string[]>;
      if (!productAttributes.color) productAttributes.color = extractMappedValue(attrs.color ?? [], product);
      if (!productAttributes.size) productAttributes.size = extractMappedValue(attrs.size ?? [], product);
      if (!productAttributes.material) productAttributes.material = extractMappedValue(attrs.material ?? [], product);
      if (!productAttributes.pattern) productAttributes.pattern = extractMappedValue(attrs.pattern ?? [], product);
      if (!productAttributes.gender) productAttributes.gender = extractMappedValue(attrs.gender ?? [], product);
      if (!productAttributes.ageGroup) productAttributes.ageGroup = extractMappedValue(attrs.ageGroup ?? [], product);
    }

    if (mappingRules?.customLabels) {
      const labels = mappingRules.customLabels as Record<string, string[]>;
      productAttributes.customLabel0 = extractMappedValue(labels.customLabel0 ?? [], product);
      productAttributes.customLabel1 = extractMappedValue(labels.customLabel1 ?? [], product);
      productAttributes.customLabel2 = extractMappedValue(labels.customLabel2 ?? [], product);
      productAttributes.customLabel3 = extractMappedValue(labels.customLabel3 ?? [], product);
      productAttributes.customLabel4 = extractMappedValue(labels.customLabel4 ?? [], product);
    }

    // gender/ageGroup admin ফর্মে lowercase সংরক্ষিত হয় ("male", "kids" ইত্যাদি,
    // v2.1-এর convention অনুযায়ী) — Merchant API-র enum uppercase আশা করে
    if (productAttributes.gender) productAttributes.gender = productAttributes.gender.toUpperCase();
    if (productAttributes.ageGroup) productAttributes.ageGroup = productAttributes.ageGroup.toUpperCase();

    // undefined/empty string ভ্যালু বাদ দেওয়া
    (Object.keys(productAttributes) as (keyof typeof productAttributes)[]).forEach((key) => {
      if (productAttributes[key] === undefined || productAttributes[key] === "") {
        delete productAttributes[key];
      }
    });

    // countryOfOrigin-এর কোনো strongly-typed field Merchant API-তে নেই
    // (googleapis-এর .d.ts টাইপ ডেফিনিশনে যাচাই করা) — তাই Google-এর নিজের
    // documented fallback অনুযায়ী customAttributes দিয়ে পাঠানো হচ্ছে, যাতে
    // এই ডেটা হারিয়ে না যায়।
    const customAttributes: merchantapi_products_v1.Schema$CustomAttribute[] = [];
    if (product.countryOfManufacture) {
      customAttributes.push({ name: "country_of_origin", value: product.countryOfManufacture });
    }

    // legacy WooCommerce/gla_ era-এর high-performing listing-এর ID ধরে রাখতে
    // (click history অক্ষত রাখার জন্য) — override সেট করা থাকলে সেটাই ব্যবহার
    // হয়, নাহলে database-এর real product.id-ই আগের মতো offerId হিসেবে যায়।
    // এটা শুধু Google-কে পাঠানো offerId — database-এর ভেতরের real ID অপরিবর্তিত।
    const googleOfferId = product.googleOfferIdOverride || product.id;

    const contentLanguage = (config.gmcLanguage || "en").toLowerCase().trim();
    const feedLabel = (config.gmcTargetCountry || "AU").toUpperCase().trim();
    const accountName = getAccountName(config as GmcConfig);
    const customAttributesBody = customAttributes.length > 0 ? customAttributes : undefined;

    // ========================================================================
    // SIMPLE / BUNDLE — একটাই product, আগের মতোই
    // ========================================================================
    if (!isVariableProduct) {
      const response = await merchantapi.accounts.productInputs.insert({
        parent: accountName,
        dataSource: config.gmcDataSourceName,
        requestBody: {
          contentLanguage,
          feedLabel,
          offerId: googleOfferId,
          productAttributes,
          customAttributes: customAttributesBody,
        },
      });

      const channelProductId =
        response.data.product ||
        `${accountName}/products/${buildProductSegment(config as GmcConfig, googleOfferId)}`;

      await db.productChannelStatus.upsert({
        where: { productId_channel: { productId: product.id, channel: "GOOGLE" } },
        update: {
          status: "SYNCED",
          channelProductId,
          errorMessage: null,
          googleIssues: Prisma.DbNull,
          lastSyncedAt: new Date(),
        },
        create: {
          productId: product.id,
          channel: "GOOGLE",
          status: "SYNCED",
          channelProductId,
          lastSyncedAt: new Date(),
        },
      });

      return { success: true, message: "Product synced successfully." };
    }

    // ========================================================================
    // VARIABLE — প্রতিটা variant Google-এ আলাদা product, shared item_group_id
    // (Google recommendation: parent আলাদা করে পাঠানো হয় না)
    // ========================================================================

    // আগে যদি এই product SIMPLE হিসেবে sync হয়ে থাকে, Google-এ একটা bare
    // parent item পড়ে আছে — variable হওয়ার পর ওটা orphan, best-effort delete।
    try {
      await deleteSingleOffer(merchantapi, config as GmcConfig, googleOfferId);
    } catch {
      /* ছিল না / আগে থেকেই নেই — ঠিক আছে */
    }

    const variantErrors: string[] = [];
    let syncedVariantCount = 0;

    for (const variant of product.variants) {
      const variantOfferId = buildVariantOfferId(googleOfferId, variant.id);
      const variantAttributes = buildVariantProductAttributes(
        productAttributes,
        product,
        variant,
        googleOfferId,
      );

      try {
        await merchantapi.accounts.productInputs.insert({
          parent: accountName,
          dataSource: config.gmcDataSourceName,
          requestBody: {
            contentLanguage,
            feedLabel,
            offerId: variantOfferId,
            productAttributes: variantAttributes,
            customAttributes: customAttributesBody,
          },
        });
        syncedVariantCount++;
      } catch (variantErr: unknown) {
        const vObj = variantErr as {
          response?: { data?: { error?: { message?: string } } };
          message?: string;
        };
        const vMsg =
          vObj.response?.data?.error?.message ??
          (variantErr instanceof Error ? variantErr.message : "Unknown error");
        variantErrors.push(`${variant.name}: ${vMsg}`);
      }
    }

    const allFailed = syncedVariantCount === 0;
    const someFailed = variantErrors.length > 0;
    const statusValue = allFailed ? "FAILED" : "SYNCED";
    const errMsg = someFailed
      ? `${variantErrors.length}/${product.variants.length} variant(s) failed: ${variantErrors[0]}`
      : null;
    const channelProductId = `itemGroup:${googleOfferId} (${syncedVariantCount}/${product.variants.length} variants)`;

    await db.productChannelStatus.upsert({
      where: { productId_channel: { productId: product.id, channel: "GOOGLE" } },
      update: {
        status: statusValue,
        channelProductId,
        errorMessage: errMsg,
        googleIssues: Prisma.DbNull,
        lastSyncedAt: new Date(),
      },
      create: {
        productId: product.id,
        channel: "GOOGLE",
        status: statusValue,
        channelProductId,
        errorMessage: errMsg,
        lastSyncedAt: new Date(),
      },
    });

    if (allFailed) {
      return { success: false, error: errMsg ?? "All variants failed to sync." };
    }
    return {
      success: true,
      message: someFailed
        ? `Synced ${syncedVariantCount}/${product.variants.length} variants. ${errMsg}`
        : `Synced ${syncedVariantCount} variant(s) successfully.`,
    };
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
// 6. REMOVE PRODUCT FROM GOOGLE (productInputs.delete)
// ============================================================================
export async function removeProductFromGoogle(productId: string) {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) return { success: false, error: "GMC not enabled." };
    if (!config.gmcDataSourceName) return { success: false, error: "Merchant API data source not configured yet." };

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { googleOfferIdOverride: true, productType: true, variants: { select: { id: true } } },
    });
    const googleOfferId = product?.googleOfferIdOverride || productId;

    const merchantapi = await getGoogleMerchantClient(config as GmcConfig);

    // VARIABLE হলে প্রতিটা variant Google-এ আলাদা item — সবগুলো delete করতে হবে।
    // সাথে bare parent offerId-ও (আগে SIMPLE হিসেবে sync হয়ে থাকতে পারে)।
    const isVariable = product?.productType === "VARIABLE" && (product?.variants.length ?? 0) > 0;
    const offerIdsToDelete = isVariable
      ? [...product!.variants.map((v) => buildVariantOfferId(googleOfferId, v.id)), googleOfferId]
      : [googleOfferId];

    for (const offerId of offerIdsToDelete) {
      try {
        await deleteSingleOffer(merchantapi, config as GmcConfig, offerId);
      } catch (err: unknown) {
        const eObj = err as { response?: { status?: number }; status?: number };
        const code = eObj.response?.status ?? eObj.status ?? 0;
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        // 404 = আগে থেকেই নেই — বাকি offer গুলো চালিয়ে যাও
        if (code === 404 || msg.includes("not found")) continue;
        throw err;
      }
    }

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
// Merchant API-তে customBatch নেই (Google-এর নিজস্ব migration guide অনুযায়ী)
// — কিন্তু পুরনো কোডও কখনো customBatch ব্যবহার করেনি, এই 5-এর chunk-এ
// concurrent call করার প্যাটার্নটাই আগে থেকেই সঠিক পন্থা, তাই অপরিবর্তিত।
// ============================================================================
export async function bulkUpdateProductVisibility(
  updates: { productId: string; status: "SYNCED" | "EXCLUDED" }[]
) {
  await security.assertAdmin();
  try {
    if (!updates || updates.length === 0) return { success: true };

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
// Shared: একটা processed Product-এর destinationStatuses/itemLevelIssues থেকে
// লোকাল status বের করা। Merchant API-তে destinationStatuses-এ আর "status"
// field নেই — approvedCountries/disapprovedCountries/pendingCountries array আছে।
// ============================================================================
function resolveStatusFromProductStatus(
  productStatus: merchantapi_products_v1.Schema$ProductStatus | undefined
): { finalStatus: "SYNCED" | "FAILED" | "PENDING"; errorMessage: string | null; googleIssues: Prisma.InputJsonValue | typeof Prisma.DbNull } {
  const destinationStatuses = productStatus?.destinationStatuses || [];
  const isDisapproved = destinationStatuses.some((d) => (d.disapprovedCountries?.length ?? 0) > 0);
  const isPending = destinationStatuses.some((d) => (d.pendingCountries?.length ?? 0) > 0);

  if (isDisapproved) {
    const issues = productStatus?.itemLevelIssues || [];
    return {
      finalStatus: "FAILED",
      errorMessage: issues.length > 0 ? issues[0].description ?? "Disapproved by Google." : "Disapproved by Google.",
      googleIssues: issues as unknown as Prisma.InputJsonValue,
    };
  }
  if (isPending) {
    return { finalStatus: "PENDING", errorMessage: "Pending policy review by Google.", googleIssues: Prisma.DbNull };
  }
  return { finalStatus: "SYNCED", errorMessage: null, googleIssues: Prisma.DbNull };
}

// ============================================================================
// 9. SYNC LIVE PRODUCT STATUSES FROM GOOGLE (on-demand, not on every page load)
// ============================================================================
export async function syncLiveProductStatuses() {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) return { success: false };

    const merchantapi = await getGoogleMerchantClient(config as GmcConfig);
    const parent = getAccountName(config as GmcConfig);

    const firstPage = await merchantapi.accounts.products.list({ parent, pageSize: 250 });
    const products = [...(firstPage.data.products ?? [])];
    let pageToken: string | undefined = firstPage.data.nextPageToken ?? undefined;
    while (pageToken) {
      const page = await merchantapi.accounts.products.list({ parent, pageSize: 250, pageToken });
      products.push(...(page.data.products ?? []));
      pageToken = page.data.nextPageToken ?? undefined;
    }
    if (products.length === 0) return { success: true };

    // Batch-fetch all local statuses and product IDs to avoid N+1 queries
    const [existingStatuses, existingProducts] = await Promise.all([
      db.productChannelStatus.findMany({
        where: { channel: "GOOGLE" },
        select: { productId: true, status: true },
      }),
      db.product.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          googleOfferIdOverride: true,
          variants: { where: { deletedAt: null }, select: { id: true } },
        },
      }),
    ]);

    const excludedSet = new Set(
      existingStatuses.filter((s) => s.status === "EXCLUDED").map((s) => s.productId)
    );
    const validProductIds = new Set(existingProducts.map((p) => p.id));
    // Google-এ ফিরে আসা প্রতিটা offerId → local productId।
    //   - base offerId (product.id বা gla_ override) → SIMPLE/BUNDLE
    //   - "{base}_v_{variantId}" → VARIABLE product-এর variant, parent-এ ম্যাপ করে
    const offerToProductId = new Map<string, string>();
    for (const p of existingProducts) {
      const base = p.googleOfferIdOverride || p.id;
      offerToProductId.set(base, p.id);
      for (const v of p.variants) offerToProductId.set(buildVariantOfferId(base, v.id), p.id);
    }

    // একই product-এর একাধিক variant item থাকলে সবচেয়ে "খারাপ" status-টা নেওয়া হয়
    // (FAILED > PENDING > SYNCED) — যাতে একটা variant disapprove হলে admin দেখে।
    const RANK: Record<"SYNCED" | "PENDING" | "FAILED", number> = { SYNCED: 1, PENDING: 2, FAILED: 3 };
    type ResolvedStatus = ReturnType<typeof resolveStatusFromProductStatus>;
    const aggregated = new Map<string, ResolvedStatus>();

    for (const gp of products) {
      const offerId = gp.offerId ?? "";
      const localProductId = offerToProductId.get(offerId) ?? offerId;
      if (!localProductId || excludedSet.has(localProductId) || !validProductIds.has(localProductId)) {
        continue;
      }
      const resolved = resolveStatusFromProductStatus(gp.productStatus);
      const prev = aggregated.get(localProductId);
      if (!prev || RANK[resolved.finalStatus] > RANK[prev.finalStatus]) {
        aggregated.set(localProductId, resolved);
      }
    }

    const upsertOps = [...aggregated.entries()].map(([productId, s]) =>
      db.productChannelStatus.upsert({
        where: { productId_channel: { productId, channel: "GOOGLE" } },
        update: { status: s.finalStatus, errorMessage: s.errorMessage, googleIssues: s.googleIssues, lastSyncedAt: new Date() },
        create: { productId, channel: "GOOGLE", status: s.finalStatus, errorMessage: s.errorMessage, googleIssues: s.googleIssues, lastSyncedAt: new Date() },
      })
    );

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

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { googleOfferIdOverride: true, productType: true, variants: { where: { deletedAt: null }, select: { id: true } } },
    });
    const googleOfferId = product?.googleOfferIdOverride || productId;

    const merchantapi = await getGoogleMerchantClient(config as GmcConfig);
    const accountName = getAccountName(config as GmcConfig);

    // VARIABLE হলে bare parent Google-এ থাকে না — প্রতিটা variant offer চেক করে
    // সবচেয়ে খারাপ status নেওয়া হয় (FAILED > PENDING > SYNCED)।
    const isVariable = product?.productType === "VARIABLE" && (product?.variants.length ?? 0) > 0;
    const offerIds = isVariable
      ? product!.variants.map((v) => buildVariantOfferId(googleOfferId, v.id))
      : [googleOfferId];

    const RANK: Record<"SYNCED" | "PENDING" | "FAILED", number> = { SYNCED: 1, PENDING: 2, FAILED: 3 };
    let finalStatus: "SYNCED" | "FAILED" | "PENDING" = "PENDING";
    let errorMessage: string | null = "Not synced yet or pending policy review by Google.";
    let googleIssues: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
    let anyFound = false;

    for (const offerId of offerIds) {
      const productName = `${accountName}/products/${buildProductSegment(config as GmcConfig, offerId)}`;
      try {
        const response = await merchantapi.accounts.products.get({ name: productName });
        const resolved = resolveStatusFromProductStatus(response.data.productStatus);
        if (!anyFound || RANK[resolved.finalStatus] > RANK[finalStatus]) {
          finalStatus = resolved.finalStatus;
          errorMessage = resolved.errorMessage;
          googleIssues = resolved.googleIssues;
        }
        anyFound = true;
      } catch (apiError: unknown) {
        const errObj = apiError as { status?: number; message?: string };
        if (errObj.status === 404 || errObj.message?.toLowerCase().includes("not found")) {
          continue;
        }
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

// ============================================================================
// 11. GET REAL GOOGLE MC LIVE STATS (product count + status breakdown)
// ============================================================================
export async function getGoogleMCStats() {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) {
      return { success: false, data: null };
    }
    const merchantapi = await getGoogleMerchantClient(config as GmcConfig);
    const parent = getAccountName(config as GmcConfig);

    const firstPage = await merchantapi.accounts.products.list({ parent, pageSize: 250 });
    const products = [...(firstPage.data.products ?? [])];
    let pageToken: string | undefined = firstPage.data.nextPageToken ?? undefined;
    while (pageToken) {
      const page = await merchantapi.accounts.products.list({ parent, pageSize: 250, pageToken });
      products.push(...(page.data.products ?? []));
      pageToken = page.data.nextPageToken ?? undefined;
    }

    // নোট: variable product-এর প্রতিটা variant Google-এ আলাদা item — তাই এই
    // count গুলো item-ভিত্তিক (DB-র product সংখ্যার চেয়ে বেশি হতে পারে, যেটা
    // Google MC-র নিজের "Products" সংখ্যার সাথে মেলে)।
    let approved = 0, disapproved = 0, pending = 0;
    for (const p of products) {
      const dests = p.productStatus?.destinationStatuses ?? [];
      if (dests.some((d) => (d.disapprovedCountries?.length ?? 0) > 0)) disapproved++;
      else if (dests.some((d) => (d.pendingCountries?.length ?? 0) > 0)) pending++;
      else approved++;
    }

    return {
      success: true,
      data: { totalProducts: products.length, approved, disapproved, pending },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, data: null, error: msg };
  }
}

// ============================================================================
// 12. CLEANUP STALE GOOGLE MC PRODUCTS
// Deletes products from Google MC that are NOT:
//   - gla_XXXX (old WooCommerce imports — kept intentionally)
//   - একটা current DB product-এর বৈধ offerId:
//       • SIMPLE/BUNDLE → product.id (বা override)
//       • VARIABLE      → "{base}_v_{variantId}" প্রতিটা live variant-এর জন্য
// ============================================================================
export async function cleanupStaleGoogleProducts() {
  await security.assertAdmin();
  try {
    const config = await db.marketingIntegration.findUnique({ where: { id: "marketing_config" } });
    if (!config?.gmcContentApiEnabled || !config.gmcMerchantId) {
      return { success: false, error: "GMC is not enabled or Merchant ID is missing." };
    }
    if (!config.gmcDataSourceName) return { success: false, error: "Merchant API data source not configured yet." };

    const merchantapi = await getGoogleMerchantClient(config as GmcConfig);
    const parent = getAccountName(config as GmcConfig);

    const dbProducts = await db.product.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        googleOfferIdOverride: true,
        productType: true,
        variants: { where: { deletedAt: null }, select: { id: true } },
      },
    });
    // এখন Google-এ যেসব offerId থাকা বৈধ:
    //   - SIMPLE / BUNDLE → base offerId (product.id বা override)
    //   - VARIABLE → শুধু "{base}_v_{variantId}" (bare parent নয়)
    // hard-deleted variant বা SIMPLE→VARIABLE হয়ে যাওয়া product-এর পুরনো
    // bare item এতে ধরা পড়ে গিয়ে stale হিসেবে delete হয়।
    const validOfferIds = new Set<string>();
    for (const p of dbProducts) {
      const base = p.googleOfferIdOverride || p.id;
      if (p.productType === "VARIABLE" && p.variants.length > 0) {
        for (const v of p.variants) validOfferIds.add(buildVariantOfferId(base, v.id));
      } else {
        validOfferIds.add(base);
      }
    }

    const allGoogleProducts: merchantapi_products_v1.Schema$Product[] = [];
    const firstPage = await merchantapi.accounts.products.list({ parent, pageSize: 250 });
    allGoogleProducts.push(...(firstPage.data.products ?? []));
    let pageToken: string | undefined = firstPage.data.nextPageToken ?? undefined;
    while (pageToken) {
      const page = await merchantapi.accounts.products.list({ parent, pageSize: 250, pageToken });
      allGoogleProducts.push(...(page.data.products ?? []));
      pageToken = page.data.nextPageToken ?? undefined;
    }

    // Stale = gla_ prefix (পুরনো WooCommerce import, ইচ্ছাকৃতভাবে রাখা) না,
    // এবং বর্তমান DB-তে নেইও — এমন প্রোডাক্ট
    const toDelete: { productInputName: string; dataSource: string }[] = [];
    for (const item of allGoogleProducts) {
      const offerId = item.offerId ?? "";
      const isGla = offerId.startsWith("gla_");
      const isInDb = validOfferIds.has(offerId);
      // প্রতিটা item তার নিজস্ব dataSource-এর অন্তর্গত (v2.1-এর পুরনো legacy feed
      // থেকে আসা item আমাদের নতুন Merchant API data source-এর অংশ না) — delete
      // call-এ item-এর real dataSource ব্যবহার করতে হবে, নিজেরটা ধরে নেওয়া যাবে না।
      // লাইভ টেস্টে এটা ভুল হলে Google "item does not belong to the given data
      // source" error দেয়, ধরা পড়েছে।
      if (offerId && !isGla && !isInDb && item.name && item.dataSource) {
        toDelete.push({
          productInputName: item.name.replace("/products/", "/productInputs/"),
          dataSource: item.dataSource,
        });
      }
    }

    if (toDelete.length === 0) {
      return { success: true, deleted: 0, total: allGoogleProducts.length, message: "No stale products found." };
    }

    const BATCH = 5;
    let deleted = 0;
    let failed = 0;
    for (let i = 0; i < toDelete.length; i += BATCH) {
      const batch = toDelete.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map((entry) =>
          merchantapi.accounts.productInputs
            .delete({ name: entry.productInputName, dataSource: entry.dataSource })
            .then(() => true)
            .catch(() => false)
        )
      );
      deleted += results.filter(Boolean).length;
      failed += results.filter((r) => !r).length;
    }

    revalidatePath("/admin/marketing/merchant-center");
    return {
      success: true,
      deleted,
      kept: allGoogleProducts.length - deleted,
      total: allGoogleProducts.length,
      message: failed > 0
        ? `Deleted ${deleted} stale product(s). ${failed} could not be deleted (check server logs). ${allGoogleProducts.length - deleted} kept.`
        : `Deleted ${deleted} stale product(s) from Google MC. ${allGoogleProducts.length - deleted} kept.`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("GMC Cleanup Error:", msg);
    return { success: false, error: msg };
  }
}
