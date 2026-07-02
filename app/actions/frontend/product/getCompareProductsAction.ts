// app/actions/storefront/product/getCompareProductsAction.ts
"use server";

import { db } from "@/lib/prisma";

export async function getCompareProductsAction(slugs: string[]) {
  try {
    if (!slugs || slugs.length === 0) return { success: true, products: [] };

    // ১. ডাটাবেজ থেকে প্রোডাক্ট ফেচ করা
    const products = await db.product.findMany({
      where: {
        slug: { in: slugs },
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        attributes: true,
      },
    });

    // ২. ডাটা ম্যাপিং (যাতে অরিজিনাল ইন্টারফেস ব্রেক না করে)
    const mappedProducts = products.map((product) => {
      
      const regularPriceNum = product.price ? Number(product.price.toString()) : 0;
      const salePriceNum = product.salePrice ? Number(product.salePrice.toString()) : null;
      const now = new Date();
      const isOnSale = salePriceNum !== null &&
        salePriceNum < regularPriceNum &&
        (!product.saleStart || now >= product.saleStart) &&
        (!product.saleEnd || now <= product.saleEnd);

      const formatPrice = (amount: number) =>
        new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(amount);

      return {
        id: product.id,
        databaseId: product.productCode,
        slug: product.slug,
        name: product.name,
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        image: product.featuredImage ? { sourceUrl: product.featuredImage } : null,
        averageRating: product.rating ? Number(product.rating.toString()) : 0,
        reviewCount: product.reviewCount || 0,
        
        // প্রাইস এবং স্টক স্ট্যাটাস
        price: formatPrice(isOnSale && salePriceNum ? salePriceNum : regularPriceNum),
        salePrice: salePriceNum ? formatPrice(salePriceNum) : null,
        regularPrice: formatPrice(regularPriceNum),
        stockStatus: product.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        
        // ডেসিমাল ফিক্সিং (Dimension & Weight)
        weight: product.weight ? Number(product.weight.toString()) : null,
        length: product.length ? Number(product.length.toString()) : null,
        width: product.width ? Number(product.width.toString()) : null,
        height: product.height ? Number(product.height.toString()) : null,

        attributes: {
          nodes: product.attributes.map((attr) => ({
            name: attr.name,
            options: attr.values,
          })),
        },
      };
    });

    return { success: true, products: mappedProducts };
  } catch (error) {
    console.error("[getCompareProductsAction] Error:", error);
    return { success: false, products: [], error: "Failed to fetch compare items" };
  }
}