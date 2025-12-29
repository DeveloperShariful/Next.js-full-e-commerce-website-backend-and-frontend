// app/actions/admin/product/create-update-product.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { generateSlug } from "@/app/actions/admin/product/product-utils";

// Import Helper Modules
import { parseProductFormData } from "./product-data-parser";
import { 
    handleInventory, 
    handleImages, 
    handleDigitalFiles, 
    handleAttributes, 
    handleVariations,
    handleBundleItems // 🔥 UPDATE: Imported
} from "./product-services"; // Note: Ensure path is correct based on your folder structure

export type ProductFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  productId?: string;
};

export async function createProduct(formData: FormData): Promise<ProductFormState> {
  return await saveProduct(formData, "CREATE");
}

export async function updateProduct(formData: FormData): Promise<ProductFormState> {
  return await saveProduct(formData, "UPDATE");
}

// --- MAIN ORCHESTRATOR ---

async function saveProduct(formData: FormData, type: "CREATE" | "UPDATE"): Promise<ProductFormState> {
  // 1. Parse Data using Helper
  const data = parseProductFormData(formData);

  if (type === "UPDATE" && !data.id) {
    return { success: false, message: "Product ID is missing for update." };
  }
  if (!data.name) return { success: false, message: "Product name is required." };

  // 2. Slug Validation
  let slug = data.slug;
  const existingSlug = await db.product.findFirst({
    where: { 
      slug: slug, 
      NOT: data.id ? { id: data.id } : undefined 
    }
  });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  try {
    // 3. Ensure Default Location (For Inventory)
    let locationId = "";
    if (data.trackQuantity) {
        const loc = await db.location.findFirst({ where: { isDefault: true }, select: { id: true } });
        if (loc) {
            locationId = loc.id;
        } else {
            const newLoc = await db.location.create({ data: { name: "Main Warehouse", isDefault: true } });
            locationId = newLoc.id;
        }
    }

    // 4. Global Attribute Sync
    await Promise.all(data.attributesData.map(async (attr) => {
        if (!attr.name) return;
        const attrSlug = generateSlug(attr.name);
        const existingGlobal = await db.attribute.findUnique({ where: { slug: attrSlug } });
        
        if (existingGlobal) {
            const mergedValues = Array.from(new Set([...existingGlobal.values, ...attr.values]));
            if (mergedValues.length !== existingGlobal.values.length) {
                await db.attribute.update({ where: { id: existingGlobal.id }, data: { values: mergedValues } });
            }
        } else {
            await db.attribute.create({ data: { name: attr.name, slug: attrSlug, values: attr.values } });
        }
    }));

    // 5. Database Transaction
    await db.$transaction(async (tx) => {
        
        // --- RELATION LOGIC ---
        const taxRateRelation = data.taxRateId ? { connect: { id: data.taxRateId } } : (type === "UPDATE" ? { disconnect: true } : undefined);
        const shippingClassRelation = data.shippingClassId ? { connect: { id: data.shippingClassId } } : (type === "UPDATE" ? { disconnect: true } : undefined);
        
        const collectionsRelation = type === "CREATE" 
            ? { connect: data.collectionIds.map(cid => ({ id: cid })) }
            : { set: data.collectionIds.map(cid => ({ id: cid })) };

        const categoryConnect = data.categoryName ? {
            connectOrCreate: {
                where: { slug: generateSlug(data.categoryName) },
                create: { name: data.categoryName, slug: generateSlug(data.categoryName) }
            }
        } : undefined;

        const brandConnect = data.vendorName ? {
            connectOrCreate: {
                where: { slug: generateSlug(data.vendorName) },
                create: { name: data.vendorName, slug: generateSlug(data.vendorName) }
            }
        } : undefined;

        // --- Prepare Main Product Data ---
        const productData: any = {
            name: data.name,
            slug: slug,
            description: data.description,
            shortDescription: data.shortDescription,
            productType: data.productType, 
            status: data.status,           
            price: data.price,
            salePrice: data.salePrice,
            costPerItem: data.costPerItem,
            sku: data.sku,
            barcode: data.barcode,
            trackQuantity: data.trackQuantity,
            weight: data.weight,
            length: data.length,
            width: data.width,
            height: data.height,
            isVirtual: data.isVirtual,
            isDownloadable: data.isDownloadable,
            featuredImage: data.featuredImage,

            // Media & SEO
            videoUrl: data.videoUrl,
            videoThumbnail: data.videoThumbnail,
            gender: data.gender,
            ageGroup: data.ageGroup,
            metafields: data.metafields || Prisma.DbNull,
            seoSchema: data.seoSchema || Prisma.DbNull,
            
            // 🔥 NEW: Featured Flag
            isFeatured: data.isFeatured || false,

            saleStart: data.saleStart ? new Date(data.saleStart) : null,
            saleEnd: data.saleEnd ? new Date(data.saleEnd) : null,
            
            downloadLimit: data.downloadLimit !== null ? data.downloadLimit : -1,
            downloadExpiry: data.downloadExpiry !== null ? data.downloadExpiry : -1,

            lowStockThreshold: data.lowStockThreshold,
            backorderStatus: data.backorderStatus,
            soldIndividually: data.soldIndividually,
            mpn: data.mpn,
            hsCode: data.hsCode,
            countryOfManufacture: data.countryOfManufacture,
            isDangerousGood: data.isDangerousGood,
            
            metaTitle: data.metaTitle,
            metaDesc: data.metaDesc,
            seoCanonicalUrl: data.seoCanonicalUrl,
            purchaseNote: data.purchaseNote,
            menuOrder: data.menuOrder,
            enableReviews: data.enableReviews,
            
            taxStatus: data.taxStatus,
            taxRate: taxRateRelation,
            shippingClass: shippingClassRelation,

            upsellIds: data.upsells,
            crossSellIds: data.crossSells,

            category: categoryConnect,
            brand: brandConnect,
            
            tags: {
                connectOrCreate: data.tagsList.map(t => ({
                    where: { slug: generateSlug(t) },
                    create: { name: t, slug: generateSlug(t) }
                }))
            },
            
            collections: collectionsRelation
        };

        let product;
        if (data.id) {
            // UPDATE
             await tx.product.update({ where: { id: data.id }, data: { tags: { set: [] } } });
             product = await tx.product.update({
                where: { id: data.id },
                data: productData
            });
        } else {
            // CREATE
            product = await tx.product.create({
                data: productData
            });
        }

        // --- SUB TASKS ---
        await Promise.all([
            handleInventory(tx, product, data, locationId),
            handleImages(tx, product.id, data.galleryImages),
            handleDigitalFiles(tx, product.id, data.isDownloadable, data.digitalFiles),
            handleAttributes(tx, product.id, data.attributesData),
            handleVariations(tx, product.id, data.variationsData, data.productType, locationId),
            handleBundleItems(tx, product.id, data.productType, data.bundleItems) // 🔥 UPDATE: Added Bundle Handler
        ]);

    }, { maxWait: 10000, timeout: 30000 });

    revalidatePath("/admin/products");
    return { success: true, productId: data.id || "new" };

  } catch (error: any) {
    console.error("[SAVE_PRODUCT_ERROR]", error);
    return { success: false, message: error.message || "Failed to save product." };
  }
}