// File: app/actions/backend/product/product-utils.ts

import { db } from "@/lib/prisma";
import { isEqual, sortBy } from "lodash";
import { Prisma } from "@prisma/client";

// ============================================================
// SERIALIZE
// ============================================================

export function serializeData<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;

  if (typeof data === "object") {
    if (data instanceof Prisma.Decimal) {
      return Number(data) as unknown as T;
    }

    if (data instanceof Date) {
      return data.toISOString() as unknown as T;
    }

    if (Array.isArray(data)) {
      return data.map((item) => serializeData(item)) as unknown as T;
    }

    const newObj: Record<string, unknown> = {};
    for (const key in data) {
      const value = (data as Record<string, unknown>)[key];
      newObj[key] = value === undefined ? null : serializeData(value);
    }
    return newObj as unknown as T;
  }

  return data;
}

// ============================================================
// SLUG HELPERS
// ============================================================

export function generateSlug(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(
  name: string,
  model: "product" | "category" | "brand" = "product",
  ignoreId?: string
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let count = 1;

  const whereClause = (s: string) =>
    ignoreId ? { slug: s, id: { not: ignoreId } } : { slug: s };

  while (true) {
    let existing: { id: string } | null = null;

    if (model === "product") {
      existing = await db.product.findFirst({
        where: whereClause(slug),
        select: { id: true },
      });
    } else if (model === "category") {
      existing = await db.category.findFirst({
        where: whereClause(slug),
        select: { id: true },
      });
    } else {
      existing = await db.brand.findFirst({
        where: whereClause(slug),
        select: { id: true },
      });
    }

    if (!existing) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
}

// ============================================================
// BUNDLE HELPERS
// ============================================================

export async function checkBundleCycle(
  parentId: string,
  childIds: string[]
): Promise<boolean> {
  if (!parentId || childIds.length === 0) return false;

  // BFS: traverse all descendants of childIds to detect multi-hop cycles
  const visited = new Set<string>();
  const queue = [...childIds];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === parentId) return true;

    const children = await db.bundleItem.findMany({
      where: { parentProductId: current },
      select: { childProductId: true },
    });

    for (const child of children) {
      if (!visited.has(child.childProductId)) {
        queue.push(child.childProductId);
      }
    }
  }

  return false;
}

export async function calculateBundleStock(
  tx: Prisma.TransactionClient,
  bundleItems: { childProductId: string; quantity: number | string }[]
): Promise<number> {
  if (!bundleItems || bundleItems.length === 0) return 0;

  let minStock = Number.MAX_SAFE_INTEGER;

  for (const item of bundleItems) {
    const product = await tx.product.findUnique({
      where: { id: item.childProductId },
      select: { stock: true },
    });

    if (!product) continue;

    const qty = parseInt(String(item.quantity)) || 1;
    const possibleSets = Math.floor(product.stock / qty);
    if (possibleSets < minStock) minStock = possibleSets;
  }

  return minStock === Number.MAX_SAFE_INTEGER ? 0 : minStock;
}

// ============================================================
// JSON / PRICE HELPERS
// ============================================================

export function parseJSON<T>(
  jsonString: string | null | undefined,
  fallback: T
): T {
  if (!jsonString) return fallback;
  if (typeof jsonString !== "string") return jsonString as unknown as T;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

export function cleanPrice(price: string | number | null | undefined): number {
  if (price === null || price === undefined || price === "") return 0;
  const p = typeof price === "string" ? parseFloat(price) : price;
  return isNaN(p) ? 0 : p;
}

// ============================================================
// DEEP EQUALITY — lodash isEqual (handles Prisma Decimals, nested objects, arrays)
// ============================================================

export const isDeepEqual = isEqual;

// ============================================================
// ARRAY HELPERS — lodash sortBy for reliable ordering
// ============================================================

export function arraysHaveSameContent<T>(
  arr1: T[],
  arr2: T[],
  keySelector?: (item: T) => string
): boolean {
  if (arr1.length !== arr2.length) return false;

  if (keySelector) {
    return isEqual(
      sortBy(arr1.map(keySelector)),
      sortBy(arr2.map(keySelector))
    );
  }

  return isEqual(sortBy(arr1 as string[]), sortBy(arr2 as string[]));
}

// ============================================================
// DIFF GENERATOR (for activity logs)
// ============================================================

export function generateDiff(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>
) {
  const diffs: Record<string, { old: unknown; new: unknown }> = {};

  const compareArrays = (label: string, oldArr: unknown[], newArr: unknown[]) => {
    const oldSorted = sortBy([...(oldArr || [])]).join(", ");
    const newSorted = sortBy([...(newArr || [])]).join(", ");
    if (oldSorted !== newSorted) {
      diffs[label] = { old: oldSorted || "Empty", new: newSorted || "Empty" };
    }
  };

  const basicFields = [
    "name", "price", "salePrice", "status", "stock", "sku",
    "isPreOrder", "isFeatured", "isVirtual", "isDownloadable",
    "description", "shortDescription", "productType",
    "trackQuantity", "backorderStatus", "lowStockThreshold",
    "soldIndividually", "hsCode", "countryOfManufacture", "isDangerousGood",
    "costPerItem", "barcode", "mpn", "menuOrder", "purchaseNote",
    "downloadLimit", "downloadExpiry", "preOrderLimit", "preOrderMessage",
    "videoUrl", "videoThumbnail",
  ];

  basicFields.forEach((key) => {
    let oldVal = oldData ? oldData[key] : null;
    let newVal = newData[key];

    const numericFields = ["price", "salePrice", "stock", "costPerItem", "lowStockThreshold", "menuOrder", "downloadLimit", "downloadExpiry", "preOrderLimit"];
    if (numericFields.includes(key)) {
      oldVal = oldVal === null || oldVal === undefined ? 0 : Number(oldVal);
      newVal = newVal === null || newVal === undefined ? 0 : Number(newVal);
    }

    const trimFields = ["name", "sku", "purchaseNote", "barcode", "mpn", "hsCode", "countryOfManufacture", "preOrderMessage", "videoUrl", "videoThumbnail"];
    if (trimFields.includes(key)) {
      oldVal = ((oldVal as string) || "").trim();
      newVal = ((newVal as string) || "").trim();
    }

    if (["description", "shortDescription"].includes(key)) {
      if (oldVal !== newVal) {
        diffs[key] = { old: "Content Changed", new: "Content Updated" };
      }
      return;
    }

    if (!isEqual(oldVal, newVal)) {
      diffs[key] = { old: oldVal, new: newVal };
    }
  });

  const dimensions = ["weight", "length", "width", "height"];
  dimensions.forEach((key) => {
    const oldVal = Number((oldData?.[key] as number) || 0);
    const newVal = Number((newData?.[key] as number) || 0);
    if (oldVal !== newVal) {
      diffs[key] = { old: oldVal, new: newVal };
    }
  });

  const oldCategories = ((oldData?.["categories"] as { id: string }[]) || []).map((c) => c.id);
  compareArrays("Categories", oldCategories, (newData["categoryIds"] as string[]) || []);

  const oldBrandId = oldData?.["brandId"] as string | null | undefined;
  const newBrandId = (newData["brandId"] as string | null | undefined) || null;
  if (oldBrandId !== newBrandId) {
    const oldBrand = oldData?.["brand"] as { name: string } | null | undefined;
    diffs["Brand"] = {
      old: oldBrand?.name || "None",
      new: (newData["vendorName"] as string) || "None",
    };
  }

  const oldTaxRateId = oldData?.["taxRateId"] as string | null | undefined;
  const newTaxRateId = (newData["taxRateId"] as string | null | undefined) || null;
  if (oldTaxRateId !== newTaxRateId) {
    diffs["Tax Rate"] = { old: oldTaxRateId || "Standard", new: newTaxRateId || "Standard" };
  }

  const oldShippingId = oldData?.["shippingClassId"] as string | null | undefined;
  const newShippingId = (newData["shippingClassId"] as string | null | undefined) || null;
  if (oldShippingId !== newShippingId) {
    diffs["Shipping Class"] = { old: oldShippingId || "None", new: newShippingId || "None" };
  }

  const oldTags = ((oldData?.["tags"] as { name: string }[]) || []).map((t) => t.name);
  compareArrays("Tags", oldTags, (newData["tagsList"] as string[]) || []);

  const oldCollections = ((oldData?.["collections"] as { id: string }[]) || []).map((c) => c.id);
  compareArrays("Collections", oldCollections, (newData["collectionIds"] as string[]) || []);

  compareArrays("Upsells", (oldData?.["upsellIds"] as string[]) || [], (newData["upsells"] as string[]) || []);
  compareArrays("Cross-sells", (oldData?.["crossSellIds"] as string[]) || [], (newData["crossSells"] as string[]) || []);

  if (oldData?.["featuredImage"] !== newData["featuredImage"]) {
    diffs["Featured Image"] = { old: "Old Image", new: "New Image" };
  }

  const oldImages = sortBy(
    ((oldData?.["images"] as { url: string }[]) || []).map((img) => img.url)
  );
  const newImages = sortBy(
    ((newData["galleryImages"] as (string | { url: string })[]) || []).map((img) =>
      typeof img === "string" ? img : img.url
    )
  );
  if (!isEqual(oldImages, newImages)) {
    diffs["Gallery Images"] = {
      old: `${oldImages.length} images`,
      new: `${newImages.length} images`,
    };
  }

  type AttrShape = { name: string; values: string[] };
  const simplifyAttrs = (attrs: AttrShape[]) =>
    sortBy(
      (attrs || []).map((a) => ({
        name: a.name,
        val: sortBy(a.values || []).join(", "),
      })),
      "name"
    );

  const oldAttrs = simplifyAttrs((oldData?.["attributes"] as AttrShape[]) || []);
  const newAttrs = simplifyAttrs((newData["attributesData"] as AttrShape[]) || []);

  if (!isEqual(oldAttrs, newAttrs)) {
    diffs["Attributes"] = {
      old: oldAttrs.map((a) => `${a.name}: [${a.val}]`).join(" | ") || "None",
      new: newAttrs.map((a) => `${a.name}: [${a.val}]`).join(" | ") || "None",
    };
  }

  // Metafields: compare only the custom (non-google_*) keys
  const filterCustomMeta = (meta: unknown) => {
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return meta;
    return Object.fromEntries(
      Object.entries(meta as Record<string, unknown>).filter(
        ([k]) => !k.startsWith("google_")
      )
    );
  };
  if (!isEqual(filterCustomMeta(oldData?.["metafields"]), filterCustomMeta(newData["metafields"]))) {
    diffs["Metafields"] = { old: "Changed", new: "Updated" };
  }

  if (!isEqual(oldData?.["seoSchema"], newData["seoSchema"])) {
    diffs["SEO Settings"] = { old: "Changed", new: "Updated" };
  }

  if (newData["productType"] === "VARIABLE") {
    type VarShape = { id?: string; name: string; price: number; stock: number; sku?: string };
    const oldVars = (oldData?.["variants"] as VarShape[]) || [];
    const newVars = (newData["variationsData"] as VarShape[]) || [];

    oldVars.forEach((ov) => {
      if (!newVars.find((nv) => nv.id === ov.id)) {
        diffs[`Variation Removed: ${ov.name}`] = { old: "Existed", new: "Removed" };
      }
    });

    newVars.forEach((nv) => {
      const ov = oldVars.find((o) => o.id === nv.id);
      if (!ov) {
        diffs[`Variation Added: ${nv.name}`] = { old: "None", new: "Added" };
      } else {
        if (Number(ov.price) !== Number(nv.price)) {
          diffs[`${nv.name} (Price)`] = { old: Number(ov.price), new: Number(nv.price) };
        }
        if (Number(ov.stock) !== Number(nv.stock)) {
          diffs[`${nv.name} (Stock)`] = { old: Number(ov.stock), new: Number(nv.stock) };
        }
        if ((ov.sku || "").trim() !== (nv.sku || "").trim()) {
          diffs[`${nv.name} (SKU)`] = {
            old: (ov.sku || "").trim() || "Empty",
            new: (nv.sku || "").trim() || "Empty",
          };
        }
      }
    });
  }

  if (newData["productType"] === "BUNDLE") {
    type BundleShape = { childProductId: string };
    const oldBundle = sortBy(
      ((oldData?.["bundleItems"] as BundleShape[]) || []).map((b) => b.childProductId)
    );
    const newBundle = sortBy(
      ((newData["bundleItems"] as BundleShape[]) || []).map((b) => b.childProductId)
    );
    if (!isEqual(oldBundle, newBundle)) {
      diffs["Bundle Items"] = { old: "Modified", new: "Updated" };
    }
  }

  return Object.keys(diffs).length > 0 ? diffs : null;
}
