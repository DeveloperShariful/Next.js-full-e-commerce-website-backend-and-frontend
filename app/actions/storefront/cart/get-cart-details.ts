// File: app/actions/storefront/cart/get-cart-details.ts
"use server";

import { db } from "@/lib/prisma";

export async function getCartDetails(cartId: string | undefined) {
  console.log("\n📥 [FETCH] Get Cart Details Called");
  console.log("🆔 Received Cart ID:", cartId || "Undefined");

  try {
    if (!cartId) {
      console.warn("⚠️ No Cart ID found in request");
      return { success: false, message: "No cart ID found" };
    }

    const cart = await db.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          orderBy: { id: "asc" }, // createdAt এর বদলে id ব্যবহার করা হলো
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                salePrice: true,
                featuredImage: true,
                stock: true, 
                images: {
                  take: 1, 
                  select: { url: true }
                }
              }
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                image: true,
                stock: true,
                sku: true
              }
            }
          }
        }
      }
    });

    if (!cart) {
      console.error("❌ Cart not found in Database for ID:", cartId);
      return { success: false, message: "Cart not found" };
    }

    console.log(`✅ Cart Found with ${cart.items.length} items`);
    return { success: true, data: cart };

  } catch (error) {
    console.error("🔥 [ERROR] Get Cart Failed:", error);
    return { success: false, message: "Failed to fetch cart details" };
  }
}