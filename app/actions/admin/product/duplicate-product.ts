// app/actions/admin/product/duplicate-product.ts

"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ProductStatus } from "@prisma/client"; // 🚀 IMPORT ENUM

export async function duplicateProduct(id: string) {
  try {
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

    const timestamp = Date.now();
    const newSlug = `${original.slug}-copy-${timestamp}`;
    const newSku = original.sku ? `${original.sku}-COPY-${timestamp}` : null;
    const newName = `${original.name} (Copy)`;

    await db.product.create({
      data: {
        name: newName,
        slug: newSlug,
        sku: newSku,
        description: original.description,
        shortDescription: original.shortDescription,
        productType: original.productType,
        status: ProductStatus.DRAFT, // 🚀 FIX: Use Enum
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

        images: {
          create: original.images.map(img => ({
            url: img.url,
            position: img.position
          }))
        },

        attributes: {
          create: original.attributes.map(attr => ({
            name: attr.name,
            values: attr.values,
            visible: attr.visible,
            variation: attr.variation
          }))
        },

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