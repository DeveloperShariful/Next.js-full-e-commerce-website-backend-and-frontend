"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ProductType, Prisma } from "@prisma/client";
import { generateSlug, parseJSON, cleanPrice } from "@/lib/product-utils";

// --- TYPES ---

type ProductFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  productId?: string;
};

// --- READ ACTIONS ---

export async function getProductById(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { position: 'asc' } },
        attributes: { orderBy: { position: 'asc' } },
        variants: {
          include: {
            inventoryLevels: true
          },
          orderBy: { id: 'asc' }
        },
        inventoryLevels: true,
        tags: true,
      },
    });
    
    if (!product) return { success: false, error: "Product not found" };
    return { success: true, product };
  } catch (error) {
    return { success: false, error: "Database error" };
  }
}

// --- WRITE ACTIONS ---

export async function createProduct(formData: FormData): Promise<ProductFormState> {
  return await saveProduct(formData, "CREATE");
}

export async function updateProduct(formData: FormData): Promise<ProductFormState> {
  return await saveProduct(formData, "UPDATE");
}

export async function deleteProduct(id: string) {
  try {
    await db.product.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'archived' }
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
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

  // Extraction
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
  
  const categoryName = formData.get("category") as string;
  const vendorName = formData.get("vendor") as string;
  
  const purchaseNote = formData.get("purchaseNote") as string;
  const menuOrder = parseInt(formData.get("menuOrder") as string) || 0;
  const enableReviews = formData.get("enableReviews") === "true";

  const metaTitle = formData.get("metaTitle") as string;
  const metaDesc = formData.get("metaDesc") as string;

  // JSON Data Parsing
  const tagsList = parseJSON<string[]>(formData.get("tags") as string, []);
  const galleryImages = parseJSON<string[]>(formData.get("galleryImages") as string, []);
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

    // 2. Prepare Relations
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
        
        // --- A. Main Product Data ---
        const productData: Prisma.ProductCreateInput | Prisma.ProductUpdateInput = {
            name, slug, description, shortDescription, 
            productType, status,
            price, salePrice, costPerItem,
            sku, barcode, trackQuantity,
            weight, length, width, height,
            isVirtual, isDownloadable,
            featuredImage,
            metaTitle, metaDesc, purchaseNote, menuOrder, enableReviews,
            category: categoryConnect,
            brand: brandConnect,
            tags: {
                connectOrCreate: tagsList.map(t => ({
                    where: { slug: generateSlug(t) },
                    create: { name: t, slug: generateSlug(t) }
                }))
            }
        };

        let product;
        if (id) {
            // Update
            // Remove tags relation first to reset (optional strategy)
             await tx.product.update({
                where: { id },
                data: { tags: { set: [] } } 
            });

            product = await tx.product.update({
                where: { id },
                data: productData
            });
        } else {
            // Create
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
                        variantId: "" // Prisma trick: we need to handle nullable in unique constraint, but schema says unique([loc, prod, var]). 
                        // Note: Prisma treats nulls in unique constraints differently based on DB. 
                        // In Schema, variantId is String?. For Simple product, it is null.
                        // We will use findFirst for safety.
                    } as any 
                },
                update: { quantity: stock },
                create: { quantity: stock, locationId, productId: product.id }
            });
            
            // Direct stock field update for simple query access
            await tx.product.update({
                where: { id: product.id },
                data: { stock }
            });
        }

        // --- C. Images ---
        // Strategy: Delete all and recreate is safest for ordering, 
        // unless we track image IDs from frontend. Assuming URL list from frontend.
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

        // --- D. Product Attributes (Smart Sync) ---
        // Fetch existing
        const existingAttrs = await tx.productAttribute.findMany({ where: { productId: product.id } });
        const existingAttrIds = existingAttrs.map(a => a.id);
        const incomingAttrIds = attributesData.map(a => a.id).filter(id => id && !id.startsWith("temp_"));

        // Delete removed
        const attrsToDelete = existingAttrIds.filter(id => !incomingAttrIds.includes(id));
        if (attrsToDelete.length > 0) {
            await tx.productAttribute.deleteMany({ where: { id: { in: attrsToDelete } } });
        }

        // Upsert
        for (const attr of attributesData) {
            const attrData = {
                name: attr.name,
                values: attr.values,
                visible: attr.visible,
                variation: attr.variation,
                position: 0 // Can add position logic later
            };

            if (attr.id && !attr.id.toString().startsWith("temp_")) {
                // Update
                await tx.productAttribute.update({
                    where: { id: attr.id },
                    data: attrData
                });
            } else {
                // Create
                await tx.productAttribute.create({
                    data: { ...attrData, productId: product.id }
                });
            }
        }

        // --- E. Variations (Smart Sync) ---
        if (productType === 'VARIABLE') {
            const existingVars = await tx.productVariant.findMany({ where: { productId: product.id } });
            const existingVarIds = existingVars.map(v => v.id);
            const incomingVarIds = variationsData.map(v => v.id).filter(id => id && !id.startsWith("temp_"));

            // Delete removed variants
            const varsToDelete = existingVarIds.filter(id => !incomingVarIds.includes(id));
            if (varsToDelete.length > 0) {
                await tx.productVariant.deleteMany({ where: { id: { in: varsToDelete } } });
            }

            // Upsert Variants
            let totalStock = 0;

            for (const v of variationsData) {
                const variantStock = parseInt(v.stock) || 0;
                const variantPrice = cleanPrice(v.price);
                
                const variantData = {
                    name: v.name || "Variation",
                    sku: v.sku || null,
                    price: variantPrice,
                    stock: variantStock,
                    attributes: v.attributes || {}, // { "Color": "Red", "Size": "XL" }
                    trackQuantity: true
                };

                let variantId = v.id;

                if (v.id && !v.id.toString().startsWith("temp_")) {
                    // Update
                    await tx.productVariant.update({
                        where: { id: v.id },
                        data: variantData
                    });
                } else {
                    // Create
                    const newVar = await tx.productVariant.create({
                        data: { ...variantData, productId: product.id }
                    });
                    variantId = newVar.id;
                }

                // Sync Variant Inventory
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

            // Update Parent Product Total Stock
            await tx.product.update({
                where: { id: product.id },
                data: { stock: totalStock }
            });
        }

    }, { maxWait: 10000, timeout: 30000 });

    revalidatePath("/admin/products");
    return { success: true, productId: id };

  } catch (error: any) {
    console.error("[SAVE_PRODUCT_ERROR]", error);
    return { success: false, message: error.message || "Failed to save product." };
  }
}
// BULK ACTIONS
export async function bulkProductAction(formData: FormData) {
  const ids = JSON.parse(formData.get("ids") as string);
  const action = formData.get("action") as string;

  if (!ids.length) return { success: false, message: "No items selected" };

  try {
    switch (action) {
      case "trash":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "archived" }
        });
        break;
      
      case "delete":
        // Hard delete from DB
        await db.product.deleteMany({
          where: { id: { in: ids } }
        });
        break;

      case "restore":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "draft" } // Restore as draft for safety
        });
        break;

      case "publish":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "active" }
        });
        break;

      case "unpublish":
        await db.product.updateMany({
          where: { id: { in: ids } },
          data: { status: "draft" }
        });
        break;
    }
    
    revalidatePath("/admin/products");
    return { success: true, message: "Bulk action applied" };
  } catch (error) {
    return { success: false, message: "Action failed" };
  }
}

// SINGLE TRASH ACTION
export async function moveToTrash(id: string) {
    try {
        await db.product.update({
            where: { id },
            data: { status: 'archived' }
        });
        revalidatePath("/admin/products");
    } catch (error) {
        console.error(error);
    }
}
// ... আগের সব কোড ঠিক থাকবে

// DUPLICATE PRODUCT ACTION
export async function duplicateProduct(id: string) {
  try {
    // ১. অরিজিনাল প্রোডাক্ট খুঁজে বের করা
    const original = await db.product.findUnique({
      where: { id },
      include: {
        tags: true,
        category: true,
        brand: true,
        images: true,
        attributes: true,
        variants: true,
        inventoryLevels: true,
      }
    });

    if (!original) return { success: false, message: "Product not found" };

    // ২. নতুন ইউনিক স্লাগ এবং SKU তৈরি
    const timestamp = Date.now();
    const newSlug = `${original.slug}-copy-${timestamp}`;
    const newSku = original.sku ? `${original.sku}-COPY-${timestamp}` : null;
    const newName = `${original.name} (Copy)`;

    // ৩. নতুন প্রোডাক্ট তৈরি (Prisma দিয়ে রিলেশন সহ)
    await db.product.create({
      data: {
        name: newName,
        slug: newSlug,
        sku: newSku,
        description: original.description,
        shortDescription: original.shortDescription,
        productType: original.productType,
        status: 'draft', // কপি করা প্রোডাক্ট ড্রাফট হিসেবে থাকবে
        price: original.price,
        salePrice: original.salePrice,
        costPerItem: original.costPerItem,
        trackQuantity: original.trackQuantity,
        stock: original.stock,
        weight: original.weight,
        length: original.length,
        width: original.width,
        height: original.height,
        isVirtual: original.isVirtual,
        isDownloadable: original.isDownloadable,
        featuredImage: original.featuredImage,
        
        // রিলেশন কানেক্ট বা ক্রিয়েট করা
        category: original.categoryId ? { connect: { id: original.categoryId } } : undefined,
        brand: original.brandId ? { connect: { id: original.brandId } } : undefined,
        
        // ট্যাগ কানেক্ট করা
        tags: {
          connect: original.tags.map(t => ({ id: t.id }))
        },

        // গ্যালারি ইমেজ কপি করা
        images: {
          create: original.images.map(img => ({
            url: img.url,
            position: img.position
          }))
        },

        // অ্যাট্রিবিউট কপি করা
        attributes: {
          create: original.attributes.map(attr => ({
            name: attr.name,
            values: attr.values,
            visible: attr.visible,
            variation: attr.variation
          }))
        },

        // ভেরিয়েন্ট কপি করা (যদি থাকে)
        variants: {
          create: original.variants.map(v => ({
            name: v.name,
            sku: v.sku ? `${v.sku}-COPY-${Math.floor(Math.random() * 1000)}` : null,
            price: v.price,
            stock: v.stock,
            attributes: v.attributes as any,
            trackQuantity: v.trackQuantity
          }))
        }
      }
    });

    revalidatePath("/admin/products");
    return { success: true, message: "Product duplicated successfully" };
  } catch (error) {
    console.error("Duplicate Error:", error);
    return { success: false, message: "Failed to duplicate product" };
  }
}

//brand
export async function getBrands() {
  try {
    const brands = await db.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    });
    return { success: true, data: brands };
  } catch (error) {
    return { success: false, data: [] };
  }
}