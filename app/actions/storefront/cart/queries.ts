"use server";

import { db } from "@/lib/db";
import { cookies } from "next/headers";

export type CartWithItems = {
  id: string;
  items: {
    id: string;
    quantity: number;
    productId: string;
    variantId: string | null;
    product: {
      name: string;
      slug: string;
      featuredImage: string | null;
      price: number;
      salePrice: number | null;
    };
    variant: {
      id: string;
      name: string;
      image: string | null;
      price: number;
      salePrice: number | null;
      attributes: any; 
    } | null;
  }[];
} | null;

export async function getCart(): Promise<CartWithItems> {
  try {
    // ✅ FIX: Added 'await' for Next.js 15
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart_session")?.value;

    if (!sessionId) return null;

    const cart = await db.cart.findFirst({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                featuredImage: true,
                price: true,
                salePrice: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                salePrice: true,
                attributes: true,
              },
            },
          },
          orderBy: {
            id: 'asc' 
          }
        },
      },
    });

    if (!cart) return null;

    return cart as unknown as CartWithItems;
  } catch (error) {
    console.error("GET_CART_ERROR", error);
    return null;
  }
}