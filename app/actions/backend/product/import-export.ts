// ============================================================
// Location: app/actions/backend/product/import-export.ts
// Version: 2.0 — Full Schema Aligned
// Fixed: Duplicate prevention, Attributes, Facebook, Google
//        Merchant, Sale dates, Backorders, Variations export,
//        Category slug, PapaParse types, all missing fields
// ============================================================

"use server";

import { db }            from "@/lib/prisma";
import Papa              from "papaparse";
import { revalidatePath } from "next/cache";
import crypto            from "crypto";
import {
  ProductStatus,
  ProductType,
  BackorderStatus,
  TaxStatus,
  ProductCondition,
  CommissionType,
  ChannelSyncStatus,
  SalesChannel,
} from "@prisma/client";

// ============================================================
// SECTION 1: UTILITIES
// ============================================================

/** name → url-safe slug */
const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/** যেকোনো value → safe float */
const safeFloat = (val: any): number | null => {
  if (val === null || val === undefined || String(val).trim() === "") return null;
  const n = parseFloat(String(val).replace(/[^\d.-]/g, ""));
  return isNaN(n) ? null : n;
};

/** যেকোনো value → safe int */
const safeInt = (val: any): number | null => {
  if (val === null || val === undefined || String(val).trim() === "") return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
};

/** "1" / "yes" / "true" → boolean */
const safeBool = (val: any): boolean =>
  ["1", "yes", "true"].includes(String(val ?? "").toLowerCase().trim());

/** খালি string → null */
const nullIfEmpty = (val: any): string | null => {
  const s = String(val ?? "").trim();
  return s === "" ? null : s;
};

/** WC date string → Date | null */
const safeDate = (val: any): Date | null => {
  if (!val || String(val).trim() === "") return null;
  const d = new Date(String(val).trim());
  return isNaN(d.getTime()) ? null : d;
};

/** WC Type → Prisma ProductType */
const mapProductType = (type: string): ProductType => {
  const t = (type || "simple").toLowerCase().trim();
  const map: Record<string, ProductType> = {
    simple:       "SIMPLE",
    variable:     "VARIABLE",
    virtual:      "VIRTUAL",
    downloadable: "DOWNLOADABLE",
    grouped:      "BUNDLE",
    bundle:       "BUNDLE",
    subscription: "SUBSCRIPTION",
    "gift-card":  "GIFT_CARD",
  };
  return map[t] ?? "SIMPLE";
};

/** WC backorders → Prisma BackorderStatus */
const mapBackorder = (val: string): BackorderStatus => {
  const v = String(val ?? "").toLowerCase().trim();
  if (v === "notify" || v === "allow_but_notify") return "ALLOW_BUT_NOTIFY";
  if (v === "yes"    || v === "allow" || v === "1") return "ALLOW";
  return "DO_NOT_ALLOW";
};

/** WC tax status → Prisma TaxStatus */
const mapTaxStatus = (val: string): TaxStatus => {
  const v = String(val ?? "").toLowerCase().trim();
  if (v === "shipping") return "SHIPPING_ONLY";
  if (v === "none")     return "NONE";
  return "TAXABLE";
};

/** WC condition → Prisma ProductCondition */
const mapCondition = (val: string): ProductCondition => {
  const v = String(val ?? "").toLowerCase().trim();
  if (v === "refurbished") return "REFURBISHED";
  if (v === "used")        return "USED";
  return "NEW";
};

/** Google/FB sync status → Prisma ChannelSyncStatus */
const mapSyncStatus = (val: string): ChannelSyncStatus => {
  const v = String(val ?? "").toLowerCase().trim();
  if (v === "synced"   || v === "approved") return "SYNCED";
  if (v === "failed"   || v === "disapproved" || v === "rejected") return "FAILED";
  if (v === "excluded" || v === "0" || v === "false") return "EXCLUDED";
  return "PENDING";
};

// ============================================================
// SECTION 2: SLUG — collision-safe, deterministic
// ============================================================

/**
 * Slug তৈরি: name থেকে।
 * Re-import এ same slug আসবে (random নয়) — duplicate prevention এর জন্য।
 * Collision হলে WC ID দিয়ে suffix।
 */
const buildProductSlug = async (name: string, wcId?: string): Promise<string> => {
  const base = generateSlug(name);
  if (!base) return `product-${wcId ?? crypto.randomBytes(4).toString("hex")}`;

  // Check existing
  const existing = await db.product.findFirst({
    where:  { slug: base },
    select: { id: true, metafields: true },
  });

  if (!existing) return base;

  // Same WC ID → same product (re-import) → reuse slug
  const meta = existing.metafields as any;
  if (wcId && meta?.wcId === wcId) return base;

  // Different product, same slug → suffix with wcId or random
  const suffix = wcId ?? crypto.randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
};

// ============================================================
// SECTION 3: CATEGORY UPSERT (Hierarchy)
// ============================================================

/**
 * "Bikes > Mountain Bikes" → parent-child category chain তৈরি।
 * Slug collision এড়াতে parentId সহ unique check।
 */
const upsertCategoryChain = async (
  categoryStr: string
): Promise<string[]> => {
  if (!categoryStr.trim()) return [];

  // Comma separated groups: "Bikes > MTB, Accessories"
  const groups = categoryStr.split(",").map((s) => s.trim()).filter(Boolean);
  const finalIds: string[] = [];

  for (const group of groups) {
    const parts = group.split(">").map((s) => s.trim()).filter(Boolean);
    let parentId: string | null = null;

    for (let i = 0; i < parts.length; i++) {
      const catName = parts[i];
      const catSlug = generateSlug(catName);

      // parentId সহ unique find — same slug কিন্তু আলাদা parent হতে পারে
      let cat: { id: string; name: string; slug: string; parentId: string | null } | null
        = await db.category.findFirst({
          where: { slug: catSlug, parentId: parentId },
        });

      if (!cat) {
        // Slug globally unique check
        const slugExists: { id: string } | null = await db.category.findFirst({ where: { slug: catSlug }, select: { id: true } });
        const finalSlug: string = slugExists
          ? `${catSlug}-${parentId ? parentId.substring(0, 4) : "root"}`
          : catSlug;

        cat = await db.category.create({
          data: { name: catName, slug: finalSlug, parentId },
        });
      }

      parentId = cat.id;

      // শুধু leaf (শেষ) category টা product এ connect হবে
      if (i === parts.length - 1) {
        if (!finalIds.includes(cat.id)) finalIds.push(cat.id);
      }
    }
  }

  return finalIds;
};

// ============================================================
// SECTION 4: ATTRIBUTE UPSERT (Simple Product)
// ============================================================

/**
 * CSV row থেকে "Attribute N name/value/visible/global" পার্স করে
 * ProductAttribute তৈরি করে।
 */
const upsertProductAttributes = async (
  productId: string,
  row: Record<string, string>
): Promise<void> => {
  // সব existing attribute মুছে নতুন করে insert (clean slate)
  await db.productAttribute.deleteMany({ where: { productId } });

  const attrEntries: Array<{
    name: string; values: string[]; visible: boolean; variation: boolean; position: number;
  }> = [];

  // "Attribute 1 name", "Attribute 2 name" ... সব খোঁজা
  const maxAttrs = 10;
  for (let i = 1; i <= maxAttrs; i++) {
    const nameKey    = `Attribute ${i} name`;
    const valueKey   = `Attribute ${i} value(s)`;
    const visibleKey = `Attribute ${i} visible`;
    const globalKey  = `Attribute ${i} global`;

    const attrName = nullIfEmpty(row[nameKey]);
    if (!attrName) continue;

    const rawValues = row[valueKey] ?? "";
    const values    = rawValues.split("|").map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) continue;

    attrEntries.push({
      name:      attrName,
      values,
      visible:   safeBool(row[visibleKey] ?? "1"),
      variation: safeBool(row[globalKey]  ?? "1"),
      position:  i - 1,
    });
  }

  if (attrEntries.length === 0) return;

  await db.productAttribute.createMany({
    data: attrEntries.map((a) => ({
      productId,
      name:      a.name,
      values:    a.values,
      visible:   a.visible,
      variation: a.variation,
      position:  a.position,
    })),
  });
};

// ============================================================
// SECTION 5: CHANNEL STATUS UPSERT (Google + Facebook)
// ============================================================

const upsertChannelStatus = async (
  productId: string,
  channel:   SalesChannel,
  status:    ChannelSyncStatus,
  channelProductId?: string | null
): Promise<void> => {
  await db.productChannelStatus.upsert({
    where:  { productId_channel: { productId, channel } },
    update: { status, channelProductId: channelProductId ?? null, lastSyncedAt: new Date() },
    create: { productId, channel, status, channelProductId: channelProductId ?? null },
  });
};

// ============================================================
// SECTION 6: PRODUCT IMAGES UPSERT
// ============================================================

const upsertProductImages = async (
  productId: string,
  imageUrls: string[]
): Promise<void> => {
  if (imageUrls.length === 0) return;

  // Existing images fetch
  const existing = await db.productImage.findMany({
    where:  { productId },
    select: { url: true },
  });
  const existingUrls = new Set(existing.map((i) => i.url));

  // নতুন images শুধু add করা
  const newImages = imageUrls.filter((url) => !existingUrls.has(url));
  if (newImages.length === 0) return;

  const startPos = existing.length;
  await db.productImage.createMany({
    data: newImages.map((url, idx) => ({
      productId,
      url,
      position: startPos + idx,
    })),
  });
};

// ============================================================
// SECTION 7: MAIN IMPORT FUNCTION
// ============================================================

export interface ProductImportResult {
  success:      boolean;
  message?:     string;
  error?:       string;
  successCount: number;
  skipCount:    number;
  failCount:    number;
  errors:       string[];
}

export async function importProductsCSV(
  csvString: string
): Promise<ProductImportResult> {
  const result: ProductImportResult = {
    success: false, successCount: 0, skipCount: 0, failCount: 0, errors: [],
  };

  try {
    // ── PapaParse (TypeScript safe) ──
    const parseResult = Papa.parse<Record<string, string>>(csvString, {
      header:          true,
      skipEmptyLines:  true,
      transformHeader: (h: string) => h.trim(),
    });
    const rows = parseResult.data;

    // SKU → Product ID map (Pass 2 variation এর জন্য)
    const skuToIdMap = new Map<string, string>();

    // ================================================================
    // PASS 1: Simple, Variable, Virtual, Downloadable, Bundle products
    // ================================================================
    for (const row of rows) {
      const type = (row["Type"] ?? "simple").toLowerCase().trim();
      if (type === "variation") continue;

      const name = nullIfEmpty(row["Name"]);
      if (!name) continue;

      const wcId  = nullIfEmpty(row["ID"]);
      const rawSku = nullIfEmpty(row["SKU"]);

      try {
        // ── Financial ──
        const price        = safeFloat(row["Regular price"]) ?? 0;
        const salePrice    = safeFloat(row["Sale price"]);
        const costPerItem  = safeFloat(row["Cost of goods"]);
        const saleStart    = safeDate(row["Date sale price starts"]);
        const saleEnd      = safeDate(row["Date sale price ends"]);

        // ── Physical ──
        const weight = safeFloat(row["Weight (kg)"]);
        const length = safeFloat(row["Length (cm)"]);
        const width  = safeFloat(row["Width (cm)"]);
        const height = safeFloat(row["Height (cm)"]);

        // ── Stock ──
        const stock             = safeInt(row["Stock"]) ?? 0;
        const lowStockThreshold = safeInt(row["Low stock amount"]) ?? 2;
        const trackQuantity     = safeBool(row["In stock?"]);
        const backorderStatus   = mapBackorder(row["Backorders allowed?"] ?? "");
        const soldIndividually  = safeBool(row["Sold individually?"]);

        // ── Status & Type ──
        const status      = row["Published"] === "1" ? "ACTIVE" : "DRAFT" as ProductStatus;
        const productType = mapProductType(type);
        const isFeatured  = safeBool(row["Is featured?"]);
        const taxStatus   = mapTaxStatus(row["Tax status"] ?? "taxable");
        const menuOrder   = safeInt(row["Position"]) ?? 0;

        // ── Content ──
        const description      = nullIfEmpty(row["Description"]) ?? "";
        const shortDescription = nullIfEmpty(row["Short description"]) ?? "";
        const purchaseNote     = nullIfEmpty(row["Purchase note"]);
        const barcode          = nullIfEmpty(row["GTIN, UPC, EAN, or ISBN"]);

        // ── Download ──
        const downloadLimit  = safeInt(row["Download limit"]);
        const downloadExpiry = safeInt(row["Download expiry days"]);
        const isDownloadable = type === "downloadable";
        const isVirtual      = type === "virtual";

        // ── IDs ──
        const upsellIds   = row["Upsells"]
          ? row["Upsells"].split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const crossSellIds = row["Cross-sells"]
          ? row["Cross-sells"].split(",").map((s) => s.trim()).filter(Boolean)
          : [];

        // ── Google Merchant Fields ──
        const condition = mapCondition(
          row["Meta: _wc_gla_condition"] || row["Meta: fb_product_condition"] || "new"
        );
        const gender  = nullIfEmpty(row["Meta: _wc_gla_gender"]  || row["Meta: fb_gender"]);
        const ageGroup = nullIfEmpty(row["Meta: _wc_gla_ageGroup"] || row["Meta: fb_age_group"]);
        const googleProductCategory = nullIfEmpty(row["Meta: _wc_gla_product_category"]);
        const googleTitle = nullIfEmpty(row["Meta: rank_math_title"]);
        const googleDescription = nullIfEmpty(row["Meta: _wc_gla_description"] || row["Meta: fb_product_description"]);

        // ── SEO ──
        const metaTitle = nullIfEmpty(
          row["Meta: rank_math_title"] || row["Meta: _aioseo_title"] || ""
        );
        const metaDesc = nullIfEmpty(
          row["Meta: rank_math_description"] || row["Meta: _aioseo_description"] || ""
        );

        // ── View Count ──
        const viewCount = safeInt(row["Meta: ekit_post_views_count"]) ?? 0;

        // ── metafields JSON (বাকি সব Meta fields) ──
        const metafields: Record<string, any> = {
          wcId,
          visibility:    nullIfEmpty(row["Visibility in catalog"]) ?? "visible",
          externalUrl:   nullIfEmpty(row["External URL"]),
          buttonText:    nullIfEmpty(row["Button text"]),
          // Facebook specific
          fb: {
            description: nullIfEmpty(row["Meta: fb_product_description"]),
            brand:       nullIfEmpty(row["Meta: fb_brand"]),
            mpn:         nullIfEmpty(row["Meta: fb_mpn"]),
            size:        nullIfEmpty(row["Meta: fb_size"]),
            color:       nullIfEmpty(row["Meta: fb_color"]),
            material:    nullIfEmpty(row["Meta: fb_material"]),
            pattern:     nullIfEmpty(row["Meta: fb_pattern"]),
            imageSource: nullIfEmpty(row["Meta: _wc_facebook_product_image_source"]),
            productImage: nullIfEmpty(row["Meta: fb_product_image"]),
            richText:    nullIfEmpty(row["Meta: fb_rich_text_description"]),
            videoSource: nullIfEmpty(row["Meta: _wc_facebook_product_video_source"]),
          },
          // Google specific
          gla: {
            sizeSystem: nullIfEmpty(row["Meta: _wc_gla_sizeSystem"]),
            sizeType:   nullIfEmpty(row["Meta: _wc_gla_sizeType"]),
            size:       nullIfEmpty(row["Meta: _wc_gla_size"]),
            color:      nullIfEmpty(row["Meta: _wc_gla_color"]),
            material:   nullIfEmpty(row["Meta: _wc_gla_material"]),
            syncedAt:   nullIfEmpty(row["Meta: _wc_gla_synced_at"]),
          },
          // Focus keyword (SEO)
          focusKeyword: nullIfEmpty(row["Meta: rank_math_focus_keyword"]),
        };

        // ── Images ──
        const imageUrls = (row["Images"] ?? "")
          .split(",")
          .map((u: string) => u.trim())
          .filter(Boolean);
        const featuredImage = imageUrls[0] ?? null;

        // ── Categories ──
        const categoryIds = await upsertCategoryChain(row["Categories"] ?? "");

        // ── Brand ──
        let brandConnect: any = undefined;
        const brandName = nullIfEmpty(
          row["Brands"] || row["Brand"] || row["Meta: _wc_gla_brand"] || row["Meta: fb_brand"]
        );
        if (brandName) {
          const cleanBrand = brandName.split(">").pop()?.trim() ?? brandName;
          const brandSlug  = generateSlug(cleanBrand);
          brandConnect = {
            connectOrCreate: {
              where:  { slug: brandSlug },
              create: { name: cleanBrand, slug: brandSlug },
            },
          };
        }

        // ── Tags ──
        const tagsConnect =
          row["Tags"] && row["Tags"].trim()
            ? {
                connectOrCreate: row["Tags"]
                  .split(",")
                  .map((t: string) => t.trim())
                  .filter(Boolean)
                  .map((tagName: string) => ({
                    where:  { slug: generateSlug(tagName) },
                    create: { name: tagName, slug: generateSlug(tagName) },
                  })),
              }
            : undefined;

        // ── Shipping Class ──
        let shippingClassConnect: any = undefined;
        const shippingClassName = nullIfEmpty(row["Shipping class"]);
        if (shippingClassName) {
          const scSlug = generateSlug(shippingClassName);
          shippingClassConnect = {
            connectOrCreate: {
              where:  { slug: scSlug },
              create: { name: shippingClassName, slug: scSlug },
            },
          };
        }

        // ── Duplicate Check Strategy ──
        // Priority: 1) SKU  2) wcId (metafields)  3) Slug (name based)
        let existingProduct: { id: string; slug: string } | null = null;

        if (rawSku) {
          existingProduct = await db.product.findUnique({
            where:  { sku: rawSku },
            select: { id: true, slug: true },
          });
        }

        if (!existingProduct && wcId) {
          existingProduct = await db.product.findFirst({
            where:  { metafields: { path: ["wcId"], equals: wcId } },
            select: { id: true, slug: true },
          });
        }

        // ── Core Data Object (create & update দুটোতেই একই) ──
        const coreData = {
          name,
          productType,
          status:            status as ProductStatus,
          isFeatured,
          description,
          shortDescription,
          price,
          salePrice,
          saleStart,
          saleEnd,
          costPerItem,
          barcode,
          purchaseNote,
          taxStatus,
          trackQuantity,
          stock,
          lowStockThreshold,
          backorderStatus,
          soldIndividually,
          weight,
          length,
          width,
          height,
          menuOrder,
          isVirtual,
          isDownloadable,
          downloadLimit,
          downloadExpiry,
          upsellIds,
          crossSellIds,
          metaTitle,
          metaDesc,
          condition,
          gender,
          ageGroup,
          googleProductCategory,
          googleTitle,
          googleDescription,
          viewCount,
          metafields,
          featuredImage,
          brand:         brandConnect,
          tags:          tagsConnect,
          shippingClass: shippingClassConnect,
        };

        let productId: string;

        if (existingProduct) {
          // ── UPDATE existing product ──
          await db.product.update({
            where: { id: existingProduct.id },
            data:  {
              ...coreData,
              sku: rawSku ?? undefined,
              // Category: set করে fresh connect (পুরনো সব disconnect + নতুন connect)
              categories: categoryIds.length > 0
                ? { set: categoryIds.map((id) => ({ id })) }
                : { set: [] },
            },
          });
          productId = existingProduct.id;
          result.skipCount++; // update = skip (নতুন না)
        } else {
          // ── CREATE new product ──
          const slug = await buildProductSlug(name, wcId ?? undefined);
          const finalSku = rawSku ?? `IMP-${crypto.randomBytes(4).toString("hex")}`;

          const created = await db.product.create({
            data: {
              ...coreData,
              slug,
              sku: finalSku,
              categories: categoryIds.length > 0
                ? { connect: categoryIds.map((id) => ({ id })) }
                : undefined,
              images: {
                create: imageUrls.map((url: string, idx: number) => ({
                  url, position: idx,
                })),
              },
            },
            select: { id: true },
          });
          productId = created.id;
          result.successCount++;
        }

        // Update existing product images (update path)
        if (existingProduct) {
          await upsertProductImages(productId, imageUrls);
        }

        // ── Attributes (simple product) ──
        await upsertProductAttributes(productId, row);

        // ── Google Merchant Channel Status ──
        const glaSyncStatus = nullIfEmpty(row["Meta: _wc_gla_sync_status"]);
        if (glaSyncStatus !== null) {
          await upsertChannelStatus(
            productId, "GOOGLE", mapSyncStatus(glaSyncStatus)
          );
        }

        // ── Facebook Channel Status ──
        const fbEnabled = nullIfEmpty(row["Meta: _wc_facebook_sync_enabled"]);
        const fbVisible = nullIfEmpty(row["Meta: fb_visibility"]);
        if (fbEnabled !== null || fbVisible !== null) {
          const fbStatus =
            fbEnabled === "1" || fbVisible === "1" ? "SYNCED" :
            fbEnabled === "0" || fbVisible === "0" ? "EXCLUDED" : "PENDING";
          await upsertChannelStatus(productId, "FACEBOOK", fbStatus as ChannelSyncStatus);
        }

        // SKU map (Pass 2 এর জন্য)
        if (rawSku) skuToIdMap.set(rawSku, productId);
        // WC ID map ও রাখা (variation parent match এর জন্য)
        if (wcId) skuToIdMap.set(`wcid_${wcId}`, productId);

      } catch (err: any) {
        console.error(`Product failed (SKU: ${rawSku}, Name: ${name}):`, err?.message);
        result.errors.push(`${name} (SKU: ${rawSku ?? "none"}): ${err?.message ?? "Unknown"}`);
        result.failCount++;
      }
    }

    // ================================================================
    // PASS 2: Variations
    // ================================================================
    for (const row of rows) {
      const type = (row["Type"] ?? "").toLowerCase().trim();
      if (type !== "variation") continue;

      try {
        // WC CSV: variation এর Parent column এ parent product এর SKU থাকে
        const parentRef = nullIfEmpty(row["Parent"]);
        if (!parentRef) continue;

        // Parent খোঁজা: SKU map → WC ID map → DB query
        let parentId = skuToIdMap.get(parentRef)
          ?? skuToIdMap.get(`wcid_${parentRef}`);

        if (!parentId) {
          // DB তে slug বা WC ID দিয়ে খোঁজা
          const parent = await db.product.findFirst({
            where: {
              OR: [
                { sku:  parentRef },
                { metafields: { path: ["wcId"], equals: parentRef } },
                { slug: generateSlug(parentRef) },
              ],
            },
            select: { id: true },
          });
          if (!parent) {
            result.errors.push(`Variation skipped — parent not found: ${parentRef}`);
            continue;
          }
          parentId = parent.id;
        }

        const varSku   = nullIfEmpty(row["SKU"]);
        const varName  = nullIfEmpty(row["Name"]) ?? "Variation";
        const price    = safeFloat(row["Regular price"]) ?? 0;
        const salePrice = safeFloat(row["Sale price"]);
        const stock    = safeInt(row["Stock"]) ?? 0;
        const weight   = safeFloat(row["Weight (kg)"]);
        const length   = safeFloat(row["Length (cm)"]);
        const width    = safeFloat(row["Width (cm)"]);
        const height   = safeFloat(row["Height (cm)"]);
        const barcode  = nullIfEmpty(row["GTIN, UPC, EAN, or ISBN"]);
        const costPerItem = safeFloat(row["Cost of goods"]);
        const imageUrl = (row["Images"] ?? "").split(",")[0]?.trim() ?? null;

        // Variation attributes: "Attribute 1 name" + "Attribute 1 value(s)"
        const attributes: Record<string, string> = {};
        for (let i = 1; i <= 10; i++) {
          const attrName  = nullIfEmpty(row[`Attribute ${i} name`]);
          const attrValue = nullIfEmpty(row[`Attribute ${i} value(s)`]);
          if (attrName && attrValue) attributes[attrName] = attrValue;
        }

        const varData = {
          productId: parentId,
          name:      varName,
          price,
          salePrice,
          stock,
          weight,
          length,
          width,
          height,
          barcode,
          costPerItem,
          trackQuantity: true,
          attributes,
          image: imageUrl,
        };

        if (varSku) {
          // SKU আছে → upsert
          const existing = await db.productVariant.findFirst({
            where:  { sku: varSku },
            select: { id: true },
          });

          if (existing) {
            await db.productVariant.update({
              where: { id: existing.id },
              data:  { price, salePrice, stock, weight, length, width, height, barcode, costPerItem, attributes, image: imageUrl },
            });
          } else {
            await db.productVariant.create({
              data: { ...varData, sku: varSku },
            });
          }
        } else {
          // SKU নেই → name+parentId দিয়ে check
          const existing = await db.productVariant.findFirst({
            where:  { productId: parentId, name: varName },
            select: { id: true },
          });

          if (existing) {
            await db.productVariant.update({
              where: { id: existing.id },
              data:  { price, salePrice, stock, weight, attributes, image: imageUrl },
            });
          } else {
            await db.productVariant.create({
              data: { ...varData, sku: `VAR-${crypto.randomBytes(4).toString("hex")}` },
            });
          }
        }

      } catch (err: any) {
        console.error("Variation failed:", err?.message);
        result.errors.push(`Variation (Parent: ${row["Parent"]}): ${err?.message ?? "Unknown"}`);
        result.failCount++;
      }
    }

    revalidatePath("/admin/products");

    result.success = true;
    result.message = `✅ Created: ${result.successCount} | 🔄 Updated: ${result.skipCount} | ❌ Failed: ${result.failCount}`;
    return result;

  } catch (error: any) {
    console.error("Critical Import Error:", error);
    result.error = `Critical failure: ${error?.message ?? "Unknown"}`;
    return result;
  }
}

// ============================================================
// SECTION 8: EXPORT FUNCTION (WC-compatible + Re-import capable)
// ============================================================

export interface ExportFilters {
  status?:     string;
  categoryId?: string;
  brandId?:    string;
  query?:      string;
}

export async function exportProductsCSV(
  filters?: ExportFilters
): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    const products = await db.product.findMany({
      where: {
        deletedAt: null,
        ...(filters?.status && filters.status !== "all"
          ? { status: filters.status as ProductStatus } : {}),
        ...(filters?.categoryId
          ? { categories: { some: { id: filters.categoryId } } } : {}),
        ...(filters?.brandId   ? { brandId: filters.brandId }   : {}),
        ...(filters?.query     ? {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            { sku:  { contains: filters.query, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        categories:     { select: { name: true, parent: { select: { name: true } } } },
        brand:          { select: { name: true } },
        tags:           { select: { name: true } },
        images:         { orderBy: { position: "asc" } },
        attributes:     true,
        variants:       {
          where:   { deletedAt: null },
          include: { images: { orderBy: { position: "asc" } } },
        },
        channelStatuses: true,
      },
      orderBy: { createdAt: "desc" },
      take:    50000,
    });

    const csvRows: Record<string, any>[] = [];

    for (const p of products) {
      const meta: any = p.metafields ?? {};

      // Categories: "Parent > Child" format
      const categoriesStr = p.categories
        .map((c) => c.parent ? `${c.parent.name} > ${c.name}` : c.name)
        .join(", ");

      // Images: comma separated URLs
      const allImageUrls = [
        p.featuredImage,
        ...p.images.map((img) => img.url),
      ].filter(Boolean) as string[];
      const imagesStr = [...new Set(allImageUrls)].join(", ");

      // Attributes: max 3 attribute columns (expandable)
      const attrCols: Record<string, string> = {};
      p.attributes.forEach((attr, idx) => {
        const n = idx + 1;
        attrCols[`Attribute ${n} name`]     = attr.name;
        attrCols[`Attribute ${n} value(s)`] = attr.values.join(" | ");
        attrCols[`Attribute ${n} visible`]  = attr.visible  ? "1" : "0";
        attrCols[`Attribute ${n} global`]   = attr.variation ? "1" : "0";
      });

      // Channel statuses
      const googleStatus = p.channelStatuses.find((c) => c.channel === "GOOGLE");
      const fbStatus     = p.channelStatuses.find((c) => c.channel === "FACEBOOK");

      // ── Main product row ──
      const baseRow: Record<string, any> = {
        // Core
        "ID":                             (meta as any).wcId ?? p.productCode ?? "",
        "Type":                           p.productType.toLowerCase(),
        "SKU":                            p.sku ?? "",
        "GTIN, UPC, EAN, or ISBN":        p.barcode ?? "",
        "Name":                           p.name,
        "Published":                      p.status === "ACTIVE" ? 1 : 0,
        "Is featured?":                   p.isFeatured ? 1 : 0,
        "Visibility in catalog":          (meta as any).visibility ?? "visible",
        "Short description":              p.shortDescription ?? "",
        "Description":                    p.description ?? "",
        "Date sale price starts":         p.saleStart ? p.saleStart.toISOString().split("T")[0] : "",
        "Date sale price ends":           p.saleEnd   ? p.saleEnd.toISOString().split("T")[0]   : "",
        "Tax status":                     p.taxStatus.toLowerCase().replace("_", " "),
        "Tax class":                      "",
        "In stock?":                      p.trackQuantity ? 1 : 0,
        "Stock":                          p.stock ?? 0,
        "Low stock amount":               p.lowStockThreshold ?? 2,
        "Backorders allowed?":            p.backorderStatus === "ALLOW" ? "yes" :
                                          p.backorderStatus === "ALLOW_BUT_NOTIFY" ? "notify" : "no",
        "Sold individually?":             p.soldIndividually ? 1 : 0,
        "Weight (kg)":                    p.weight ?? "",
        "Length (cm)":                    p.length ?? "",
        "Width (cm)":                     p.width  ?? "",
        "Height (cm)":                    p.height ?? "",
        "Allow customer reviews?":        p.enableReviews ? 1 : 0,
        "Purchase note":                  p.purchaseNote ?? "",
        "Sale price":                     p.salePrice ?? "",
        "Regular price":                  p.price,
        "Categories":                     categoriesStr,
        "Tags":                           p.tags.map((t) => t.name).join(", "),
        "Shipping class":                 "",
        "Images":                         imagesStr,
        "Download limit":                 p.downloadLimit  ?? "",
        "Download expiry days":           p.downloadExpiry ?? "",
        "Parent":                         "",
        "Grouped products":               "",
        "Upsells":                        p.upsellIds.join(", "),
        "Cross-sells":                    p.crossSellIds.join(", "),
        "External URL":                   (meta as any).externalUrl ?? "",
        "Button text":                    (meta as any).buttonText  ?? "",
        "Position":                       p.menuOrder ?? 0,
        "Cost of goods":                  p.costPerItem ?? "",
        "Brands":                         p.brand?.name ?? "",
        // SEO
        "Meta: rank_math_title":          p.metaTitle ?? "",
        "Meta: rank_math_description":    p.metaDesc  ?? "",
        "Meta: rank_math_focus_keyword":  (meta as any).focusKeyword ?? "",
        // Google Merchant
        "Meta: _wc_gla_sync_status":      googleStatus?.status ?? "",
        "Meta: _wc_gla_visibility":       googleStatus ? "sync" : "",
        "Meta: _wc_gla_condition":        p.condition?.toLowerCase() ?? "new",
        "Meta: _wc_gla_brand":            p.brand?.name ?? "",
        "Meta: _wc_gla_gender":           p.gender   ?? "",
        "Meta: _wc_gla_color":            (meta as any).gla?.color    ?? "",
        "Meta: _wc_gla_material":         (meta as any).gla?.material ?? "",
        "Meta: _wc_gla_ageGroup":         p.ageGroup ?? "",
        "Meta: _wc_gla_sizeSystem":       (meta as any).gla?.sizeSystem ?? "",
        "Meta: _wc_gla_sizeType":         (meta as any).gla?.sizeType   ?? "",
        "Meta: _wc_gla_size":             (meta as any).gla?.size        ?? "",
        "Meta: _wc_gla_synced_at":        (meta as any).gla?.syncedAt   ?? "",
        // Facebook
        "Meta: _wc_facebook_sync_enabled": fbStatus?.status === "SYNCED" ? "1" : "0",
        "Meta: fb_visibility":             fbStatus?.status === "SYNCED" ? "1" : "0",
        "Meta: fb_product_description":    (meta as any).fb?.description  ?? "",
        "Meta: fb_brand":                  (meta as any).fb?.brand         ?? "",
        "Meta: fb_mpn":                    (meta as any).fb?.mpn           ?? "",
        "Meta: fb_size":                   (meta as any).fb?.size          ?? "",
        "Meta: fb_color":                  (meta as any).fb?.color         ?? "",
        "Meta: fb_material":               (meta as any).fb?.material      ?? "",
        "Meta: fb_pattern":                (meta as any).fb?.pattern       ?? "",
        "Meta: fb_age_group":              p.ageGroup ?? "",
        "Meta: fb_gender":                 p.gender   ?? "",
        "Meta: fb_product_condition":      p.condition?.toLowerCase() ?? "new",
        "Meta: _wc_facebook_product_image_source": (meta as any).fb?.imageSource ?? "",
        "Meta: fb_product_image":          (meta as any).fb?.productImage  ?? "",
        "Meta: fb_rich_text_description":  (meta as any).fb?.richText      ?? "",
        "Meta: ekit_post_views_count":     p.viewCount ?? 0,
        // Attributes
        ...attrCols,
      };

      csvRows.push(baseRow);

      // ── Variation rows (WC format: আলাদা row, Type=variation) ──
      for (const variant of p.variants) {
        const varMeta: any = variant.metafields ?? {};
        const varImageUrls = [
          variant.image,
          ...variant.images.map((img) => img.url),
        ].filter(Boolean) as string[];

        const varAttrCols: Record<string, string> = {};
        const varAttrs: Record<string, string> = variant.attributes as any ?? {};
        Object.entries(varAttrs).forEach(([key, val], idx) => {
          const n = idx + 1;
          varAttrCols[`Attribute ${n} name`]     = key;
          varAttrCols[`Attribute ${n} value(s)`] = String(val);
          varAttrCols[`Attribute ${n} visible`]  = "1";
          varAttrCols[`Attribute ${n} global`]   = "1";
        });

        csvRows.push({
          "ID":               "",
          "Type":             "variation",
          "SKU":              variant.sku ?? "",
          "GTIN, UPC, EAN, or ISBN": variant.barcode ?? "",
          "Name":             variant.name,
          "Published":        1,
          "Is featured?":     0,
          "Visibility in catalog": "visible",
          "Short description": "",
          "Description":      varMeta.description ?? "",
          "Date sale price starts": "",
          "Date sale price ends":   "",
          "Tax status":       "taxable",
          "Tax class":        "",
          "In stock?":        variant.trackQuantity ? 1 : 0,
          "Stock":            variant.stock ?? 0,
          "Low stock amount": "",
          "Backorders allowed?": "no",
          "Sold individually?":  0,
          "Weight (kg)":      variant.weight ?? "",
          "Length (cm)":      variant.length ?? "",
          "Width (cm)":       variant.width  ?? "",
          "Height (cm)":      variant.height ?? "",
          "Allow customer reviews?": 0,
          "Purchase note":    "",
          "Sale price":       variant.salePrice ?? "",
          "Regular price":    variant.price,
          "Categories":       "",
          "Tags":             "",
          "Shipping class":   "",
          "Images":           varImageUrls.join(", "),
          "Download limit":   "",
          "Download expiry days": "",
          "Parent":           p.sku ?? (meta as any).wcId ?? p.productCode ?? "",
          "Grouped products": "",
          "Upsells":          "",
          "Cross-sells":      "",
          "External URL":     "",
          "Button text":      "",
          "Position":         0,
          "Cost of goods":    variant.costPerItem ?? "",
          "Brands":           p.brand?.name ?? "",
          // SEO empty for variants
          "Meta: rank_math_title":       "",
          "Meta: rank_math_description": "",
          "Meta: rank_math_focus_keyword": "",
          // Google/FB empty for variants
          "Meta: _wc_gla_sync_status":   "",
          "Meta: _wc_gla_condition":     "",
          "Meta: _wc_gla_brand":         "",
          "Meta: _wc_gla_gender":        "",
          "Meta: _wc_gla_color":         "",
          "Meta: _wc_gla_material":      "",
          "Meta: _wc_gla_ageGroup":      "",
          "Meta: _wc_facebook_sync_enabled": "",
          "Meta: fb_product_description": "",
          "Meta: fb_brand":              "",
          "Meta: fb_color":              "",
          "Meta: fb_gender":             "",
          "Meta: fb_product_condition":  "",
          "Meta: ekit_post_views_count": "",
          ...varAttrCols,
        });
      }
    }

    const csvString = Papa.unparse(csvRows);
    return { success: true, csv: csvString };

  } catch (error: any) {
    console.error("Product Export Error:", error);
    return { success: false, error: `Export failed: ${error?.message ?? "Unknown"}` };
  }
}