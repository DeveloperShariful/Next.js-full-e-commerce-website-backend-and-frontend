// File: app/actions/storefront/cart/getCrossSellProductsAction.ts
"use server";

import { db } from "@/lib/prisma";
import { StorefrontProduct } from "@/app/(frontend)/types";

export async function getCrossSellProductsAction(): Promise<{ success: boolean; products: StorefrontProduct[] }> {
  try {
    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        // ✅ FIX: Updated from 'category' to 'categories: { some: ... }'
        categories: {
          some: {
            slug: "spare-parts" 
          }
        }
      },
      take: 4,
      include: {
        attributes: true,
      }
    });

    const mappedProducts: StorefrontProduct[] = products.map((product) => {
      const regularPriceNum = product.price ? Number(product.price.toString()) : 0;
      const salePriceNum = product.salePrice ? Number(product.salePrice.toString()) : null;
      const now = new Date();
      const isOnSale = salePriceNum !== null &&
        salePriceNum < regularPriceNum &&
        (!product.saleStart || now >= product.saleStart) &&
        (!product.saleEnd || now <= product.saleEnd);
      
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
    console.error("[getCrossSellProductsAction] Error:", error);
    return { success: false, products: [] };
  }
}