// app/actions/admin/product/create-update-product.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ProductType, Prisma, TaxStatus } from "@prisma/client";
import { generateSlug, parseJSON, cleanPrice } from "@/lib/product-utils";

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

// --- CORE LOGIC ---

async function saveProduct(formData: FormData, type: "CREATE" | "UPDATE"): Promise<ProductFormState> {
  const id = formData.get("id") as string;
  
  if (type === "UPDATE" && !id) {
    return { success: false, message: "Product ID is missing for update." };
  }

  const name = formData.get("name") as string;
  const rawSlug = formData.get("slug") as string;
  
  // Validation
  if (!name) return { success: false, message: "Product name is required." };

  // Slug Logic
  let slug = rawSlug && rawSlug.trim() !== "" ? rawSlug : generateSlug(name);
  const existingSlug = await db.product.findFirst({
    where: { 
      slug: slug, 
      NOT: id ? { id } : undefined 
    }
  });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  // Basic Extraction
  const description = formData.get("description") as string;
  const shortDescription = formData.get("shortDescription") as string;
  const productType = (formData.get("productType") as string || "SIMPLE").toUpperCase() as ProductType;
  const status = formData.get("status") as string || "draft";
  
  const price = cleanPrice(formData.get("price") as string);
  const salePrice = formData.get("salePrice") ? cleanPrice(formData.get("salePrice") as string) : null;
  const costPerItem = formData.get("cost") ? cleanPrice(formData.get("cost") as string) : null;
  
  const sku = formData.get("sku") as string || null;
  const barcode = formData.get("barcode") as string || null;
  const trackQuantity = formData.get("trackQuantity") === "true";
  const stock = parseInt(formData.get("stock") as string) || 0;
  
  const isVirtual = formData.get("isVirtual") === "true";
  const isDownloadable = formData.get("isDownloadable") === "true";
  
  const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
  const length = formData.get("length") ? parseFloat(formData.get("length") as string) : null;
  const width = formData.get("width") ? parseFloat(formData.get("width") as string) : null;
  const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null;
  
  // Relations Data (Text)
  const categoryName = formData.get("category") as string;
  const vendorName = formData.get("vendor") as string;
  
  // Settings
  const purchaseNote = formData.get("purchaseNote") as string;
  const menuOrder = parseInt(formData.get("menuOrder") as string) || 0;
  const enableReviews = formData.get("enableReviews") === "true";

  // SEO
  const metaTitle = formData.get("metaTitle") as string;
  const metaDesc = formData.get("metaDesc") as string;
  const seoCanonicalUrl = formData.get("seoCanonicalUrl") as string; // NEW

  // Advanced IDs (Tax, Shipping)
  const taxStatus = (formData.get("taxStatus") as string || "TAXABLE") as TaxStatus;
  const taxRateId = formData.get("taxRateId") as string || null;
  const shippingClassId = formData.get("shippingClassId") as string || null;

  // JSON Data Parsing
  const tagsList = parseJSON<string[]>(formData.get("tags") as string, []);
  const collectionIds = parseJSON<string[]>(formData.get("collectionIds") as string, []); // NEW
  const upsells = parseJSON<string[]>(formData.get("upsells") as string, []);
  const crossSells = parseJSON<string[]>(formData.get("crossSells") as string, []);
  
  const galleryImages = parseJSON<string[]>(formData.get("galleryImages") as string, []);
  const digitalFiles = parseJSON<any[]>(formData.get("digitalFiles") as string, []); // NEW
  
  const attributesData = parseJSON<any[]>(formData.get("attributes") as string, []);
  const variationsData = parseJSON<any[]>(formData.get("variations") as string, []);
  const featuredImage = formData.get("featuredImage") as string || null;

  try {
    // 1. Ensure Default Location Exists
    let locationId = "";
    if (trackQuantity) {
        const loc = await db.location.findFirst({ where: { isDefault: true } });
        if (loc) {
            locationId = loc.id;
        } else {
            const newLoc = await db.location.create({ data: { name: "Main Warehouse", isDefault: true } });
            locationId = newLoc.id;
        }
    }

    // 2. Prepare Relations (ConnectOrCreate)
    let categoryConnect = {};
    if (categoryName) {
        const cSlug = generateSlug(categoryName);
        categoryConnect = {
            connectOrCreate: {
                where: { slug: cSlug },
                create: { name: categoryName, slug: cSlug }
            }
        };
    }

    let brandConnect = {};
    if (vendorName) {
        const bSlug = generateSlug(vendorName);
        brandConnect = {
            connectOrCreate: {
                where: { slug: bSlug },
                create: { name: vendorName, slug: bSlug }
            }
        };
    }

    // 3. Global Attribute Sync
    for (const attr of attributesData) {
        if (!attr.name) continue;
        const attrSlug = generateSlug(attr.name);
        const existingGlobal = await db.attribute.findUnique({ where: { slug: attrSlug } });
        
        if (existingGlobal) {
            const mergedValues = Array.from(new Set([...existingGlobal.values, ...attr.values]));
            await db.attribute.update({
                where: { id: existingGlobal.id },
                data: { values: mergedValues }
            });
        } else {
            await db.attribute.create({
                data: { name: attr.name, slug: attrSlug, values: attr.values }
            });
        }
    }

    // 4. Database Transaction
    await db.$transaction(async (tx) => {
        
        // --- A. Prepare Main Product Data ---
        const productData: Prisma.ProductCreateInput | Prisma.ProductUpdateInput = {
            name, slug, description, shortDescription, 
            productType, status,
            price, salePrice, costPerItem,
            sku, barcode, trackQuantity,
            weight, length, width, height,
            isVirtual, isDownloadable,
            featuredImage,
            
            // SEO & Settings
            metaTitle, metaDesc, seoCanonicalUrl,
            purchaseNote, menuOrder, enableReviews,
            
            // Tax & Shipping
            taxStatus,
            taxRate: taxRateId ? { connect: { id: taxRateId } } : { disconnect: true },
            shippingClass: shippingClassId ? { connect: { id: shippingClassId } } : { disconnect: true },

            // Arrays
            upsellIds: upsells,
            crossSellIds: crossSells,

            // Relations
            category: categoryConnect,
            brand: brandConnect,
            
            tags: {
                connectOrCreate: tagsList.map(t => ({
                    where: { slug: generateSlug(t) },
                    create: { name: t, slug: generateSlug(t) }
                }))
            },
            
            // Collections (Many-to-Many)
            collections: {
                set: collectionIds.map(cid => ({ id: cid })) // Replaces existing connections with new list
            }
        };

        let product;
        if (id) {
            // UPDATE
             await tx.product.update({
                where: { id },
                data: { tags: { set: [] } } // Reset tags to handle removals
            });

            product = await tx.product.update({
                where: { id },
                data: productData
            });
        } else {
            // CREATE
            product = await tx.product.create({
                data: productData as Prisma.ProductCreateInput
            });
        }

        // --- B. Inventory (Simple Product) ---
        if (productType === 'SIMPLE' && trackQuantity && locationId) {
            await tx.inventoryLevel.upsert({
                where: {
                    locationId_productId_variantId: {
                        locationId,
                        productId: product.id,
                        variantId: "" 
                    } as any 
                },
                update: { quantity: stock },
                create: { quantity: stock, locationId, productId: product.id }
            });
            await tx.product.update({ where: { id: product.id }, data: { stock } });
        }

        // --- C. Images ---
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        if (galleryImages.length > 0) {
            await tx.productImage.createMany({
                data: galleryImages.map((url, idx) => ({
                    productId: product.id,
                    url,
                    position: idx
                }))
            });
        }

        // --- D. Digital Files (For Downloadable Products) ---
        // Delete old files and recreate to sync state
        await tx.digitalFile.deleteMany({ where: { productId: product.id } });
        if (isDownloadable && digitalFiles.length > 0) {
            await tx.digitalFile.createMany({
                data: digitalFiles.map(file => ({
                    productId: product.id,
                    name: file.name,
                    url: file.url
                }))
            });
        }

        // --- E. Product Attributes (Smart Sync) ---
        const existingAttrs = await tx.productAttribute.findMany({ where: { productId: product.id } });
        const existingAttrIds = existingAttrs.map(a => a.id);
        const incomingAttrIds = attributesData.map(a => a.id).filter(id => id && !id.startsWith("temp_"));

        const attrsToDelete = existingAttrIds.filter(id => !incomingAttrIds.includes(id));
        if (attrsToDelete.length > 0) {
            await tx.productAttribute.deleteMany({ where: { id: { in: attrsToDelete } } });
        }

        for (const attr of attributesData) {
            const attrData = {
                name: attr.name,
                values: attr.values,
                visible: attr.visible,
                variation: attr.variation,
                position: 0 
            };

            if (attr.id && !attr.id.toString().startsWith("temp_")) {
                await tx.productAttribute.update({ where: { id: attr.id }, data: attrData });
            } else {
                await tx.productAttribute.create({ data: { ...attrData, productId: product.id } });
            }
        }

        // --- F. Variations (Smart Sync) ---
        if (productType === 'VARIABLE') {
            const existingVars = await tx.productVariant.findMany({ where: { productId: product.id } });
            const existingVarIds = existingVars.map(v => v.id);
            const incomingVarIds = variationsData.map(v => v.id).filter(id => id && !id.startsWith("temp_"));

            const varsToDelete = existingVarIds.filter(id => !incomingVarIds.includes(id));
            if (varsToDelete.length > 0) {
                await tx.productVariant.deleteMany({ where: { id: { in: varsToDelete } } });
            }

            let totalStock = 0;

            for (const v of variationsData) {
                const variantStock = parseInt(v.stock) || 0;
                const variantPrice = cleanPrice(v.price);
                
                const variantData = {
                    name: v.name || "Variation",
                    sku: v.sku || null,
                    price: variantPrice,
                    stock: variantStock,
                    attributes: v.attributes || {}, 
                    trackQuantity: true
                };

                let variantId = v.id;

                if (v.id && !v.id.toString().startsWith("temp_")) {
                    await tx.productVariant.update({ where: { id: v.id }, data: variantData });
                } else {
                    const newVar = await tx.productVariant.create({ data: { ...variantData, productId: product.id } });
                    variantId = newVar.id;
                }

                if (locationId) {
                    await tx.inventoryLevel.upsert({
                        where: {
                            locationId_productId_variantId: {
                                locationId,
                                productId: product.id,
                                variantId: variantId
                            }
                        },
                        update: { quantity: variantStock },
                        create: { quantity: variantStock, locationId, productId: product.id, variantId }
                    });
                }
                
                totalStock += variantStock;
            }

            await tx.product.update({ where: { id: product.id }, data: { stock: totalStock } });
        }

    }, { maxWait: 10000, timeout: 30000 });

    revalidatePath("/admin/products");
    return { success: true, productId: id };

  } catch (error: any) {
    console.error("[SAVE_PRODUCT_ERROR]", error);
    return { success: false, message: error.message || "Failed to save product." };
  }
}