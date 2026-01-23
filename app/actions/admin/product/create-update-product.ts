// File: app/actions/admin/product/create-update-product.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { generateUniqueSlug, generateDiff, isDeepEqual, arraysHaveSameContent, serializeData } from "@/app/actions/admin/product/product-utils"; 
import { currentUser } from "@clerk/nextjs/server"; 

import { parseProductFormData } from "./product-data-parser";
import { 
    handleInventory, 
    handleImages, 
    handleDigitalFiles, 
    handleAttributes, 
    handleVariations,
    handleBundleItems 
} from "./product-services"; 

export type ProductFormState = {
    success: boolean;
    message?: string;
    errors?: Record<string, string[]>;
    productId?: string;
};

async function syncSystemAttribute(tx: any, name: string, value: string | null) {
    if (!value) return;
    const slug = name.toLowerCase().replace(/\s+/g, '-'); 
    
    const existing = await tx.attribute.findUnique({ where: { slug } });

    if (existing) {
        if (!existing.values.includes(value)) {
            await tx.attribute.update({
                where: { id: existing.id },
                data: { values: { push: value } }
            });
        }
    } else {
        await tx.attribute.create({
            data: {
                name,
                slug,
                type: "TEXT",
                values: [value]
            }
        });
    }
}

export async function createProduct(formData: FormData): Promise<ProductFormState> {
    return await saveProduct(formData, "CREATE");
}

export async function updateProduct(formData: FormData): Promise<ProductFormState> {
    return await saveProduct(formData, "UPDATE");
}

async function saveProduct(formData: FormData, type: "CREATE" | "UPDATE"): Promise<ProductFormState> {
    const user = await currentUser();
    if (!user) return { success: false, message: "Unauthorized access" };

    let dbUser = await db.user.findUnique({ where: { clerkId: user.id } });

    if (!dbUser) {
        const email = user.emailAddresses[0]?.emailAddress;
        if (!email) return { success: false, message: "User email not found" };

        try {
            dbUser = await db.user.create({
                data: {
                    clerkId: user.id,
                    email: email,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Admin User",
                    role: "ADMIN",
                    image: user.imageUrl
                }
            });
        } catch (error) {
            console.error("USER_SYNC_ERROR", error);
            return { success: false, message: "Failed to sync user profile" };
        }
    }

    const data = parseProductFormData(formData);

    if (type === "UPDATE" && !data.id) {
        return { success: false, message: "Product ID is missing for update." };
    }
    if (!data.name) return { success: false, message: "Product name is required." };

    if (type === "CREATE") {
        const existingName = await db.product.findFirst({
            where: { name: { equals: data.name, mode: "insensitive" } },
            select: { id: true }
        });
        if (existingName) {
            return { success: false, message: `Product name "${data.name}" already exists.` };
        }
    } 

    const finalSlug = await generateUniqueSlug(data.slug, "product", data.id);

    try {
        let locationId = "";
        
        if (data.trackQuantity || data.productType === 'VARIABLE') {
            const loc = await db.location.findFirst({ where: { isDefault: true }, select: { id: true } });
            if (loc) {
                locationId = loc.id;
            } else {
                const newLoc = await db.location.create({ data: { name: "Main Warehouse", isDefault: true } });
                locationId = newLoc.id;
            }
        }

        await Promise.all(data.attributesData.map(async (attr) => {
            if (!attr.name) return;
            const attrSlug = attr.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            const existingGlobal = await db.attribute.findUnique({ where: { slug: attrSlug } });
            
            if (existingGlobal) {
                const mergedValues = Array.from(new Set([...existingGlobal.values, ...attr.values]));
                if (mergedValues.length > existingGlobal.values.length) {
                    await db.attribute.update({ where: { id: existingGlobal.id }, data: { values: mergedValues } });
                }
            } else {
                await db.attribute.create({ data: { name: attr.name, slug: attrSlug, values: attr.values } });
            }
        }));

        const tagMap = new Map<string, string>();
        data.tagsList.forEach(tag => {
            const trimmedTag = tag.trim();
            if(!trimmedTag) return;
            const slug = trimmedTag.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            if(slug) {
                tagMap.set(slug, trimmedTag); 
            }
        });

        const tagOperations = Array.from(tagMap.entries()).map(([slug, name]) => ({
            where: { slug: slug },
            create: { name: name, slug: slug }
        }));

        let oldProductData: any = null;
        if (type === "UPDATE" && data.id) {
            oldProductData = await db.product.findUnique({
                where: { id: data.id },
                include: { 
                    tags: true, 
                    inventoryLevels: true,
                    images: true,
                    attributes: true,
                    collections: true,
                    category: true, 
                    brand: true,    
                    downloadFiles: true, 
                    bundleItems: true,
                    variants: {
                        where: { deletedAt: null },
                        include: { images: true, inventoryLevels: true }
                    }
                }
            });
        }

        const savedProduct = await db.$transaction(async (tx) => {
            
            if (type === "UPDATE" && data.id && oldProductData) {
                await tx.productVersion.create({
                    data: {
                        productId: data.id,
                        data: oldProductData as any,
                        createdBy: dbUser!.id,
                        reason: "Product Update"
                    }
                });
            }

            await syncSystemAttribute(tx, "Gender", data.gender);
            await syncSystemAttribute(tx, "Age Group", data.ageGroup);

            // --- SMART SAVE & DIFF LOGIC ---
            // Normalize Arrays for Comparison
            const normalizeInventory = (items: any[]) => items?.map(i => ({ loc: i.locationId, qty: i.quantity })).sort((a,b) => a.loc.localeCompare(b.loc)) || [];
            const normalizeImages = (imgs: any[]) => imgs?.map(i => (typeof i === 'string' ? i : i.url)).sort() || [];
            const normalizeAttributes = (attrs: any[]) => attrs?.map(a => ({ n: a.name, v: [...(a.values || [])].sort() })).sort((a,b) => a.n.localeCompare(b.n)) || [];
            
            const scalarsChanged = !oldProductData || 
                oldProductData.name !== data.name ||
                oldProductData.slug !== finalSlug ||
                Number(oldProductData.price) !== data.price ||
                Number(oldProductData.salePrice || 0) !== (data.salePrice || 0) ||
                oldProductData.description !== data.description ||
                oldProductData.shortDescription !== data.shortDescription ||
                oldProductData.status !== data.status ||
                oldProductData.productType !== data.productType ||
                oldProductData.trackQuantity !== data.trackQuantity ||
                oldProductData.isFeatured !== data.isFeatured ||
                oldProductData.categoryId !== (data.categoryId || null) ||
                oldProductData.brandId !== (data.brandId || null) ||
                oldProductData.taxRateId !== (data.taxRateId || null) ||
                oldProductData.shippingClassId !== (data.shippingClassId || null) ||
                Number(oldProductData.weight || 0) !== (data.weight || 0) ||
                Number(oldProductData.length || 0) !== (data.length || 0) ||
                Number(oldProductData.width || 0) !== (data.width || 0) ||
                Number(oldProductData.height || 0) !== (data.height || 0) ||
                oldProductData.isPreOrder !== data.isPreOrder ||
                oldProductData.preOrderLimit !== (data.preOrderLimit || null) ||
                oldProductData.preOrderMessage !== (data.preOrderMessage || null) ||
                oldProductData.featuredImage !== (data.featuredImage || null);

            const tagsChanged = !oldProductData || !arraysHaveSameContent(
                oldProductData.tags.map((t: any) => t.name),
                data.tagsList
            );

            const collectionsChanged = !oldProductData || !arraysHaveSameContent(
                oldProductData.collections.map((c: any) => c.id),
                data.collectionIds
            );

            const inventoryChanged = !oldProductData || !isDeepEqual(
                normalizeInventory(oldProductData.inventoryLevels),
                normalizeInventory(data.inventoryData)
            ) || data.stock !== oldProductData.stock;

            const imagesChanged = !oldProductData || !isDeepEqual(
                normalizeImages(oldProductData.images),
                normalizeImages(data.galleryImages)
            );

            const attributesChanged = !oldProductData || !isDeepEqual(
                normalizeAttributes(oldProductData.attributes),
                normalizeAttributes(data.attributesData)
            );

            // Detailed Variation Check
            const variationsChanged = data.productType === 'VARIABLE' && (!oldProductData || (
                oldProductData.variants.length !== data.variationsData.length ||
                !isDeepEqual(
                    oldProductData.variants.map((v: any) => ({ s: v.sku || "", p: Number(v.price), st: v.stock })).sort((a:any, b:any) => a.s.localeCompare(b.s)),
                    data.variationsData.map((v: any) => ({ s: v.sku || "", p: Number(v.price), st: Number(v.stock) })).sort((a:any, b:any) => a.s.localeCompare(b.s))
                )
            ));
            
            const bundleChanged = data.productType === 'BUNDLE' && (!oldProductData || !isDeepEqual(
                oldProductData.bundleItems.map((b: any) => b.childProductId).sort(),
                data.bundleItems.map((b: any) => b.childProductId).sort()
            ));

            const anyChanges = scalarsChanged || tagsChanged || collectionsChanged || inventoryChanged || imagesChanged || attributesChanged || variationsChanged || bundleChanged;

            // 🔥 EARLY EXIT IF NO CHANGES
            if (type === "UPDATE" && !anyChanges) {
                return { success: true, message: "No changes detected.", productId: data.id };
            }

            const taxRateRelation = data.taxRateId ? { connect: { id: data.taxRateId } } : (type === "UPDATE" ? { disconnect: true } : undefined);
            const shippingClassRelation = data.shippingClassId ? { connect: { id: data.shippingClassId } } : (type === "UPDATE" ? { disconnect: true } : undefined);
            
            let featuredMediaRelation = undefined;
            if (data.featuredMediaId) {
                featuredMediaRelation = { connect: { id: data.featuredMediaId } };
            } else if (type === "UPDATE" && !data.featuredImage) { 
                featuredMediaRelation = { disconnect: true };
            }

            const collectionsRelation = collectionsChanged || type === "CREATE"
                ? (type === "CREATE" ? { connect: data.collectionIds.map(cid => ({ id: cid })) } : { set: data.collectionIds.map(cid => ({ id: cid })) })
                : undefined;

            const categoryConnect = data.categoryName ? {
                connectOrCreate: {
                    where: { slug: data.categoryName.toLowerCase().replace(/\s+/g, '-') },
                    create: { name: data.categoryName, slug: data.categoryName.toLowerCase().replace(/\s+/g, '-') }
                }
            } : undefined;

            const brandConnect = data.vendorName ? {
                connectOrCreate: {
                    where: { slug: data.vendorName.toLowerCase().replace(/\s+/g, '-') },
                    create: { name: data.vendorName, slug: data.vendorName.toLowerCase().replace(/\s+/g, '-') }
                }
            } : undefined;

            const productData: any = {
                name: data.name,
                slug: finalSlug, 
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
                featuredMedia: featuredMediaRelation, 

                videoUrl: data.videoUrl,
                videoThumbnail: data.videoThumbnail,
                gender: data.gender,
                ageGroup: data.ageGroup,
                metafields: data.metafields || Prisma.DbNull,
                seoSchema: data.seoSchema || Prisma.DbNull,
                
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
                
                isPreOrder: data.isPreOrder,
                preOrderReleaseDate: data.preOrderReleaseDate ? new Date(data.preOrderReleaseDate) : null,
                preOrderLimit: data.preOrderLimit,
                preOrderMessage: data.preOrderMessage,

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
                
                ...(collectionsChanged || type === "CREATE" ? { collections: collectionsRelation } : {})
            };

            delete (productData as any).featuredMediaId;

            let product;
            
            if (data.id) {
                 if (tagsChanged) {
                     productData.tags = {
                         set: [],
                         connectOrCreate: tagOperations
                     };
                 }

                 if (scalarsChanged || tagsChanged || collectionsChanged || type === "UPDATE") {
                     product = await tx.product.update({
                        where: { id: data.id },
                        data: productData
                    });
                 } else {
                     product = { id: data.id, name: data.name }; 
                 }
            } else {
                productData.tags = {
                    connectOrCreate: tagOperations
                };
                product = await tx.product.create({
                    data: productData
                });
            }

            // --- EXECUTE ONLY NEEDED HANDLERS ---
            const promises = [];

            if (inventoryChanged || type === "CREATE") {
                promises.push(handleInventory(tx, product, data, locationId, dbUser!.id));
            }
            if (imagesChanged || type === "CREATE") {
                promises.push(handleImages(tx, product.id, data.galleryImages));
            }
            if (data.isDownloadable) {
                promises.push(handleDigitalFiles(tx, product.id, data.isDownloadable, data.digitalFiles));
            }
            if (attributesChanged || type === "CREATE") {
                promises.push(handleAttributes(tx, product.id, data.attributesData));
            }
            if (variationsChanged || type === "CREATE") {
                promises.push(handleVariations(tx, product.id, data.variationsData, data.productType, locationId, dbUser!.id));
            }
            if (bundleChanged || type === "CREATE") {
                promises.push(handleBundleItems(tx, product.id, data.productType, data.bundleItems));
            }

            await Promise.all(promises);

            const diff = oldProductData ? generateDiff(oldProductData, data) : { status: "CREATED", name: product.name };

            const logDetails = {
                ...diff,
                productName: product.name
            };

            if (type === "CREATE" || (diff && Object.keys(diff).length > 0)) {
                await tx.activityLog.create({
                    data: {
                        userId: dbUser!.id,
                        action: type === "CREATE" ? "CREATED_PRODUCT" : "UPDATED_PRODUCT",
                        entityType: "Product",
                        entityId: product.id,
                        details: logDetails 
                    }
                });
            }

            // 🔥 SERIALIZATION: Ensure Decimal/Date objects are clean for client
            return serializeData(product);

        }, { maxWait: 10000, timeout: 30000 });

        if ("success" in savedProduct) {
            return savedProduct;
        }

        revalidatePath("/admin/products");
        return { success: true, productId: savedProduct.id };

    } catch (error: any) {
        console.error("[SAVE_PRODUCT_ERROR]", error);
        
        if (error.message === "NAME_DUPLICATE_ERROR") {
            return { success: false, message: `The product name "${data.name}" is already used by another product.` };
        }

        if (error.code === 'P2002') {
            const target = error.meta?.target;
            if (Array.isArray(target)) {
                if (target.includes('name')) return { success: false, message: `The name "${data.name}" is already taken.` };
                if (target.includes('slug')) return { success: false, message: "URL Slug collision." };
                if (target.includes('sku')) return { success: false, message: `SKU "${data.sku}" is already in use.` };
            }
            return { success: false, message: "Duplicate value found (Tags, SKU, or Name)." };
        }

        return { success: false, message: "Failed to save product. " + (error.message || "") };
    }
}