// File: app/actions/backend/product/product-duplicate.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductStatus, Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity-logger";

export async function duplicateProduct(id: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) return { success: false, message: "Unauthorized" };

    const original = await db.product.findUnique({
      where: { id },
      include: {
        tags: true,
        categories: true,
        brand: true,
        images: true,
        attributes: true,
        inventoryLevels: true,
        downloadFiles: true,
        variants: {
            include: {
                images: true,
                inventoryLevels: true
            }
        },
      }
    });

    if (!original) return { success: false, message: "Product not found" };

    const timestamp = Date.now();
    const newSlug = `${original.slug}-copy-${timestamp}`;
    const newSku = original.sku ? `${original.sku}-COPY-${timestamp}` : null;
    const newName = `${original.name} (Copy)`;

    const duplicatedId = await db.$transaction(async (tx) => {
        
        // ✅ FIX: Multiple Categories Connection
        const categoriesConnect = original.categories.length > 0 
            ? { connect: original.categories.map(c => ({ id: c.id })) } 
            : undefined;

        const brandConnect = original.brandId 
            ? { connect: { id: original.brandId } } 
            : undefined;

        const mediaConnect = original.featuredMediaId
            ? { connect: { id: original.featuredMediaId } }
            : undefined;

        const newProduct = await tx.product.create({
            data: {
                name: newName,
                slug: newSlug,
                sku: newSku,
                description: original.description,
                shortDescription: original.shortDescription,
                productType: original.productType,
                status: ProductStatus.DRAFT, 
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
                version: 1, 
                
                featuredImage: original.featuredImage,
                ...(mediaConnect && { featuredMedia: mediaConnect }), 

                isPreOrder: original.isPreOrder,
                preOrderReleaseDate: original.preOrderReleaseDate,
                preOrderLimit: original.preOrderLimit,
                preOrderMessage: original.preOrderMessage,
                
                upsellIds: original.upsellIds,
                crossSellIds: original.crossSellIds,
                
                categories: categoriesConnect, // ✅ FIX: Applied multiple categories
                brand: brandConnect,
                
                tags: {
                    connect: original.tags.map(t => ({ id: t.id }))
                },

                images: {
                    create: original.images
                        .filter(img => img.variantId === null)
                        .map(img => ({
                            url: img.url,
                            position: img.position,
                            ...(img.mediaId && { media: { connect: { id: img.mediaId } } }),
                            altText: img.altText
                        }))
                },

                attributes: {
                    create: original.attributes.map(attr => ({
                        name: attr.name,
                        values: attr.values,
                        visible: attr.visible,
                        variation: attr.variation,
                        position: attr.position
                    }))
                }
            }
        });

        if (original.inventoryLevels.length > 0) {
            await tx.inventoryLevel.createMany({
                data: original.inventoryLevels.map(inv => ({
                    productId: newProduct.id,
                    locationId: inv.locationId,
                    quantity: inv.quantity,
                    variantId: null,
                    version: 1
                }))
            });
        }

        if (original.variants.length > 0) {
            for (const v of original.variants) {
                const newVariant = await tx.productVariant.create({
                    data: {
                        productId: newProduct.id,
                        name: v.name,
                        sku: v.sku ? `${v.sku}-COPY-${Date.now().toString(36).toUpperCase()}` : null,
                        price: v.price,
                        stock: v.stock,
                        attributes: v.attributes as unknown as Prisma.InputJsonValue,
                        trackQuantity: v.trackQuantity,
                        weight: v.weight,
                        version: 1,
                        
                        isPreOrder: v.isPreOrder,
                        preOrderReleaseDate: v.preOrderReleaseDate,
                        
                        images: {
                            create: v.images.map(vImg => ({
                                url: vImg.url,
                                position: vImg.position,
                                productId: newProduct.id,
                                ...(vImg.mediaId && { media: { connect: { id: vImg.mediaId } } }) 
                            }))
                        }
                    }
                });

                if (v.inventoryLevels && v.inventoryLevels.length > 0) {
                    await tx.inventoryLevel.createMany({
                        data: v.inventoryLevels.map(inv => ({
                            productId: newProduct.id,
                            variantId: newVariant.id,
                            locationId: inv.locationId,
                            quantity: inv.quantity,
                            version: 1
                        }))
                    });
                }
            }
        }

        if (original.downloadFiles && original.downloadFiles.length > 0) {
            await tx.digitalFile.createMany({
                data: original.downloadFiles.map(file => ({
                    productId: newProduct.id,
                    name: file.name,
                    url: file.url,
                    isSecure: file.isSecure,
                }))
            });
        }

        return newProduct.id;
    });

    await logActivity({
        action: "DUPLICATED_PRODUCT",
        entityType: "Product",
        entityId: duplicatedId,
        details: {
            originalId: id,
            newName: newName,
        },
    });

    revalidatePath("/admin/products");
    return { success: true, message: "Product duplicated successfully" };

  } catch (error) {
    console.error("Duplicate Error:", error);
    return { success: false, message: "Failed to duplicate product" };
  }
}