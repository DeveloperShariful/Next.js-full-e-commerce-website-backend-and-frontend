// File: app/actions/backend/product/product-create-update.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma, Role } from "@prisma/client";
import { generateUniqueSlug, generateDiff, isDeepEqual, arraysHaveSameContent, serializeData, checkBundleCycle, calculateBundleStock } from "@/app/actions/backend/product/product-utils"; 
import { auth } from "@/auth";

// 🔥 GMC Sync Action
import { syncProductToGoogle } from "@/app/actions/backend/marketing/gmc-product-sync.actions";

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

type OldProductData = Prisma.ProductGetPayload<{
    include: {
        tags: true;
        inventoryLevels: true;
        images: true;
        attributes: true;
        collections: true;
        categories: true;
        brand: true;
        downloadFiles: true;
        bundleItems: true;
        variants: {
            where: { deletedAt: null };
            include: { images: true; inventoryLevels: true };
        };
    };
}>;

async function syncSystemAttribute(tx: Prisma.TransactionClient, name: string, value: string | null) {
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

async function syncGlobalAttributeValues(tx: Prisma.TransactionClient, attributesData: { name?: string; values: string[]; saveGlobally?: boolean }[]) {
    for (const attr of attributesData) {
        if (attr.saveGlobally && attr.name) {
             const slug = attr.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
             const existing = await tx.attribute.findUnique({ where: { slug } });
             if (existing) {
                 const newValues = Array.from(new Set([...existing.values, ...attr.values]));
                 await tx.attribute.update({
                     where: { id: existing.id },
                     data: { values: newValues }
                 });
             } else {
                 await tx.attribute.create({
                     data: {
                         name: attr.name,
                         slug,
                         type: "TEXT",
                         values: attr.values
                     }
                 });
             }
        }
    }
}

export async function createProduct(formData: FormData): Promise<ProductFormState> {
    return await saveProduct(formData, "CREATE");
}

export async function updateProduct(formData: FormData): Promise<ProductFormState> {
    return await saveProduct(formData, "UPDATE");
}

async function saveProduct(formData: FormData, type: "CREATE" | "UPDATE"): Promise<ProductFormState> {
 
    const session = await auth();
    if (!session || !session.user) return { success: false, message: "Unauthorized access" };

    const email = session.user.email;
    if (!email) return { success: false, message: "User email not found" };

    const dbUser = await db.user.findUnique({
        where: { email },
        select: { id: true, role: true },
    });

    if (!dbUser) {
        return { success: false, message: "User account not found. Please sign in again." };
    }

    const allowedRoles: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EDITOR];
    if (!allowedRoles.includes(dbUser.role as Role)) {
        return { success: false, message: "Forbidden: insufficient permissions to manage products." };
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
    } else if (type === "UPDATE" && data.id) {
        const currentProduct = await db.product.findUnique({ where: { id: data.id }, select: { version: true } });
         if (currentProduct && (data.version && currentProduct.version !== data.version)) { 
            return { success: false, message: "Conflict: Product was updated by someone else. Please refresh." };
          }
    }

    if (data.productType === 'BUNDLE' && data.bundleItems.length > 0 && data.id) {
        const childIds = data.bundleItems.map(b => b.childProductId);
        if (await checkBundleCycle(data.id, childIds)) {
             return { success: false, message: "Cyclic dependency detected in bundle items." };
        }
    }

    const finalSlug = await generateUniqueSlug(data.slug, "product", data.id);

    try {
        let locationId = "";
        
        if (data.trackQuantity || data.productType === 'VARIABLE') {
            const loc = await db.location.findFirst({
                where: { isDefault: true, isActive: true },
                select: { id: true },
            });
            if (loc) {
                locationId = loc.id;
            } else {
                const anyActive = await db.location.findFirst({
                    where: { isActive: true },
                    select: { id: true },
                });
                if (anyActive) {
                    locationId = anyActive.id;
                } else {
                    const newLoc = await db.location.create({
                        data: { name: "Main Warehouse", isDefault: true, isActive: true },
                    });
                    locationId = newLoc.id;
                }
            }
        }

        const tagOperations = data.tagsList.map(tag => {
            const slug = tag.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
            return {
                where: { slug },
                create: { name: tag.trim(), slug }
            };
        });

        let oldProductData: OldProductData | null = null;
        if (type === "UPDATE" && data.id) {
            oldProductData = await db.product.findUnique({
                where: { id: data.id },
                include: { 
                    tags: true, 
                    inventoryLevels: true,
                    images: true,
                    attributes: true,
                    collections: true,
                    categories: true, 
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
                        data: oldProductData as unknown as Prisma.InputJsonValue,
                        createdBy: dbUser!.id,
                        reason: "Product Update"
                    }
                });
            }

            await syncSystemAttribute(tx, "Gender", data.gender);
            await syncSystemAttribute(tx, "Age Group", data.ageGroup);
            await syncGlobalAttributeValues(tx, data.attributesData);

            let calculatedStock = data.stock;
            if (data.productType === 'BUNDLE') {
                calculatedStock = await calculateBundleStock(tx, data.bundleItems);
            }

            // 🚀 উকমার্স গুগল সাইজ, কালার ইত্যাদি ডাটা ডাইনামিকলি Metafields JSON এর ভেতর ইনজেক্ট করার ম্যাজিক লজিক
            const metafieldsObj: Record<string, unknown> = {};

            // কাস্টম মেটাফিল্ডসগুলো প্রথমে অবজেক্টে রূপান্তর করা হচ্ছে
            if (Array.isArray(data.metafields)) {
                data.metafields.forEach((item: { key?: string; value?: string }) => {
                    if (item.key && item.value) {
                        metafieldsObj[item.key] = item.value;
                    }
                });
            }

            // গুগলের স্পেসিফিক ফিল্ডগুলো একই মেটাফিল্ডস অবজেক্টের ভেতরে মার্চ (Merge) করে সেভ করা হচ্ছে
            metafieldsObj.google_size = data.google_size || "";
            metafieldsObj.google_size_system = data.google_size_system || "";
            metafieldsObj.google_size_type = data.google_size_type || "";
            metafieldsObj.google_color = data.google_color || "";
            metafieldsObj.google_material = data.google_material || "";
            metafieldsObj.google_pattern = data.google_pattern || "";
            metafieldsObj.google_multipack = data.google_multipack || "";
            metafieldsObj.google_adult_content = data.google_adult_content;
            metafieldsObj.google_availability_date = data.google_availability_date || "";

            const normalizeInventory = (items: { locationId: string; quantity: number }[]) => items?.map(i => ({ loc: i.locationId, qty: i.quantity })).sort((a, b) => a.loc.localeCompare(b.loc)) || [];
            const normalizeImages = (imgs: (string | { url: string })[]) => imgs?.map(i => (typeof i === 'string' ? i : i.url)).sort() || [];
            const normalizeAttributes = (attrs: { name: string; values?: string[] }[]) => attrs?.map(a => ({ n: a.name, v: [...(a.values || [])].sort() })).sort((a, b) => a.n.localeCompare(b.n)) || [];
            
            // 🚀 Scalars changed লজিকে নতুন গুগল মার্চেন্ট সেন্টারের ৫টি কলাম ফিক্স করা হয়েছে (ডেল্টা সিস্টেম অক্ষুণ্ণ রাখতে)
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
                oldProductData.brandId !== (data.brandId || null) ||
                oldProductData.taxRateId !== (data.taxRateId || null) ||
                oldProductData.shippingClassId !== (data.shippingClassId || null) ||
                Number(oldProductData.weight || 0) !== (data.weight || 0) ||
                Number(oldProductData.length || 0) !== (data.length || 0) ||
                Number(oldProductData.width || 0) !== (data.width || 0) ||
                Number(oldProductData.height || 0) !== (data.height || 0) ||
                oldProductData.isPreOrder !== data.isPreOrder ||
                (oldProductData.preOrderReleaseDate?.toISOString().split('T')[0] || null) !== (data.preOrderReleaseDate || null) ||
                oldProductData.preOrderLimit !== (data.preOrderLimit || null) ||
                oldProductData.preOrderMessage !== (data.preOrderMessage || null) ||
                oldProductData.featuredImage !== (data.featuredImage || null) ||
                // 👇 গুগল মার্চেন্ট সেন্টার কোর কলাম কম্প্যারিসন
                oldProductData.condition !== data.condition ||
                oldProductData.googleProductCategory !== (data.googleProductCategory || null) ||
                oldProductData.googleTitle !== (data.googleTitle || null) ||
                oldProductData.googleDescription !== (data.googleDescription || null) ||
                oldProductData.googleIsBundle !== data.googleIsBundle;

            const categoriesChanged = !oldProductData || !arraysHaveSameContent(
                oldProductData.categories.map(c => c.id),
                data.categoryIds || []
            );

            const tagsChanged = !oldProductData || !arraysHaveSameContent(
                oldProductData.tags.map(t => t.name),
                data.tagsList
            );

            const collectionsChanged = !oldProductData || !arraysHaveSameContent(
                oldProductData.collections.map(c => c.id),
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

            const variationsChanged = data.productType === 'VARIABLE' && (!oldProductData || (
                oldProductData.variants.length !== data.variationsData.length ||
                !isDeepEqual(
                    oldProductData.variants.map(v => ({ s: v.sku || "", p: Number(v.price), sp: Number(v.salePrice || 0), st: v.stock, pre: v.isPreOrder, prd: v.preOrderReleaseDate?.toISOString().split('T')[0] || null })).sort((a, b) => a.s.localeCompare(b.s)),
                    data.variationsData.map(v => ({ s: v.sku || "", p: Number(v.price), sp: Number(v.salePrice || 0), st: Number(v.stock), pre: v.isPreOrder || false, prd: v.preOrderReleaseDate || null })).sort((a, b) => a.s.localeCompare(b.s))
                )
            ));

            const bundleChanged = data.productType === 'BUNDLE' && (!oldProductData || !isDeepEqual(
                oldProductData.bundleItems.map(b => b.childProductId).sort(),
                data.bundleItems.map(b => b.childProductId).sort()
            ));

            const metafieldsChanged = !oldProductData || !isDeepEqual(
                oldProductData.metafields,
                metafieldsObj
            );

            const anyChanges = scalarsChanged || categoriesChanged || tagsChanged || collectionsChanged || inventoryChanged || imagesChanged || attributesChanged || variationsChanged || bundleChanged || metafieldsChanged;

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

            const categoriesRelation = categoriesChanged || type === "CREATE"
                ? (type === "CREATE" ? { connect: (data.categoryIds || []).map((cid: string) => ({ id: cid })) } : { set: (data.categoryIds || []).map((cid: string) => ({ id: cid })) })
                : undefined;

            const brandConnect = data.vendorName ? {
                connectOrCreate: {
                    where: { slug: data.vendorName.toLowerCase().replace(/\s+/g, '-') },
                    create: { name: data.vendorName, slug: data.vendorName.toLowerCase().replace(/\s+/g, '-') }
                }
            } : undefined;

            const productPayload: Record<string, unknown> = {
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
                stock: calculatedStock,
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
                
                // 🚀 মার্চ করা নতুন মেটাফিল্ডস অবজেক্ট সেভ করা হচ্ছে
                metafields: metafieldsObj as unknown as Prisma.InputJsonValue,
                seoSchema: (data.seoSchema || Prisma.DbNull) as unknown as Prisma.InputJsonValue,
                
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
                version: { increment: 1 },
                
                taxStatus: data.taxStatus,
                taxRate: taxRateRelation,
                shippingClass: shippingClassRelation,

                upsellIds: data.upsells,
                crossSellIds: data.crossSells,

                brand: brandConnect,

                // Facebook / Meta Catalog fields
                facebookSyncMode: data.facebookSyncMode || null,
                facebookDescription: data.facebookDescription || null,
                facebookImageType: data.facebookImageType || "PRODUCT_IMAGE",
                facebookPrice: data.facebookPrice ?? null,
                size: data.size || null,
                color: data.color || null,
                material: data.material || null,
                pattern: data.pattern || null,

                // 🚀 গুগল কোর কলামগুলো ডাটাবেজে সেভ করা হচ্ছে
                condition: data.condition,
                googleProductCategory: data.googleProductCategory,
                googleTitle: data.googleTitle,
                googleDescription: data.googleDescription,
                googleIsBundle: data.googleIsBundle,
                
                ...(collectionsChanged || type === "CREATE" ? { collections: collectionsRelation } : {}),
                ...(categoriesChanged || type === "CREATE" ? { categories: categoriesRelation } : {})
            };

            let product;
            
            if (data.id) {
                 if (tagsChanged) {
                     productPayload.tags = {
                         set: [],
                         connectOrCreate: tagOperations
                     };
                 }

                 if (scalarsChanged || tagsChanged || collectionsChanged || categoriesChanged || variationsChanged || metafieldsChanged || type === "UPDATE") {
                     product = await tx.product.update({
                        where: { id: data.id },
                        data: productPayload as unknown as Prisma.ProductUpdateInput
                    });
                 } else {
                     product = await tx.product.findUniqueOrThrow({ where: { id: data.id }, select: { id: true, name: true, slug: true } });
                 }
            } else {
                productPayload.tags = {
                    connectOrCreate: tagOperations
                };
                product = await tx.product.create({
                    data: productPayload as unknown as Prisma.ProductCreateInput
                });
            }

            const promises = [];

            if (data.productType === 'BUNDLE') {
                // Clean up parent-level inventory when switching to BUNDLE type
                promises.push(tx.inventoryLevel.deleteMany({ where: { productId: product.id, variantId: null } }));
            } else if (inventoryChanged || type === "CREATE") {
                promises.push(handleInventory(tx, product, data, locationId, dbUser!.id));
            }
            if (imagesChanged || type === "CREATE") {
                promises.push(handleImages(tx, product.id, data.galleryImages));
            }
            // Always call handleDigitalFiles so files are deleted when switching away from downloadable
            promises.push(handleDigitalFiles(tx, product.id, data.isDownloadable, data.digitalFiles));
            if (attributesChanged || type === "CREATE") {
                promises.push(handleAttributes(tx, product.id, data.attributesData));
            }
            
            const productTypeChanged = oldProductData && oldProductData.productType !== data.productType;
            const hasOrphanedVariations = data.productType !== 'VARIABLE' && (oldProductData?.variants?.length ?? 0) > 0;
            
            if (variationsChanged || productTypeChanged || hasOrphanedVariations || type === "CREATE") {
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

            return serializeData(product);

        }, { maxWait: 20000, timeout: 120000 });

        if ("success" in savedProduct) {
            return savedProduct;
        }

        // গুগল মার্চেন্ট সেন্টার সিঙ্ক অ্যাক্টিভ করা
        if (savedProduct && savedProduct.id) {
            syncProductToGoogle(savedProduct.id).catch((err) => {
                console.error("Background GMC Sync failed for Product ID:", savedProduct.id, err);
            });
        }

        if (savedProduct && savedProduct.id) {
            revalidatePath(`/product/${savedProduct.slug}`);

            try {
                const connectedCategories = await db.category.findMany({
                    where: { products: { some: { id: savedProduct.id } } },
                    select: { slug: true }
                });

                connectedCategories.forEach((cat) => {
                    if (cat.slug) {
                        revalidatePath(`/${cat.slug}`); 
                    }
                });
            } catch (e) {
                console.error("Failed to dynamically revalidate categories:", e);
            }
        }

        revalidatePath("/admin/products");
        return { success: true, productId: savedProduct.id };

    } catch (error: unknown) {
        console.error("[SAVE_PRODUCT_ERROR]", error);

        if (error instanceof Error && error.message === "NAME_DUPLICATE_ERROR") {
            return { success: false, message: `The product name "${data.name}" is already used by another product.` };
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = (error.meta as { target?: string[] } | undefined)?.target;
                if (Array.isArray(target)) {
                    if (target.includes('name')) return { success: false, message: `The name "${data.name}" is already taken.` };
                    if (target.includes('slug')) return { success: false, message: "URL Slug collision. Please try again." };
                    if (target.includes('sku')) return { success: false, message: `SKU "${data.sku}" is already in use.` };
                }
                return { success: false, message: "Duplicate value found (Tags, SKU, or Name)." };
            }
            if (error.code === 'P2028') {
                return { success: false, message: "Operation timed out due to too many variations. Please try saving fewer variations at once." };
            }
        }

        const message = error instanceof Error ? error.message : "";
        return { success: false, message: "Failed to save product. " + message };
    }
}