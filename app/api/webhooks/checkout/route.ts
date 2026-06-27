// app/api/webhooks/checkout/route.ts

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from 'stripe';
import { db } from "@/lib/prisma";
import { Prisma, OrderStatus, PaymentStatus } from "@prisma/client";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";
import { auditService } from "@/lib/audit-service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const maxDuration = 60;

// ============================================================================
// DYNAMIC STRIPE CREDENTIALS FROM DB
// Reads both the secret key (for signature verification) and the webhook
// signing secret (encryptedWebhook), with env-var fallback for legacy setups.
// ============================================================================
async function getStripeConfig() {
  const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'stripe' } });
  if (!gateway || !gateway.encryptedSecret) throw new Error('Stripe not configured in Admin Panel.');
  const secret = decrypt(gateway.encryptedSecret);
  const webhookSecret = gateway.encryptedWebhook
    ? decrypt(gateway.encryptedWebhook)
    : (process.env.STRIPE_WEBHOOK_SECRET ?? null);
  return {
    stripe: new Stripe(secret),
    webhookSecret,
  };
}

export async function POST(req: Request) {
  let eventId: string | undefined;

  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    const { stripe, webhookSecret } = await getStripeConfig();

    // ── 1. Verify Stripe webhook signature ────────────────────────────────
    // BEFORE: only checked if header existed but never verified the HMAC.
    // AFTER:  uses stripe.webhooks.constructEvent for full signature verification.
    let event: Stripe.Event;
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (verifyErr: unknown) {
        const msg = verifyErr instanceof Error ? verifyErr.message : 'Signature mismatch';
        console.error(`❌ [Stripe Webhook] Signature verification failed: ${msg}`);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      if (webhookSecret && !signature) {
        return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 });
      }
      // No webhook secret configured — parse raw (dev/test without stripe-cli)
      event = JSON.parse(body) as Stripe.Event;
    }

    eventId = event.id;
    console.log(`🔔 [Stripe Webhook] Event: ${event.type} | ID: ${eventId}`);

    // ── 2. Idempotency — log and deduplicate ─────────────────────────────
    const existing = await db.paymentWebhookLog.findUnique({ where: { eventId } });
    if (existing?.processed) {
      return NextResponse.json({ message: "Already processed" });
    }
    if (!existing) {
      await db.paymentWebhookLog.create({
        data: {
          provider: 'stripe',
          eventId,
          eventType: event.type,
          payload: event as unknown as Prisma.InputJsonValue,
          processed: false,
        },
      });
    }

    // ── 3. payment_intent.succeeded → full order capture ─────────────────
    // BEFORE: only set paymentStatus=PAID. Missing: status→PROCESSING, stock
    //         decrement, emails, analytics. Order stuck in limbo on page refresh.
    // AFTER:  delegates to /api/stripe/capture-order which has complete logic +
    //         its own idempotency guard (safe if frontend already captured).
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;

      if (orderId) {
        console.log(`🔄 [Stripe Webhook] PI succeeded → capturing order ${orderId}...`);
        await fetch(`${APP_URL}/api/stripe/capture-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentIntentId: pi.id }),
        }).catch(err => console.error('[Stripe Webhook] capture-order call failed:', err));
      }
    }

    // ── 4. payment_intent.payment_failed → mark order FAILED ─────────────
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;
      const failReason = pi.last_payment_error?.message ?? 'Payment declined';

      if (orderId) {
        await db.$transaction([
          db.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.FAILED, paymentStatus: PaymentStatus.UNPAID },
          }),
          db.orderNote.create({
            data: { orderId, content: `❌ Payment failed: ${failReason}`, isSystem: true },
          }),
        ]).catch(err => console.error('[Stripe Webhook] FAILED update error:', err));
      }
    }

    // ── 5. Mark webhook as processed ─────────────────────────────────────
    await db.paymentWebhookLog.update({ where: { eventId }, data: { processed: true } });
    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ [Stripe Webhook Error]:", error);
    await auditService.systemLog("ERROR", "STRIPE_WEBHOOK", "Stripe webhook handler failed", { error: errMsg });
    if (eventId) {
      await db.paymentWebhookLog.update({
        where: { eventId },
        data: { processingError: errMsg, retryCount: { increment: 1 } },
      }).catch(() => {});
    }
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
