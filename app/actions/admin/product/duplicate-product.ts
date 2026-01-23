// File: app/actions/admin/product/duplicate-product.ts

"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";

export async function duplicateProduct(id: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, message: "Unauthorized" };
    
    // Find internal DB user ID for logging
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } });

    // ১. অরিজিনাল প্রোডাক্ট খুঁজে বের করা
    const original = await db.product.findUnique({
      where: { id },
      include: {
        tags: true,
        category: true,
        brand: true,
        images: true, 
        attributes: true,
        inventoryLevels: true, // Main product inventory
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

    await db.$transaction(async (tx) => {
        
        // কানেকশন লজিকগুলো ভেরিয়েবলে নেওয়া হলো
        const categoryConnect = original.categoryId 
            ? { connect: { id: original.categoryId } } 
            : undefined;

        const brandConnect = original.brandId 
            ? { connect: { id: original.brandId } } 
            : undefined;

        // 🔥 FIX: Featured Media Connect Logic
        const mediaConnect = original.featuredMediaId
            ? { connect: { id: original.featuredMediaId } }
            : undefined;

        // ২. প্রথমে মেইন প্রোডাক্ট তৈরি
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
                
                // 🔥 FIX: সরাসরি featuredMediaId ব্যবহার না করে connect ব্যবহার করা হয়েছে
                featuredImage: original.featuredImage,
                ...(mediaConnect && { featuredMedia: mediaConnect }), 

                // Pre-order Fields Copied
                isPreOrder: original.isPreOrder,
                preOrderReleaseDate: original.preOrderReleaseDate,
                preOrderLimit: original.preOrderLimit,
                preOrderMessage: original.preOrderMessage,
                
                upsellIds: original.upsellIds,
                crossSellIds: original.crossSellIds,
                
                // Relations
                category: categoryConnect,
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
                            // Media connect for gallery images
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

        // ৩. মেইন প্রোডাক্টের ইনভেন্টরি লেভেল কপি করা
        if (original.inventoryLevels.length > 0) {
            await tx.inventoryLevel.createMany({
                data: original.inventoryLevels.map(inv => ({
                    productId: newProduct.id,
                    locationId: inv.locationId,
                    quantity: inv.quantity,
                    variantId: null
                }))
            });
        }

        // ৪. ভেরিয়েন্ট এবং তাদের ইনভেন্টরি তৈরি
        if (original.variants.length > 0) {
            for (const v of original.variants) {
                const newVariant = await tx.productVariant.create({
                    data: {
                        productId: newProduct.id,
                        name: v.name,
                        sku: v.sku ? `${v.sku}-COPY-${Math.floor(Math.random() * 1000)}` : null,
                        price: v.price,
                        stock: v.stock,
                        attributes: v.attributes as any,
                        trackQuantity: v.trackQuantity,
                        weight: v.weight,
                        
                        // Pre-order for Variants
                        isPreOrder: v.isPreOrder,
                        preOrderReleaseDate: v.preOrderReleaseDate,
                        
                        images: {
                            create: v.images.map(vImg => ({
                                url: vImg.url,
                                position: vImg.position,
                                productId: newProduct.id,
                                // Media connect for variant images
                                ...(vImg.mediaId && { media: { connect: { id: vImg.mediaId } } }) 
                            }))
                        }
                    }
                });

                // ভেরিয়েন্টের ইনভেন্টরি লেভেল
                if (v.inventoryLevels && v.inventoryLevels.length > 0) {
                    await tx.inventoryLevel.createMany({
                        data: v.inventoryLevels.map(inv => ({
                            productId: newProduct.id,
                            variantId: newVariant.id,
                            locationId: inv.locationId,
                            quantity: inv.quantity
                        }))
                    });
                }
            }
        }

        // ৬. লগ অ্যাক্টিভিটি
        if (dbUser) {
            await tx.activityLog.create({
                data: {
                    userId: dbUser.id,
                    action: "DUPLICATED_PRODUCT",
                    entityType: "Product",
                    entityId: newProduct.id,
                    details: { 
                        originalId: id, 
                        newName: newName 
                    }
                }
            });
        }
    });

    revalidatePath("/admin/products");
    return { success: true, message: "Product duplicated successfully" };

  } catch (error) {
    console.error("Duplicate Error:", error);
    return { success: false, message: "Failed to duplicate product" };
  }
}