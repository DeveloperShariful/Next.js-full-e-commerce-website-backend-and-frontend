// File: app/actions/storefront/product/get-single-related-product.ts

"use server";

import { db } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function getSingleProduct(slug: string) {
  try {
    const product = await db.product.findUnique({
      where: { 
        slug,
        status: ProductStatus.ACTIVE 
      },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        attributes: true,
        // ✅ ভ্যারিয়েন্ট এর সাথে ইনভেন্টরি লেভেল আনা হলো
        variants: {
          where: { deletedAt: null }, // সফট ডিলিট চেক
          include: {
            inventoryLevels: true
          },
          orderBy: { price: 'asc' }
        },
        brand: true, // ✅ ব্র্যান্ড লোগো দেখানোর জন্য
        // ✅ এন্টারপ্রাইজ ফিচার: সাবস্ক্রিপশন এবং ডিজিটাল ফাইল
        subscriptionPlans: {
            where: { isActive: true },
            orderBy: { price: 'asc' }
        },
        downloadFiles: true, 
      },
    });

    return product;
  } catch (error) {
    console.error("GET_SINGLE_PRODUCT_ERROR", error);
    return null;
  }
}

// ... getRelatedProducts (বাকি কোড আগের মতোই থাকবে)
export async function getRelatedProducts(categoryId: string | null, currentProductId: string) {
    // ... previous code
    if (!categoryId) return [];

    try {
      const products = await db.product.findMany({
        where: {
          categoryId: categoryId,
          id: { not: currentProductId },
          status: ProductStatus.ACTIVE,
        },
        take: 4,
        include: {
          images: { take: 1, orderBy: { position: 'asc' } },
          category: true,
          // ব্র্যান্ড এবং রিভিউ রেটিং যোগ করা যেতে পারে
        },
        orderBy: { createdAt: 'desc' }
      });
  
      return products;
    } catch (error) {
      return [];
    }
}