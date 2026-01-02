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
        images: true, // All images
        attributes: true,
        variants: { include: { images: true } }, // Include variant images
        inventoryLevels: true,
      }
    });

    if (!original) return { success: false, message: "Product not found" };

    const timestamp = Date.now();
    const newSlug = `${original.slug}-copy-${timestamp}`;
    const newSku = original.sku ? `${original.sku}-COPY-${timestamp}` : null;
    const newName = `${original.name} (Copy)`;

    // 🔥 FIX: Transaction ব্যবহার করা হচ্ছে যাতে রিলেশন এরর না দেয়
    await db.$transaction(async (tx) => {
        
        // ২. প্রথমে মেইন প্রোডাক্ট তৈরি (ভেরিয়েন্ট ছাড়া)
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
                featuredImage: original.featuredImage,
                
                upsellIds: original.upsellIds,
                crossSellIds: original.crossSellIds,
                
                category: original.categoryId ? { connect: { id: original.categoryId } } : undefined,
                brand: original.brandId ? { connect: { id: original.brandId } } : undefined,
                
                tags: {
                    connect: original.tags.map(t => ({ id: t.id }))
                },

                // শুধু মেইন প্রোডাক্টের ইমেজগুলো কপি হবে (যেগুলোর variantId নেই)
                images: {
                    create: original.images
                        .filter(img => img.variantId === null)
                        .map(img => ({
                            url: img.url,
                            position: img.position
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
                // ❌ ভেরিয়েন্ট এখানে তৈরি করব না, নিচে আলাদা লুপে করব
            }
        });

        // ৩. এখন ভেরিয়েন্টগুলো তৈরি করব (New Product ID ব্যবহার করে)
        if (original.variants.length > 0) {
            for (const v of original.variants) {
                await tx.productVariant.create({
                    data: {
                        productId: newProduct.id, // 🔥 Link to new product
                        name: v.name,
                        sku: v.sku ? `${v.sku}-COPY-${Math.floor(Math.random() * 1000)}` : null,
                        price: v.price,
                        stock: v.stock,
                        attributes: v.attributes as any,
                        trackQuantity: v.trackQuantity,
                        weight: v.weight,
                        
                        // 🔥 ভেরিয়েন্ট ইমেজের জন্য এখন আমরা productId পাস করতে পারব
                        images: {
                            create: v.images.map(vImg => ({
                                url: vImg.url,
                                position: vImg.position,
                                productId: newProduct.id // ✅ This fixes the error!
                            }))
                        }
                    }
                });
            }
        }

        // ৪. লগ অ্যাক্টিভিটি
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