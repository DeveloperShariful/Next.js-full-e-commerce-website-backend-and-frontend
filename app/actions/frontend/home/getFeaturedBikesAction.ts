// app/actions/storefront/home/getFeaturedBikesAction.ts
"use server";

import { unstable_cache } from "next/cache";
import { db } from "@/lib/prisma";
import { StorefrontProduct, FeaturedBikesResponse } from "@/app/(frontend)/types";

async function _fetchFeaturedBikes(): Promise<FeaturedBikesResponse> {
  try {
    const featuredProducts = await db.product.findMany({
      where: {
        status: "ACTIVE",
        isFeatured: true,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      include: {
        attributes: true, 
      },
    });

    // Prisma থেকে পাওয়া ডেটাকে StorefrontProduct টাইপে ম্যাপ করা হচ্ছে
    const mappedProducts: StorefrontProduct[] = featuredProducts.map((product) => {
      
      // Prisma Decimal টাইপ থেকে Number এ কনভার্ট
      const regularPriceNum = product.price ? Number(product.price.toString()) : 0;
      const salePriceNum = product.salePrice ? Number(product.salePrice.toString()) : null;
      
      const isOnSale = salePriceNum !== null && salePriceNum < regularPriceNum;
      
      const formatPrice = (amount: number) => {
        return new Intl.NumberFormat("en-AU", {
          style: "currency",
          currency: "AUD",
          minimumFractionDigits: 2,
        }).format(amount);
      };

      return {
        id: product.id,
        databaseId: product.productCode,
        name: product.name,
        slug: product.slug,
        __typename: product.productType === "VARIABLE" ? "VariableProduct" : "SimpleProduct",
        image: product.featuredImage ? { sourceUrl: product.featuredImage } : null,
        
        // Rating Decimal থেকে Number এ কনভার্ট
        averageRating: product.rating ? Number(product.rating.toString()) : 0,
        reviewCount: product.reviewCount || 0,
        
        onSale: isOnSale,
        
        price: formatPrice(isOnSale && salePriceNum ? salePriceNum : regularPriceNum),
        regularPrice: formatPrice(regularPriceNum),
        salePrice: salePriceNum ? formatPrice(salePriceNum) : null,
        
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
    console.error("[getFeaturedBikesAction] Error:", error);
    return { success: false, products: [], error: "Failed to fetch featured products" };
  }
}

const _cachedFeaturedBikes = unstable_cache(
  _fetchFeaturedBikes,
  ["homepage-featured-bikes"],
  { revalidate: 3600, tags: ["products", "featured-bikes"] }
);

export async function getFeaturedBikesAction(): Promise<FeaturedBikesResponse> {
  return _cachedFeaturedBikes();
}