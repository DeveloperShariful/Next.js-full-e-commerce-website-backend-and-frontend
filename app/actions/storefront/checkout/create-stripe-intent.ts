// File: app/actions/storefront/checkout/create-stripe-intent.ts
"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { getCheckoutSummary } from "./get-checkout-summary";
import Stripe from "stripe";

interface IntentParams {
    cartId: string;
    shippingMethodId?: string;
    couponCode?: string;
    address: {
        country: string;
        state: string;
        postcode: string;
        suburb: string;
    };
}

export async function createStripeIntent({ cartId, shippingMethodId, couponCode, address }: IntentParams) {
  try {
    // 1. Config Check
    const [methodConfig, storeSettings] = await Promise.all([
        db.paymentMethodConfig.findUnique({
            where: { identifier: "stripe" },
            include: { stripeConfig: true }
        }),
        db.storeSettings.findUnique({
            where: { id: "settings" },
            select: { currency: true }
        })
    ]);

    if (!methodConfig?.isEnabled || !methodConfig.stripeConfig) {
      return { success: false, error: "Stripe payments are currently disabled." };
    }

    // 2. Calculate Total (Secure)
    const summary = await getCheckoutSummary({ 
        cartId, 
        shippingAddress: address, 
        shippingMethodId, 
        couponCode 
    });

    if (!summary.success || !summary.breakdown) {
      return { success: false, error: "Failed to calculate order total." };
    }

    const finalAmount = summary.breakdown.total;

    if (finalAmount <= 0) {
        return { success: false, error: "Invalid order amount." };
    }

    // 3. Decrypt Key
    const config = methodConfig.stripeConfig;
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey;
    const secretKey = decrypt(encryptedKey ?? "");

    if (!secretKey) {
      return { success: false, error: "Stripe configuration error (Key missing)." };
    }

    // 4. Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    });

    // 5. Create Intent
    // ✅ FIX: Use Store Currency
    const currencyCode = (storeSettings?.currency || "aud").toLowerCase();
    const amountInCents = Math.round(finalAmount * 100); 

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currencyCode,
      automatic_payment_methods: { enabled: true },
      metadata: {
        cartId: cartId,
        orderType: "ecom_checkout",
        shippingMethod: summary.breakdown.shippingMethod,
        taxTotal: summary.breakdown.tax.toFixed(2)
      },
      capture_method: config.paymentAction === "CAPTURE" ? "automatic" : "manual",
    });

    return { 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      publishableKey: config.testMode ? config.testPublishableKey : config.livePublishableKey,
      amount: finalAmount
    };

  } catch (error: any) {
    console.error("Stripe Intent Error:", error);
    return { success: false, error: error.message || "Payment initialization failed." };
  }
}