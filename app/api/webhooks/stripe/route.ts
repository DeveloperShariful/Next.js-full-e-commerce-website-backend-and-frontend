// app/api/webhook/stripe/route.ts

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';
import { syncOrderToTransdirect } from '@/app/actions/backend/order/transdirect-sync-order';

export const maxDuration = 60; 

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// DYNAMIC STRIPE CONFIGURATION FROM DB
// ==========================================
async function getStripeConfig() {
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'stripe' } });
    if (!gateway || !gateway.encryptedSecret || !gateway.encryptedWebhook) {
        throw new Error("Stripe or Webhook is not configured in DB.");
    }
    const secret = decrypt(gateway.encryptedSecret);
    const webhookSecret = decrypt(gateway.encryptedWebhook);
    return { secret, webhookSecret };
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headerList = await headers();
    const sig = headerList.get('stripe-signature') as string;

    const { secret, webhookSecret } = await getStripeConfig();
    const stripe = new Stripe(secret, { apiVersion: "2025-01-27.acacia" as any, typescript: true });

    let event: Stripe.Event;

    // 🛡️ 1. Verify the Webhook Signature dynamically
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`❌ [Stripe Webhook Error] Signature Verification Failed: ${errMsg}`);
      return NextResponse.json({ error: `Webhook Error: ${errMsg}` }, { status: 400 });
    }

    // 🛡️ 2. Log Webhook Event to DB
    await db.paymentWebhookLog.upsert({
        where: { eventId: event.id },
        update: { processed: false },
        create: {
            provider: 'stripe',
            eventId: event.id,
            eventType: event.type,
            payload: event as any
        }
    });

    console.log(`🔔 [Stripe Webhook] Received Event: ${event.type}`);

    // 🛡️ 3. Process payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.order_id;
      const capturedAmount = paymentIntent.amount_received / 100;

      if (!orderId) {
          console.warn(`⚠️ [Stripe Webhook] No Order ID in metadata for PI: ${paymentIntent.id}.`);
          return NextResponse.json({ received: true, message: "No Order ID in metadata." });
      }

      // 🛡️ 4. Check Database Status
      const order = await db.order.findUnique({ where: { id: orderId } });

      if (!order) {
          console.error(`❌ [Stripe Webhook] Order #${orderId} not found in DB!`);
          return NextResponse.json({ received: true, error: "Order not found" });
      }

      // If Frontend already did the job
      if (order.status === OrderStatus.PROCESSING || order.paymentStatus === PaymentStatus.PAID) {
          await db.paymentWebhookLog.update({ where: { eventId: event.id }, data: { processed: true } });
          return NextResponse.json({ received: true, message: "Already processed by frontend" });
      }

      console.warn(`⏳ [Stripe Webhook] Frontend missed capture for Order #${orderId}. Rescuing...`);
      await sleep(3000); // 3 sec delay to prevent DB race conditions

      // 🛡️ 5. Database Transaction Update
      await db.$transaction([
          db.order.update({
              where: { id: orderId },
              data: {
                  status: OrderStatus.PROCESSING,
                  paymentStatus: PaymentStatus.PAID,
                  paymentId: paymentIntent.id,
                  totalPaid: capturedAmount,
                  totalDue: 0,
                  isCaptured: true,
                  capturedAt: new Date(),
              }
          }),
          db.orderTransaction.create({
              data: {
                  orderId: orderId,
                  gateway: 'stripe',
                  type: TransactionType.SALE,
                  amount: capturedAmount,
                  transactionId: paymentIntent.id,
                  status: paymentIntent.status,
                  rawResponse: paymentIntent as any
              }
          }),
          db.orderNote.create({
              data: {
                  orderId: orderId,
                  content: `✅ Rescued via Stripe Webhook. TXN: ${paymentIntent.id}. Amount: $${capturedAmount}`,
                  isSystem: true
              }
          })
      ]);

      console.log(`🎉 [Stripe Webhook] Rescue Successful! Order #${orderId} updated.`);
      await syncOrderToTransdirect(orderId);
    }

    // 🛡️ 6. Process payment_intent.payment_failed
    else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
            await db.order.update({ where: { id: orderId }, data: { status: OrderStatus.FAILED, paymentStatus: PaymentStatus.UNPAID } });
            await db.orderNote.create({ data: { orderId: orderId, content: `❌ Stripe payment failed. TXN: ${paymentIntent.id}`, isSystem: true } });
        }
    }

    // Mark as processed
    await db.paymentWebhookLog.update({ where: { eventId: event.id }, data: { processed: true } });

    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    console.error("❌ [Stripe Webhook Critical Error]:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}