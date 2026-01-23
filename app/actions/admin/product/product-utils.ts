// File: app/actions/admin/product/product-utils.ts

import { db } from "@/lib/prisma";
import _ from "lodash";

export function generateSlug(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, ''); 
}

export async function generateUniqueSlug(name: string, model: "product" | "category" | "brand" = "product", ignoreId?: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const delegate = 
    model === "product" ? db.product : 
    model === "category" ? db.category : 
    db.brand;

  const collisions = await (delegate as any).findMany({
    where: {
      slug: { startsWith: baseSlug },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
    },
    select: { slug: true },
  });

  if (collisions.length === 0) return baseSlug;

  const suffixes = collisions.map((c: any) => {
    const parts = c.slug.split(`${baseSlug}-`);
    if (parts.length === 1 && c.slug === baseSlug) return 0;
    return parseInt(parts[1]) || 0;
  });

  const maxSuffix = Math.max(...suffixes);
  
  if (suffixes.includes(0)) {
    return `${baseSlug}-${maxSuffix + 1}`;
  } else if (collisions.some((c:any) => c.slug === baseSlug)) {
     return `${baseSlug}-${maxSuffix + 1}`;
  }

  return baseSlug;
}

export function parseJSON<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  if (typeof jsonString !== 'string') return jsonString as unknown as T;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
}

export function cleanPrice(price: string | number | null | undefined): number {
  if (price === null || price === undefined || price === "") return 0;
  const p = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(p) ? 0 : p;
}

export function isDeepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) return false;
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!isDeepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}

export function arraysHaveSameContent(arr1: any[], arr2: any[], keySelector?: (item: any) => string): boolean {
    if (arr1.length !== arr2.length) return false;
    if (!keySelector) {
        const sorted1 = [...arr1].sort();
        const sorted2 = [...arr2].sort();
        return JSON.stringify(sorted1) === JSON.stringify(sorted2);
    }
    const keys1 = arr1.map(keySelector).sort();
    const keys2 = arr2.map(keySelector).sort();
    return JSON.stringify(keys1) === JSON.stringify(keys2);
}

// 🔥 ULTRA PRO DIFF GENERATOR (Updated for ALL Fields)
export function generateDiff(oldData: any, newData: any) {
  const diffs: Record<string, { old: any; new: any }> = {};
  
  // 1. Basic Fields
  const basicFields = [
    "name", "price", "salePrice", "status", "stock", "sku", 
    "isPreOrder", "isFeatured", "isVirtual", "isDownloadable",
    "description", "shortDescription", "productType", 
    "trackQuantity", "backorderStatus", "lowStockThreshold",
    "soldIndividually", "hsCode", "countryOfManufacture", "isDangerousGood",
    "costPerItem", "barcode", "mpn", "menuOrder", "purchaseNote",
    "downloadLimit", "downloadExpiry", "preOrderLimit", "preOrderMessage", "videoUrl", "videoThumbnail"
  ];

  basicFields.forEach((key) => {
    let oldVal = oldData ? oldData[key] : null;
    let newVal = newData[key];

    // Normalize Numbers
    if (["price", "salePrice", "stock", "costPerItem", "lowStockThreshold", "menuOrder", "downloadLimit", "downloadExpiry", "preOrderLimit"].includes(key)) {
        oldVal = oldVal === null || oldVal === undefined ? 0 : Number(oldVal);
        newVal = newVal === null || newVal === undefined ? 0 : Number(newVal);
    }

    // Normalize Strings
    if (["name", "sku", "description", "shortDescription", "purchaseNote", "barcode", "mpn", "hsCode", "countryOfManufacture", "preOrderMessage", "videoUrl", "videoThumbnail"].includes(key)) {
        oldVal = (oldVal || "").trim();
        newVal = (newVal || "").trim();
    }

    if (key === "preOrderReleaseDate") {
        if (oldVal instanceof Date) oldVal = oldVal.toISOString().split("T")[0];
        if (newVal instanceof Date) newVal = newVal.toISOString().split("T")[0];
        if (typeof newVal === "string" && newVal.includes("T")) newVal = newVal.split("T")[0];
    }

    if (oldVal !== newVal) {
      diffs[key] = { old: oldVal, new: newVal };
    }
  });

  // 2. Dimensions
  const dimensions = ["weight", "length", "width", "height"];
  dimensions.forEach(key => {
      const oldVal = Number(oldData?.[key] || 0);
      const newVal = Number(newData?.[key] || 0);
      if (oldVal !== newVal) {
          diffs[key] = { old: oldVal, new: newVal };
      }
  });

  // 3. Relations
  if (oldData?.categoryId !== (newData.categoryId || null)) {
      diffs["Category"] = { old: oldData?.category?.name || "None", new: newData.categoryName || "None" };
  }
  
  if (oldData?.brandId !== (newData.brandId || null)) {
      diffs["Brand"] = { old: oldData?.brand?.name || "None", new: newData.vendorName || "None" };
  }

  if (oldData?.taxRateId !== (newData.taxRateId || null)) {
      diffs["Tax Rate"] = { old: oldData?.taxRateId || "Standard", new: newData.taxRateId || "Standard" };
  }

  if (oldData?.shippingClassId !== (newData.shippingClassId || null)) {
      diffs["Shipping Class"] = { old: oldData?.shippingClassId || "None", new: newData.shippingClassId || "None" };
  }

  // 4. Arrays
  const compareArrays = (label: string, oldArr: any[], newArr: any[]) => {
      const oldSorted = [...(oldArr || [])].sort().join(", ");
      const newSorted = [...(newArr || [])].sort().join(", ");
      
      if (oldSorted !== newSorted) {
          diffs[label] = { old: oldSorted || "Empty", new: newSorted || "Empty" };
      }
  };

  const oldTags = oldData?.tags?.map((t: any) => t.name) || [];
  compareArrays("Tags", oldTags, newData.tagsList);

  const oldCollections = oldData?.collections?.map((c: any) => c.id) || [];
  compareArrays("Collections", oldCollections, newData.collectionIds);

  compareArrays("Upsells", oldData?.upsellIds, newData.upsells);
  compareArrays("Cross-sells", oldData?.crossSellIds, newData.crossSells);

  // 5. Featured Image
  if (oldData?.featuredImage !== newData.featuredImage) {
      diffs["Featured Image"] = { old: "Old Image", new: "New Image" };
  }

  // 6. Gallery Images
  const oldImages = oldData?.images?.map((img: any) => img.url).sort() || [];
  const newImages = newData?.galleryImages?.map((img: any) => typeof img === 'string' ? img : img.url).sort() || [];

  if (!isDeepEqual(oldImages, newImages)) {
      diffs["Gallery Images"] = { old: `${oldImages.length} images`, new: `${newImages.length} images` };
  }

  // 7. Attributes
  const simplifyAttrs = (attrs: any[]) => {
      if(!attrs) return [];
      return attrs.map((a: any) => ({
          name: a.name,
          val: [...(a.values || [])].sort().join(", ")
      })).sort((a, b) => a.name.localeCompare(b.name));
  };

  const oldAttrs = simplifyAttrs(oldData?.attributes);
  const newAttrs = simplifyAttrs(newData?.attributesData);

  if (!isDeepEqual(oldAttrs, newAttrs)) {
      const oldStr = oldAttrs.map(a => `${a.name}: [${a.val}]`).join(" | ");
      const newStr = newAttrs.map(a => `${a.name}: [${a.val}]`).join(" | ");
      diffs["Attributes"] = { old: oldStr || "None", new: newStr || "None" };
  }

  // 8. Variations (🔥 UPDATED FOR DETAILED LOGGING)
  if (newData.productType === 'VARIABLE') {
      const oldVars = oldData?.variants || [];
      const newVars = newData?.variationsData || [];

      // Check for removed variants
      oldVars.forEach((ov: any) => {
          if (!newVars.find((nv: any) => nv.id === ov.id)) {
              diffs[`Variation Removed: ${ov.name}`] = { old: "Existed", new: "Removed" };
          }
      });

      // Check for added or updated variants
      newVars.forEach((nv: any) => {
          const ov = oldVars.find((o: any) => o.id === nv.id);

          if (!ov) {
              diffs[`Variation Added: ${nv.name}`] = { old: "None", new: "Added" };
          } else {
              // Compare specific fields
              const oldPrice = Number(ov.price);
              const newPrice = Number(nv.price);
              if (oldPrice !== newPrice) {
                  diffs[`${nv.name} (Price)`] = { old: oldPrice, new: newPrice };
              }

              const oldStock = Number(ov.stock);
              const newStock = Number(nv.stock);
              if (oldStock !== newStock) {
                  diffs[`${nv.name} (Stock)`] = { old: oldStock, new: newStock };
              }

              const oldSku = (ov.sku || "").trim();
              const newSku = (nv.sku || "").trim();
              if (oldSku !== newSku) {
                  diffs[`${nv.name} (SKU)`] = { old: oldSku || "Empty", new: newSku || "Empty" };
              }
          }
      });
  }

  // 9. Bundle Items
  if (newData.productType === 'BUNDLE') {
      const oldBundle = oldData?.bundleItems?.map((b: any) => b.childProductId).sort() || [];
      const newBundle = newData?.bundleItems?.map((b: any) => b.childProductId).sort() || [];
      if (!isDeepEqual(oldBundle, newBundle)) {
          diffs["Bundle Items"] = { old: "Modified", new: "Updated" };
      }
  }

  return Object.keys(diffs).length > 0 ? diffs : null;
}