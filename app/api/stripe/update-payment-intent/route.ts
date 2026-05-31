// File: app/api/stripe/update-payment-intent/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, amount, orderId, cartItems, customerInfo, shippingInfo, metadata: incomingMetadata, appliedCoupons } = body;

    // ১. ভ্যালিডেশন: পেমেন্ট ইন্টেন্ট আইডি না থাকলে আপডেট করা সম্ভব নয়
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing Payment Intent ID.' }, { status: 400 });
    }

    // ২. ডাটাবেজ থেকে Stripe কনফিগারেশন আনা
    const gateway = await db.paymentGateway.findUnique({
      where: { identifier: "stripe" }
    });

    if (!gateway || !gateway.encryptedSecret) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    // ৩. সিক্রেট কি ডিক্রিপ্ট করা
    const secretKey = decrypt(gateway.encryptedSecret);
    const stripe = new Stripe(secretKey!, {
      apiVersion: "2025-01-27.acacia" as any,
    });

    const updateData: Stripe.PaymentIntentUpdateParams = {};

    // ৪. যদি নতুন অ্যামাউন্ট আসে, তবে সেটি আপডেট করা
    if (amount && typeof amount === 'number' && amount > 0) {
      updateData.amount = Math.round(amount * 100); // Stripe cents এ কাজ করে
    }
    
    // ৫. মেটাডেটা আপডেট করা (ট্র্যাকিং এবং ওয়েব হুকের জন্য)
    const metadata: Record<string, string> = { ...incomingMetadata };

    if (orderId) {
      metadata.order_id = orderId.toString();
      updateData.description = `Order #${orderId} - GOBIKE Updated`; 
    }

    if (customerInfo) {
        metadata.customer_email = customerInfo.email || '';
        metadata.customer_name = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();
        // JSON ডাটা স্ট্রিং আকারে মেটাডেটায় রাখা হচ্ছে (Stripe-এর লিমিট ৫০০ ক্যারেক্টার)
        metadata.billing_json = JSON.stringify(customerInfo).substring(0, 499); 
    }

    if (shippingInfo) {
        metadata.shipping_json = JSON.stringify(shippingInfo).substring(0, 499);
    }
    
    if (cartItems && Array.isArray(cartItems)) {
        const simplifiedCart = cartItems.map((item: any) => ({
            id: item.id || item.databaseId,
            qty: item.quantity,
        }));
        metadata.cart_items_json = JSON.stringify(simplifiedCart).substring(0, 499);
    }

    // কুপন ডাটা মেটাডেটায় সেভ করা হচ্ছে
    if (appliedCoupons && Array.isArray(appliedCoupons) && appliedCoupons.length > 0) {
        const simplifiedCoupons = appliedCoupons.map((c: any) => ({ code: c.code }));
        metadata.applied_coupons_json = JSON.stringify(simplifiedCoupons).substring(0, 499);
    }

    if (Object.keys(metadata).length > 0) {
        updateData.metadata = metadata;
    }

    // ৬. Stripe API কল করে পেমেন্ট ইন্টেন্ট আপডেট করা
    await stripe.paymentIntents.update(paymentIntentId, updateData);
    
    return NextResponse.json({ success: true, message: "Payment intent updated." });

  } catch (error: unknown) {
    console.error("[UPDATE_PAYMENT_INTENT_ERROR]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}