// File: app/api/webhooks/stripe/route.ts

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature') as string;

  try {
    // ১. ডাটাবেজ থেকে এনক্রিপ্টেড Webhook Secret আনা
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: "stripe" } });
    if (!gateway?.encryptedWebhook || !gateway?.encryptedSecret) {
      throw new Error("Stripe webhook not configured.");
    }

    const webhookSecret = decrypt(gateway.encryptedWebhook);
    const secretKey = decrypt(gateway.encryptedSecret);
    const stripe = new Stripe(secretKey!, { apiVersion: "2025-01-27.acacia" as any });

    // ২. ইভেন্ট ভেরিফাই করা
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // ৩. পেমেন্ট সাকসেস ইভেন্ট হ্যান্ডেল করা
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.order_id;

      if (orderId) {
        console.log(`🔔 Stripe Webhook: Updating Order ${orderId}`);
        
        // ৪. ডাটাবেজ আপডেট (Idempotent - অর্থাৎ অলরেডি পেইড হলে আর কিছু করবে না)
        await db.$transaction(async (tx) => {
          const order = await tx.order.findUnique({ 
            where: { id: orderId }, 
            include: { items: true } 
          });

          if (order && order.paymentStatus !== 'PAID') {
            await tx.order.update({
              where: { id: orderId },
              data: {
                status: 'PROCESSING',
                paymentStatus: 'PAID',
                paymentId: paymentIntent.id,
                totalPaid: order.total,
                capturedAt: new Date(),
              }
            });

            // স্টক কমানো
            for (const item of order.items) {
              if (item.productId) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } }
                });
              }
            }
          }
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("STRIPE_WEBHOOK_ERROR:", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}