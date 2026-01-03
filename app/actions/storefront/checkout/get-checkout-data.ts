// app/actions/storefront/checkout/get-checkout-data.ts
"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export async function getCheckoutData(cartId: string | undefined) {
  try {
    const user = await currentUser();
    
    // ১. ইউজার ডাটা (Clerk Sync)
    let dbUser = null;
    if (user?.id) {
      dbUser = await db.user.findUnique({
        where: { clerkId: user.id },
        include: { addresses: true }
      });
    }

    // ২. প্যারালাল ডাটা ফেচিং
    const [cart, paymentMethods, storeSettings] = await Promise.all([
      // A. Cart
      cartId ? db.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: { include: { images: true } },
              variant: { include: { images: true } }
            },
            orderBy: { productId: 'asc' }
          }
        }
      }) : null,

      // B. Payment Methods (Filter enabled only)
      db.paymentMethodConfig.findMany({
        where: { isEnabled: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true, identifier: true, name: true, description: true, icon: true, instructions: true,
          mode: true,
          offlineConfig: {
            select: { 
              bankDetails: true, 
              chequePayTo: true, 
              addressInfo: true,
              enableForShippingMethods: true // 👈 ADDED: For Conditional Logic
            }
          }
        }
      }),

      // C. Store Settings
      db.storeSettings.findUnique({
        where: { id: "settings" },
        select: {
          currency: true,
          currencySymbol: true,
          taxSettings: true,
          weightUnit: true
        }
      })
    ]);

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    return {
      success: true,
      data: {
        cart,
        user: dbUser,
        savedAddresses: dbUser?.addresses || [],
        paymentMethods,
        settings: storeSettings
      }
    };

  } catch (error) {
    console.error("Checkout Data Load Error:", error);
    return { success: false, error: "Failed to load checkout." };
  }
}