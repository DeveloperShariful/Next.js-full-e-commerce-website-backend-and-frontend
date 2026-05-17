// app/actions/storefront/shop/get-shop-products.ts
"use server";

import { db } from "@/lib/prisma";
import { StorefrontProduct } from "@/app/(frontend)/types";
import { Prisma } from "@prisma/client";

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ShopResponse {
  products: StorefrontProduct[];
  categories: Category[];
  pageInfo: PageInfo;
}

export async function getProductsAndCategoriesAction(
  categorySlug: string | null,
  limit: number = 12,
  page: number = 1
): Promise<ShopResponse> {
  try {
    // 1. Fetch Categories
    const categoriesData = await db.category.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { menuOrder: "asc" },
    });

    // 2. Build Where Clause for Products
    let where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      deletedAt: null,
    };
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    // 3. Count Total Products for Pagination
    const totalProducts = await db.product.count({ where });
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;

    // 4. Fetch Products with Prisma
    const productsData = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { attributes: true },
    });

    // 5. Map Products to StorefrontProduct (Decimal Fix included)
    const mappedProducts: StorefrontProduct[] = productsData.map((product) => {
      const regularPriceNum = product.price ? Number(product.price.toString()) : 0;
      const salePriceNum = product.salePrice ? Number(product.salePrice.toString()) : null;
      const isOnSale = salePriceNum !== null && salePriceNum < regularPriceNum;

      const formatPrice = (amount: number) =>
        new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(amount);

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

    // 6. Return Data with PageInfo
    return {
      products: mappedProducts,
      categories: categoriesData,
      pageInfo: {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        startCursor: page > 1 ? (page - 1).toString() : null,
        endCursor: page < totalPages ? (page + 1).toString() : null,
      },
    };
  } catch (error) {
    console.error("[getProductsAndCategoriesAction] Error:", error);
    return {
      products: [],
      categories: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null },
    };
  }
}