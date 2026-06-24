// File: app/actions/backend/product/product-services.ts

import { Prisma } from "@prisma/client";
import { cleanPrice } from "@/app/actions/backend/product/product-utils";

// ============================================================
// SHARED TYPES
// ============================================================

interface ProductRef {
  id: string;
}

interface InventoryItem {
  locationId: string;
  quantity: number;
}

interface ParsedProductData {
  productType: string;
  trackQuantity: boolean;
  stock: number;
  inventoryData: InventoryItem[];
}

export interface ProductImageInput {
  url: string;
  mediaId?: string | null;
  altText?: string | null;
  id?: string;
}

export interface DigitalFileInput {
  id?: string;
  name: string;
  url: string;
  isSecure: boolean;
}

export interface AttributeInput {
  id?: string;
  name: string;
  values: string[];
  visible: boolean;
  variation: boolean;
  position?: number;
  saveGlobally?: boolean;
}

export interface VariationInput {
  id?: string;
  name: string;
  sku?: string | null;
  price: number | string;
  salePrice?: number | null;
  stock: number | string;
  attributes: Record<string, string>;
  trackQuantity?: boolean;
  barcode?: string | null;
  costPerItem?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  isPreOrder?: boolean;
  preOrderReleaseDate?: string | null;
  images?: (string | ProductImageInput)[];
  inventoryData?: InventoryItem[];
}

export interface BundleItemInput {
  childProductId: string;
  quantity: number | string;
}

// ============================================================
// HANDLE INVENTORY
// ============================================================

export async function handleInventory(
  tx: Prisma.TransactionClient,
  product: ProductRef,
  data: ParsedProductData,
  defaultLocationId: string,
  userId?: string
) {
  const trackableTypes = ["SIMPLE", "DOWNLOADABLE", "VIRTUAL", "GIFT_CARD"];

  if (trackableTypes.includes(data.productType) && data.trackQuantity) {
    const inventoryItems: InventoryItem[] =
      data.inventoryData && data.inventoryData.length > 0
        ? data.inventoryData
        : [{ locationId: defaultLocationId, quantity: data.stock }];

    const incomingLocationIds = inventoryItems.map(
      (i) => i.locationId || defaultLocationId
    );

    await tx.inventoryLevel.deleteMany({
      where: {
        productId: product.id,
        variantId: null,
        locationId: { notIn: incomingLocationIds },
      },
    });

    let totalStock = 0;

    for (const item of inventoryItems) {
      const targetQty = parseInt(String(item.quantity)) || 0;
      const locId = item.locationId || defaultLocationId;

      if (!locId) continue;

      totalStock += targetQty;

      const existingEntry = await tx.inventoryLevel.findFirst({
        where: { productId: product.id, locationId: locId, variantId: null },
      });

      const diff = targetQty - (existingEntry ? existingEntry.quantity : 0);

      if (existingEntry) {
        if (diff !== 0) {
          await tx.inventoryLevel.update({
            where: { id: existingEntry.id, version: existingEntry.version },
            data: { quantity: targetQty, version: { increment: 1 } },
          });
        }
      } else {
        await tx.inventoryLevel.create({
          data: {
            quantity: targetQty,
            locationId: locId,
            productId: product.id,
            variantId: null,
            version: 1,
          },
        });
      }

      if (diff !== 0) {
        await tx.stockHistory.create({
          data: {
            productId: product.id,
            locationId: locId,
            change: diff,
            finalStock: targetQty,
            reason: "Manual Admin Update",
            userId: userId || "SYSTEM",
          },
        });
      }
    }

    // Update product stock — version is managed by the main product upsert, not here
    await tx.product.update({
      where: { id: product.id },
      data: { stock: totalStock },
    });
  } else {
    await tx.inventoryLevel.deleteMany({
      where: { productId: product.id, variantId: null },
    });
  }
}

// ============================================================
// HANDLE IMAGES
// ============================================================

export async function handleImages(
  tx: Prisma.TransactionClient,
  productId: string,
  images: ProductImageInput[]
) {
  const existingImages = await tx.productImage.findMany({
    where: { productId, variantId: null },
  });

  const incomingIds = images
    .filter((img) => typeof img === "object" && img.id)
    .map((img) => img.id as string);

  const incomingUrls = images.map((img) =>
    typeof img === "string" ? img : img.url
  );

  const imagesToDelete = existingImages.filter((img) => {
    if (incomingIds.length > 0) {
      return !incomingIds.includes(img.id) && !incomingUrls.includes(img.url);
    }
    return !incomingUrls.includes(img.url);
  });

  if (imagesToDelete.length > 0) {
    await tx.productImage.deleteMany({
      where: { id: { in: imagesToDelete.map((i) => i.id) } },
    });
  }

  await Promise.all(
    images.map(async (img, idx) => {
      const url = typeof img === "string" ? img : img.url;
      const mediaId = typeof img === "object" ? img.mediaId ?? null : null;
      const altText = typeof img === "object" ? img.altText ?? null : null;
      const id = typeof img === "object" ? img.id ?? null : null;

      if (id) {
        await tx.productImage.update({
          where: { id },
          data: { position: idx, altText },
        });
      } else {
        const existingByUrl = existingImages.find((e) => e.url === url);
        if (existingByUrl) {
          await tx.productImage.update({
            where: { id: existingByUrl.id },
            data: { position: idx, altText, mediaId },
          });
        } else {
          await tx.productImage.create({
            data: {
              productId,
              url,
              position: idx,
              mediaId,
              altText,
              variantId: null,
            },
          });
        }
      }
    })
  );
}

// ============================================================
// HANDLE DIGITAL FILES
// ============================================================

export async function handleDigitalFiles(
  tx: Prisma.TransactionClient,
  productId: string,
  isDownloadable: boolean,
  files: DigitalFileInput[]
) {
  if (!isDownloadable) {
    await tx.digitalFile.deleteMany({ where: { productId } });
    return;
  }

  const existingFiles = await tx.digitalFile.findMany({ where: { productId } });
  const incomingFileUrls = files.map((f) => f.url);

  await tx.digitalFile.deleteMany({
    where: { productId, url: { notIn: incomingFileUrls } },
  });

  for (const file of files) {
    const exists = existingFiles.find((f) => f.url === file.url);
    if (!exists) {
      await tx.digitalFile.create({
        data: { productId, name: file.name, url: file.url, isSecure: file.isSecure },
      });
    } else {
      await tx.digitalFile.update({
        where: { id: exists.id },
        data: { name: file.name, isSecure: file.isSecure },
      });
    }
  }
}

// ============================================================
// HANDLE ATTRIBUTES
// ============================================================

export async function handleAttributes(
  tx: Prisma.TransactionClient,
  productId: string,
  attributesData: AttributeInput[]
) {
  const existingAttrs = await tx.productAttribute.findMany({
    where: { productId },
  });
  const existingAttrIds = existingAttrs.map((a) => a.id);

  const incomingAttrIds = attributesData
    .map((a) => a.id)
    .filter((id): id is string => !!id && !id.startsWith("temp_"));

  const attrsToDelete = existingAttrIds.filter(
    (id) => !incomingAttrIds.includes(id)
  );

  if (attrsToDelete.length > 0) {
    await tx.productAttribute.deleteMany({
      where: { id: { in: attrsToDelete } },
    });
  }

  await Promise.all(
    attributesData.map(async (attr, index) => {
      const attrData = {
        name: attr.name,
        values: attr.values,
        visible: attr.visible,
        variation: attr.variation,
        position: index,
      };

      if (attr.id && !attr.id.startsWith("temp_")) {
        return tx.productAttribute.update({
          where: { id: attr.id },
          data: attrData,
        });
      } else {
        return tx.productAttribute.create({
          data: { ...attrData, productId },
        });
      }
    })
  );
}

// ============================================================
// HANDLE VARIATIONS
// ============================================================

export async function handleVariations(
  tx: Prisma.TransactionClient,
  productId: string,
  variationsData: VariationInput[],
  productType: string,
  defaultLocationId: string,
  userId?: string
) {
  if (productType.toUpperCase() !== "VARIABLE") {
    const variants = await tx.productVariant.findMany({ where: { productId } });
    if (variants.length > 0) {
      const variantIds = variants.map((v) => v.id);
      await tx.inventoryLevel.deleteMany({
        where: { variantId: { in: variantIds } },
      });
      await tx.productImage.deleteMany({
        where: { variantId: { in: variantIds } },
      });
      await tx.productVariant.deleteMany({ where: { productId } });
    }
    return;
  }

  const existingVars = await tx.productVariant.findMany({ where: { productId } });
  const existingVarIds = existingVars.map((v) => v.id);
  const incomingVarIds = variationsData
    .map((v) => v.id)
    .filter((id): id is string => !!id && !id.startsWith("temp_"));

  const varsToDelete = existingVarIds.filter(
    (id) => !incomingVarIds.includes(id)
  );

  if (varsToDelete.length > 0) {
    await Promise.all(
      varsToDelete.map(async (vId) => {
        const hasOrders = await tx.orderItem.findFirst({
          where: { variantId: vId },
        });

        if (hasOrders) {
          await tx.productVariant.update({
            where: { id: vId },
            data: { deletedAt: new Date() },
          });
        } else {
          await tx.inventoryLevel.deleteMany({ where: { variantId: vId } });
          await tx.cartItem.deleteMany({ where: { variantId: vId } });
          await tx.productImage.deleteMany({ where: { variantId: vId } });
          await tx.productVariant.delete({ where: { id: vId } });
        }
      })
    );
  }

  let totalProductStock = 0;

  await Promise.all(
    variationsData.map(async (v) => {
      let variantStock = 0;
      const inventoryItems: InventoryItem[] =
        v.inventoryData && v.inventoryData.length > 0
          ? v.inventoryData
          : [{ locationId: defaultLocationId, quantity: parseInt(String(v.stock)) || 0 }];

      inventoryItems.forEach(
        (item) => (variantStock += parseInt(String(item.quantity)) || 0)
      );
      totalProductStock += variantStock;

      const price = cleanPrice(v.price);
      const salePrice =
        v.salePrice !== null &&
        v.salePrice !== undefined &&
        v.salePrice > 0 &&
        v.salePrice < price
          ? cleanPrice(v.salePrice)
          : null;

      const variantData = {
        name: v.name || "Variation",
        sku: v.sku || null,
        price,
        salePrice,
        stock: variantStock,
        attributes: v.attributes || {},
        trackQuantity: true,
        barcode: v.barcode || null,
        costPerItem: v.costPerItem ? cleanPrice(v.costPerItem) : null,
        weight: v.weight ? parseFloat(String(v.weight)) : null,
        length: v.length ? parseFloat(String(v.length)) : null,
        width: v.width ? parseFloat(String(v.width)) : null,
        height: v.height ? parseFloat(String(v.height)) : null,
        isPreOrder: v.isPreOrder || false,
        preOrderReleaseDate: v.preOrderReleaseDate
          ? new Date(v.preOrderReleaseDate)
          : null,
        deletedAt: null,
      };

      let variantId = v.id;

      if (v.id && !v.id.startsWith("temp_")) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: { ...variantData, version: { increment: 1 } },
        });
      } else {
        const newVar = await tx.productVariant.create({
          data: { ...variantData, productId },
        });
        variantId = newVar.id;
      }

      // Variant images
      const incomingImages = v.images || [];
      const incomingUrls = incomingImages.map((img) =>
        typeof img === "string" ? img : img.url
      );
      const currentVarImages = await tx.productImage.findMany({
        where: { variantId },
      });

      const varImagesToDelete = currentVarImages.filter(
        (img) => !incomingUrls.includes(img.url)
      );
      if (varImagesToDelete.length > 0) {
        await tx.productImage.deleteMany({
          where: { id: { in: varImagesToDelete.map((i) => i.id) } },
        });
      }

      if (incomingImages.length > 0) {
        await Promise.all(
          incomingImages.map(async (img, idx) => {
            const url = typeof img === "string" ? img : img.url;
            const existing = currentVarImages.find((e) => e.url === url);
            if (existing) {
              await tx.productImage.update({
                where: { id: existing.id },
                data: { position: idx },
              });
            } else {
              await tx.productImage.create({
                data: { productId, variantId, url, position: idx },
              });
            }
          })
        );
      }

      // Variant inventory
      const incomingLocationIds = inventoryItems.map(
        (i) => i.locationId || defaultLocationId
      );
      await tx.inventoryLevel.deleteMany({
        where: { variantId, locationId: { notIn: incomingLocationIds } },
      });

      for (const item of inventoryItems) {
        const targetQty = parseInt(String(item.quantity)) || 0;
        const locId = item.locationId || defaultLocationId;

        if (!locId) continue;

        const existingInv = await tx.inventoryLevel.findFirst({
          where: { locationId: locId, productId, variantId },
        });

        const diff = targetQty - (existingInv ? existingInv.quantity : 0);

        if (existingInv) {
          if (diff !== 0) {
            await tx.inventoryLevel.update({
              where: { id: existingInv.id, version: existingInv.version },
              data: { quantity: targetQty, version: { increment: 1 } },
            });
          }
        } else {
          await tx.inventoryLevel.create({
            data: {
              quantity: targetQty,
              locationId: locId,
              productId,
              variantId,
              version: 1,
            },
          });
        }

        if (diff !== 0) {
          await tx.stockHistory.create({
            data: {
              productId,
              variantId,
              locationId: locId,
              change: diff,
              finalStock: targetQty,
              reason: "Admin Variation Update",
              userId: userId || "SYSTEM",
            },
          });
        }
      }
    })
  );

  // Update aggregated product stock — version is managed by the main product upsert
  await tx.product.update({
    where: { id: productId },
    data: { stock: totalProductStock },
  });
}

// ============================================================
// HANDLE BUNDLE ITEMS
// ============================================================

export async function handleBundleItems(
  tx: Prisma.TransactionClient,
  productId: string,
  productType: string,
  bundleItems: BundleItemInput[]
) {
  if (productType.toUpperCase() !== "BUNDLE") {
    await tx.bundleItem.deleteMany({ where: { parentProductId: productId } });
    return;
  }

  await tx.bundleItem.deleteMany({ where: { parentProductId: productId } });

  if (bundleItems && bundleItems.length > 0) {
    await tx.bundleItem.createMany({
      data: bundleItems.map((item) => ({
        parentProductId: productId,
        childProductId: item.childProductId,
        quantity: parseInt(String(item.quantity)) || 1,
      })),
    });
  }
}
