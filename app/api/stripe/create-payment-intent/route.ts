// File: app/api/stripe/create-payment-intent/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, orderId, cartItems, customerInfo, appliedCoupons } = body;

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    // ১. ডাটাবেজ থেকে Stripe কনফিগারেশন আনা
    const gateway = await db.paymentGateway.findUnique({
      where: { identifier: "stripe" }
    });

    if (!gateway || !gateway.encryptedSecret) {
      return NextResponse.json({ error: "Stripe is not configured in Admin Settings." }, { status: 500 });
    }

    // ২. সিক্রেট কি ডিক্রিপ্ট করা (Encryption Logic)
    const secretKey = decrypt(gateway.encryptedSecret);
    if (!secretKey) throw new Error("Failed to decrypt Stripe keys.");

    const stripe = new Stripe(secretKey, {
      apiVersion: "2025-01-27.acacia" as any,
    });

    // ৩. মেটাডেটা প্রিপারেশন (ট্র্যাকিং এবং ওয়েব হুকের জন্য)
    const metadata: Record<string, string> = {
      order_id: orderId?.toString() || "",
      customer_email: customerInfo?.email || "",
      customer_name: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim()
    };

    // ৪. Stripe Payment Intent তৈরি করা
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Cents এ কনভার্ট করা হলো
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: metadata,
      description: orderId ? `Order #${orderId} - GOBIKE` : "GOBIKE Checkout Payment",
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: unknown) {
    console.error("[STRIPE_INTENT_ERROR]:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}