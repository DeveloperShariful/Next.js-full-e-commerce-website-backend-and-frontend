// app/actions/product.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ProductType } from "@prisma/client";

export async function createProduct(formData: FormData) {
  return await saveProduct(formData, "CREATE");
}

export async function updateProduct(formData: FormData) {
  return await saveProduct(formData, "UPDATE");
}

async function saveProduct(formData: FormData, type: "CREATE" | "UPDATE") {
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    
    // Slug Generator
    const generateSlug = (str: string) => str.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    let slug = formData.get("slug") as string || generateSlug(name);

    // Unique Slug Logic
    const existingProduct = await db.product.findFirst({
        where: { slug: slug, NOT: id ? { id: id } : undefined }
    });
    if (existingProduct) slug = `${slug}-${Date.now().toString().slice(-4)}`;

    const description = formData.get("description") as string;
    const shortDescription = formData.get("shortDescription") as string || null;
    const rawType = formData.get("productType") as string;
    const productType = rawType ? rawType.toUpperCase() as ProductType : ProductType.SIMPLE;
    const status = formData.get("status") as string || "draft";
    const featuredImage = formData.get("featuredImage") as string || null;
    const galleryImagesRaw = formData.get("galleryImages") as string;
    const galleryImages = galleryImagesRaw ? JSON.parse(galleryImagesRaw) : [];
    const price = parseFloat(formData.get("price") as string) || 0;
    const salePrice = formData.get("salePrice") ? parseFloat(formData.get("salePrice") as string) : null;
    const costPerItem = formData.get("cost") ? parseFloat(formData.get("cost") as string) : null;
    const sku = formData.get("sku") as string || null;
    const barcode = formData.get("barcode") as string || null;
    const trackQuantity = formData.get("trackQuantity") === "true";
    const stockQuantity = parseInt(formData.get("stock") as string) || 0;
    const isVirtual = formData.get("isVirtual") === "true";
    const isDownloadable = formData.get("isDownloadable") === "true";
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;
    const length = formData.get("length") ? parseFloat(formData.get("length") as string) : null;
    const width = formData.get("width") ? parseFloat(formData.get("width") as string) : null;
    const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null;
    const categoryName = formData.get("category") as string;
    const tagsRaw = formData.get("tags") as string;
    const tagsList = tagsRaw ? JSON.parse(tagsRaw) : [];
    const metaTitle = formData.get("metaTitle") as string || null;
    const metaDesc = formData.get("metaDesc") as string || null;
    const purchaseNote = formData.get("purchaseNote") as string || null;
    const menuOrder = parseInt(formData.get("menuOrder") as string) || 0;

    const attributesRaw = formData.get("attributes") as string;
    const variationsRaw = formData.get("variations") as string;
    const attributesData = attributesRaw ? JSON.parse(attributesRaw) : [];
    const variationsData = variationsRaw ? JSON.parse(variationsRaw) : [];

    if (!name || price === undefined) {
      return { success: false, error: "Name and Price are required." };
    }

    // --- PRE-PROCESSING ---
    // 1. Inventory Location
    let locationId: string | null = null;
    if (trackQuantity) {
        const defaultLocation = await db.location.findFirst({ where: { isDefault: true } });
        locationId = defaultLocation ? defaultLocation.id : (await db.location.create({ data: { name: "Default Warehouse", isDefault: true } })).id;
    }

    // 2. Category Connection
    let categoryConnect = {};
    if (categoryName && categoryName.trim().length > 0) {
      const catSlug = generateSlug(categoryName);
      categoryConnect = {
        connectOrCreate: {
          where: { slug: catSlug },
          create: { name: categoryName.trim(), slug: catSlug },
        },
      };
    }

    // --- GLOBAL ATTRIBUTE SYNC LOGIC ---
    // এখানে আমরা চেক করব যে অ্যাট্রিবিউট গ্লোবালি আছে কিনা, না থাকলে বানাবো
    for (const attr of attributesData) {
        if (!attr.name) continue;
        const attrSlug = generateSlug(attr.name);
        
        // Find existing global attribute
        const existingGlobalAttr = await db.attribute.findUnique({
            where: { slug: attrSlug }
        });

        if (existingGlobalAttr) {
            // Merge new values with existing ones
            const newValues = Array.from(new Set([...existingGlobalAttr.values, ...attr.values]));
            await db.attribute.update({
                where: { id: existingGlobalAttr.id },
                data: { values: newValues }
            });
        } else {
            // Create new global attribute
            await db.attribute.create({
                data: {
                    name: attr.name,
                    slug: attrSlug,
                    values: attr.values
                }
            });
        }
    }

    // --- DB TRANSACTION ---
    await db.$transaction(async (prisma) => {
      
      const productData: any = {
        name, slug, description, shortDescription, productType, status,
        isVirtual, isDownloadable, featuredImage,
        price, salePrice, costPerItem,
        sku, barcode, trackQuantity,
        weight, length, width, height,
        tags: {
            connectOrCreate: tagsList.map((tag: string) => ({
                where: { name: tag },
                create: { name: tag }
            }))
        },
        category: categoryConnect,
        metaTitle, metaDesc, purchaseNote, menuOrder
      };

      let product;
      if (id) {
        await prisma.productImage.deleteMany({ where: { productId: id } });
        await prisma.productAttribute.deleteMany({ where: { productId: id } });
        await prisma.productVariant.deleteMany({ where: { productId: id } });
        product = await prisma.product.update({ where: { id }, data: productData });
      } else {
        product = await prisma.product.create({ data: productData });
      }

      if (galleryImages.length > 0) {
        await prisma.productImage.createMany({
          data: galleryImages.map((url: string, index: number) => ({ url, position: index, productId: product.id })),
        });
      }

      if (trackQuantity && locationId) {
          await prisma.inventoryLevel.upsert({
              where: { locationId_productId_variantId: { locationId, productId: product.id, variantId: "null_placeholder" } as any },
              update: { quantity: stockQuantity },
              create: { quantity: stockQuantity, locationId, productId: product.id }
          });
      }

      if (attributesData.length > 0) {
        await prisma.productAttribute.createMany({
            data: attributesData.map((attr: any) => ({
                name: attr.name,
                values: attr.values,
                visible: attr.visible,
                variation: attr.variation,
                productId: product.id
            }))
        });
      }

      if (productType === 'VARIABLE' && variationsData.length > 0) {
        await prisma.productVariant.createMany({
          data: variationsData.map((variant: any) => ({
            name: variant.name,
            price: parseFloat(variant.price),
            stock: parseInt(variant.stock),
            sku: variant.sku || null,
            attributes: {}, 
            productId: product.id
          }))
        });
      }
    }, { maxWait: 5000, timeout: 20000 });

    revalidatePath("/admin/products");
    return { success: true };

  } catch (error: any) {
    console.error("[PRODUCT_SAVE]", error);
    if (error.code === 'P2002') return { success: false, error: "Duplicate SKU or Slug." };
    return { success: false, error: error.message };
  }
}

export async function getProductById(id: string) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: true,
        attributes: true,
        variants: true,
        inventoryLevels: true,
        tags: true,
      },
    });
    return { success: true, product };
  } catch (error) {
    return { success: false, error: "Not found" };
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete." };
  }
}