// File: app/actions/storefront/checkout/create-stripe-intent.ts
"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { getCheckoutSummary } from "./get-checkout-summary"; // 🔥 Secure Calculation
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
    // ১. পেমেন্ট মেথড কনফিগারেশন চেক (Enabled কি না)
    const methodConfig = await db.paymentMethodConfig.findUnique({
      where: { identifier: "stripe" },
      include: { stripeConfig: true }
    });

    if (!methodConfig?.isEnabled || !methodConfig.stripeConfig) {
      return { success: false, error: "Stripe payments are currently disabled." };
    }

    // ২. সার্ভার সাইড ক্যালকুলেশন (Security Check 🔒)
    // আমরা ক্লায়েন্টের পাঠানো totals বিশ্বাস করব না। এখানে সার্ভার নিজে হিসাব করবে।
    const summary = await getCheckoutSummary({ 
        cartId, 
        shippingAddress: address, 
        shippingMethodId, 
        couponCode 
    });

    // ক্যালকুলেশন ফেইল করলে বা ব্রেকডাউন না থাকলে এরর দিব
    if (!summary.success || !summary.breakdown) {
      return { success: false, error: "Failed to calculate order total." };
    }

    const finalAmount = summary.breakdown.total;

    // যদি টোটাল ০ বা তার কম হয়, পেমেন্ট তৈরি করা যাবে না
    if (finalAmount <= 0) {
        return { success: false, error: "Invalid order amount." };
    }

    // ৩. সিক্রেট কি ডিক্রিপশন
    const config = methodConfig.stripeConfig;
    const encryptedKey = config.testMode ? config.testSecretKey : config.liveSecretKey;
    const secretKey = decrypt(encryptedKey ?? "");

    if (!secretKey) {
      return { success: false, error: "Stripe configuration error (Key missing)." };
    }

    // ৪. স্ট্রাইপ ইনিশিলাইজেশন
    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any, // আপনার ভার্সন অনুযায়ী টাইপ কাস্টিং
      typescript: true,
    });

    // ৫. পেমেন্ট ইন্টেন্ট তৈরি
    // Stripe Currency অবশ্যই Lowercase হতে হবে (যেমন: aud, usd)
    const currencyCode = (summary.currency || "aud").toLowerCase();
    
    // Stripe সেন্টস (Cents) এ অ্যামাউন্ট নেয় (যেমন: $10.00 = 1000 cents)
    const amountInCents = Math.round(finalAmount * 100); 

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currencyCode,
      automatic_payment_methods: { enabled: true },
      metadata: {
        cartId: cartId,
        orderType: "ecom_checkout",
        shippingMethod: summary.breakdown.shippingMethod
      },
      // কনফিগ অনুযায়ী টাকা সাথে সাথে কাটবে নাকি হোল্ড করবে
      capture_method: config.paymentAction === "CAPTURE" ? "automatic" : "manual",
    });

    // ৬. ক্লায়েন্টে সিক্রেট এবং কি পাঠানো
    return { 
      success: true, 
      clientSecret: paymentIntent.client_secret,
      publishableKey: config.testMode ? config.testPublishableKey : config.livePublishableKey,
      amount: finalAmount // ফ্রন্টএন্ডে দেখানোর জন্য পাঠানো হলো (অপশনাল)
    };

  } catch (error: any) {
    console.error("Stripe Intent Error:", error);
    return { success: false, error: error.message || "Payment initialization failed." };
  }
}