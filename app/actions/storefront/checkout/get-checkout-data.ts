// File: app/actions/storefront/checkout/get-checkout-data.ts
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
        include: { addresses: true },
      });
    }

    // ২. প্যারালাল ডাটা ফেচিং
    const [cart, paymentMethods, storeSettings] = await Promise.all([
      // A. Cart Data
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

      // B. Payment Methods (Only Enabled)
      db.paymentMethodConfig.findMany({
        where: { isEnabled: true },
        orderBy: { displayOrder: 'asc' },
        select: {
          id: true, identifier: true, name: true, description: true, icon: true, instructions: true,
          mode: true,
          
          // ✅ FIX: Surcharge Data ফেচ করতে হবে (Frontend Calculation এর জন্য)
          surchargeEnabled: true,
          surchargeType: true,
          surchargeAmount: true,
          minOrderAmount: true,
          maxOrderAmount: true,

          // 1. Offline Configs
          offlineConfig: {
            select: { 
              bankDetails: true, 
              chequePayTo: true, 
              addressInfo: true,
              enableForShippingMethods: true
            }
          },

          // 2. 🔥 FIX: PayPal Public Configs (SDK লোড করার জন্য জরুরি)
          paypalConfig: {
            select: {
                sandbox: true,
                liveClientId: true,    // Public Key (Safe)
                sandboxClientId: true, // Public Key (Safe)
                intent: true,
                // UI Settings
                buttonColor: true,
                buttonLabel: true,
                buttonShape: true,
                buttonLayout: true,
                payLaterMessaging: true,
                brandName: true
            }
          },

          // 3. 🔥 FIX: Stripe Public Configs (Elements লোড করার জন্য জরুরি)
          stripeConfig: {
            select: {
                testMode: true,
                livePublishableKey: true, // Public Key (Safe)
                testPublishableKey: true, // Public Key (Safe)
                // UI Settings
                applePayEnabled: true,
                googlePayEnabled: true,
                klarnaEnabled: true,
                afterpayEnabled: true,
                zipEnabled: true,
                buttonTheme: true
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
          weightUnit: true,
          dimensionUnit: true
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
        user: {
            ...dbUser,
            email: dbUser?.email || user?.emailAddresses[0]?.emailAddress,
            phone: dbUser?.phone || user?.phoneNumbers[0]?.phoneNumber
        },
        savedAddresses: dbUser?.addresses || [],
        paymentMethods,
        settings: storeSettings
      }
    };

  } catch (error) {
    console.error("Checkout Data Load Error:", error);
    return { success: false, error: "Failed to load checkout data." };
  }
}