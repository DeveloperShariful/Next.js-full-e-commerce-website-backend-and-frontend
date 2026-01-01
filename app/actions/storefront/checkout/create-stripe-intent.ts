// app/actions/storefront/checkout/create-stripe-intent.ts
"use server"

import { db } from "@/lib/prisma"
import { decrypt } from "@/app/actions/admin/settings/payments/crypto" 
import { getCartCalculation } from "./get-cart-calculation" 
import Stripe from "stripe"

export async function createStripeIntent(cartId: string) {
  try {
    // ১. পেমেন্ট মেথড চেক
    const methodConfig = await db.paymentMethodConfig.findUnique({
      where: { identifier: "stripe" },
      include: { stripeConfig: true }
    })

    if (!methodConfig?.isEnabled || !methodConfig.stripeConfig) {
      return { success: false, error: "Stripe payments are disabled." }
    }

    // ২. কার্ট এবং কারেন্সি ক্যালকুলেশন
    const cartData = await getCartCalculation(cartId)
    if (!cartData.success || !cartData.total) {
      return { success: false, error: "Invalid cart total." }
    }

    // ৩. ডিক্রিপশন
    const config = methodConfig.stripeConfig
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey
    const secretKey = decrypt(encryptedKey ?? "")

    if (!secretKey) {
      return { success: false, error: "Stripe configuration error." }
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })

    // ৪. পেমেন্ট ইন্টেন্ট
    // Stripe Currency অবশ্যই Lowercase হতে হবে (aud, usd)
    const currencyCode = (cartData.currency || "aud").toLowerCase();
    const amountInCents = Math.round(cartData.total * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currencyCode,
      automatic_payment_methods: { enabled: true },
      metadata: {
        cartId: cartId, 
      },
      capture_method: config.paymentAction === "CAPTURE" ? "automatic" : "manual",
    })

    return { 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      publishableKey: config.testMode ? config.testPublishableKey : config.livePublishableKey
    }

  } catch (error: any) {
    console.error("Stripe Intent Error:", error)
    return { success: false, error: error.message || "Payment initialization failed." }
  }
}