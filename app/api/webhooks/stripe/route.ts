// app/api/webhook/stripe/route.ts

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/prisma';
import { Prisma, OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';
import { resyncOrderToTransdirect } from '@/app/actions/backend/order/transdirect-sync-order';
import { sendNotification } from '@/app/api/email/send-notification';
import { auditService } from '@/lib/audit-service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
  let webhookEventId: string | undefined;
  try {
    const body = await request.text();
    const headerList = await headers();
    const sig = headerList.get('stripe-signature') as string;

    const { secret, webhookSecret } = await getStripeConfig();
    const stripe = new Stripe(secret, { apiVersion: "2025-01-27.acacia" as unknown as Stripe.LatestApiVersion });

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
    webhookEventId = event.id;
    await db.paymentWebhookLog.upsert({
        where: { eventId: event.id },
        update: { processed: false, processingError: null },
        create: {
            provider: 'stripe',
            eventId: event.id,
            eventType: event.type,
            payload: event as unknown as Prisma.InputJsonValue
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
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { user: { select: { email: true } } },
      });

      if (!order) {
          console.error(`❌ [Stripe Webhook] Order #${orderId} not found in DB!`);
          return NextResponse.json({ received: true, error: "Order not found" });
      }

      // If Frontend already did the job
      if (order.status === OrderStatus.PROCESSING || order.paymentStatus === PaymentStatus.PAID) {
          // ✅ Backup: payment done but TransDirect not synced yet → resync
          if (order.transdirectOrderStatus !== 'booked') {
              console.log(`🔄 [Stripe Webhook] Order ${orderId} paid but not synced to TransDirect. Backup resync...`);
              resyncOrderToTransdirect(orderId).catch(err =>
                  console.error('[Stripe Webhook] Backup TransDirect resync failed:', err)
              );
          }
          await db.paymentWebhookLog.update({ where: { eventId: event.id }, data: { processed: true } });
          return NextResponse.json({ received: true, message: "Already processed by frontend" });
      }

      console.warn(`⏳ [Stripe Webhook] Frontend missed capture for Order #${orderId}. Rescuing...`);
      await sleep(3000); // 3 sec delay to prevent DB race conditions

      // 🛡️ 5. Fetch order items for stock decrement
      const rescueOrderItems = await db.orderItem.findMany({
        where: { orderId },
        select: { productId: true, variantId: true, quantity: true },
      });

      // 🛡️ 6. Database Transaction: order update + stock decrement
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PROCESSING,
            paymentStatus: PaymentStatus.PAID,
            paymentId: paymentIntent.id,
            totalPaid: capturedAmount,
            totalDue: 0,
            isCaptured: true,
            capturedAt: new Date(),
          },
        });
        await tx.orderTransaction.create({
          data: {
            orderId,
            gateway: 'stripe',
            type: TransactionType.SALE,
            amount: capturedAmount,
            transactionId: paymentIntent.id,
            status: paymentIntent.status,
            rawResponse: paymentIntent as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.orderNote.create({
          data: {
            orderId,
            content: `✅ Rescued via Stripe Webhook. TXN: ${paymentIntent.id}. Amount: $${capturedAmount}`,
            isSystem: true,
          },
        });
        for (const item of rescueOrderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          } else if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
            });
          }
        }
      });

      console.log(`🎉 [Stripe Webhook] Rescue Successful! Order #${orderId} updated.`);
      resyncOrderToTransdirect(orderId).catch(err =>
        console.error('[Stripe Webhook] TransDirect resync failed:', err)
      );

      // Email + Affiliate backup — duplicate-safe: order was PENDING before rescue,
      // so capture-order never ran these. If webhook fires again, order is now
      // PROCESSING and we return early at the top → these never run twice.
      const rescueEmail = order.guestEmail || order.user?.email;
      if (rescueEmail) {
        sendNotification({ trigger: 'ORDER_PROCESSING', recipient: rescueEmail, orderId })
          .catch(err => console.error('[Stripe Webhook] Customer email failed:', err));
      }
      sendNotification({ trigger: 'ORDER_CREATED_ADMIN', recipient: '', orderId })
        .catch(err => console.error('[Stripe Webhook] Admin email failed:', err));

      if (process.env.INTERNAL_API_KEY) {
        fetch(`${APP_URL}/api/affiliate/process-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.INTERNAL_API_KEY },
          body: JSON.stringify({ orderId }),
        }).catch(err => console.error('[Stripe Webhook] Affiliate trigger failed:', err));
      }

      // Analytics backup — only runs here because frontend capture-order failed
      // (duplicate-safe: if capture-order succeeded, order is already PROCESSING and we returned early above)
      const rescuedOrder = await db.order.findUnique({
        where: { id: orderId },
        select: { subtotal: true, discountTotal: true, taxTotal: true, shippingTotal: true, isFirstOrder: true },
      });
      const rescueItems = await db.orderItem.findMany({
        where: { orderId },
        select: { productId: true, quantity: true, total: true },
      });
      if (rescuedOrder && rescueItems.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sub = Number(rescuedOrder.subtotal);
        const disc = Number(rescuedOrder.discountTotal);
        const tax = Number(rescuedOrder.taxTotal);
        const ship = Number(rescuedOrder.shippingTotal);
        const totalSold = rescueItems.reduce((s, i) => s + i.quantity, 0);
        Promise.allSettled([
          db.analytics.upsert({
            where: { date: today },
            create: { date: today, grossSales: sub, netSales: sub - disc, totalTax: tax, totalShipping: ship, totalDiscounts: disc, totalOrders: 1, productsSold: totalSold, newCustomers: rescuedOrder.isFirstOrder ? 1 : 0, returningCustomers: rescuedOrder.isFirstOrder ? 0 : 1 },
            update: { grossSales: { increment: sub }, netSales: { increment: sub - disc }, totalTax: { increment: tax }, totalShipping: { increment: ship }, totalDiscounts: { increment: disc }, totalOrders: { increment: 1 }, productsSold: { increment: totalSold }, newCustomers: { increment: rescuedOrder.isFirstOrder ? 1 : 0 }, returningCustomers: { increment: rescuedOrder.isFirstOrder ? 0 : 1 } },
          }),
          ...rescueItems.filter(i => !!i.productId).map(({ productId, quantity, total }) =>
            db.productAnalytics.upsert({
              where: { date_productId: { date: today, productId: productId! } },
              create: { date: today, productId: productId!, itemsSold: quantity, netSales: Number(total) },
              update: { itemsSold: { increment: quantity }, netSales: { increment: Number(total) } },
            })
          ),
        ]).catch(err => console.error('[Stripe Webhook] Analytics rescue failed:', err));
      }
    }

    // 🛡️ 6. payment_intent.payment_failed — with full decline reason
    else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
            // BEFORE: note only had TXN id — admin couldn't see WHY it failed.
            // AFTER: includes decline code + error code for actionable diagnosis.
            const failErr   = paymentIntent.last_payment_error;
            const failMsg   = failErr?.message ?? 'Unknown reason';
            const failCode  = failErr?.code     ? ` | Code: ${failErr.code}` : '';
            const decCode   = failErr?.decline_code ? ` | Decline: ${failErr.decline_code}` : '';
            const pmType    = failErr?.payment_method?.type ? ` | Method: ${failErr.payment_method.type}` : '';
            const fullReason = `${failMsg}${failCode}${decCode}${pmType}`;

            await db.$transaction([
                db.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.FAILED, paymentStatus: PaymentStatus.UNPAID },
                }),
                db.orderNote.create({
                    data: {
                        orderId,
                        content: `❌ Stripe payment failed — ${fullReason} | TXN: ${paymentIntent.id}`,
                        isSystem: true,
                    },
                }),
            ]).catch(err => console.error('[Stripe Webhook] FAILED update error:', err));
        }
    }

    // 🛡️ 7. payment_intent.canceled — PI cancelled (3DS abandoned, user quit)
    else if (event.type === 'payment_intent.canceled') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
            const cancelReason = paymentIntent.cancellation_reason ?? 'unknown';
            await db.$transaction([
                db.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.FAILED, paymentStatus: PaymentStatus.UNPAID },
                }),
                db.orderNote.create({
                    data: {
                        orderId,
                        content: `🚫 Payment cancelled — Reason: ${cancelReason} | TXN: ${paymentIntent.id}`,
                        isSystem: true,
                    },
                }),
            ]).catch(err => console.error('[Stripe Webhook] CANCELED update error:', err));
        }
    }

    // 🛡️ 8. charge.refunded — refund issued from Stripe dashboard
    // Syncs order status automatically so admin doesn't have to update manually.
    else if (event.type === 'charge.refunded') {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

        if (piId) {
            const order = await db.order.findFirst({ where: { paymentId: piId } });
            if (order) {
                const refundedAmount = charge.amount_refunded / 100;
                const isFullRefund   = charge.refunded; // true = 100% refunded
                await db.$transaction([
                    db.order.update({
                        where: { id: order.id },
                        data: {
                            status: isFullRefund ? OrderStatus.REFUNDED : order.status,
                            paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : order.paymentStatus,
                        },
                    }),
                    db.orderNote.create({
                        data: {
                            orderId: order.id,
                            content: `💰 Refund processed via Stripe: $${refundedAmount.toFixed(2)} (${isFullRefund ? 'Full refund' : 'Partial refund'})`,
                            isSystem: true,
                        },
                    }),
                ]).catch(err => console.error('[Stripe Webhook] Refund sync error:', err));
            }
        }
    }

    // 🛡️ 9. charge.dispute.created — CHARGEBACK! Money taken back automatically.
    // Critical: admin must respond within dispute.evidence_details.due_by deadline.
    else if (event.type === 'charge.dispute.created') {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

        if (chargeId) {
            // Find order via the transaction ledger (transactionId = Stripe charge ID or PI ID)
            const txn = await db.orderTransaction.findFirst({
                where: { OR: [{ transactionId: chargeId }, { transactionId: dispute.payment_intent as string | undefined ?? '' }] },
                select: { orderId: true },
            });

            if (txn?.orderId) {
                const amount     = (dispute.amount / 100).toFixed(2);
                const dueDate    = dispute.evidence_details?.due_by
                    ? new Date((dispute.evidence_details.due_by as number) * 1000).toLocaleDateString('en-AU')
                    : 'Unknown';

                // OrderStatus.DISPUTED is not in the Prisma schema enum.
                // Do not change status — order remains PROCESSING so fulfilment isn't blocked.
                // Admin is alerted via OrderNote + CRITICAL SystemLog below.
                await db.orderNote.create({
                    data: {
                        orderId: txn.orderId,
                        content: `⚠️ CHARGEBACK FILED — Reason: ${dispute.reason} | Amount: $${amount} | Status: ${dispute.status} | Respond by: ${dueDate} | Dispute ID: ${dispute.id}`,
                        isSystem: true,
                    },
                }).catch(err => console.error('[Stripe Webhook] Dispute note error:', err));

                // CRITICAL system alert — appears in admin SystemLog immediately
                auditService.systemLog(
                    'CRITICAL',
                    'STRIPE_CHARGEBACK',
                    `⚠️ Chargeback on order ${txn.orderId} — $${amount} — Respond by ${dueDate}`,
                    { orderId: txn.orderId, disputeId: dispute.id, reason: dispute.reason, amount, dueDate }
                ).catch(() => {});
            }
        }
    }

    // Mark as processed
    await db.paymentWebhookLog.update({ where: { eventId: event.id }, data: { processed: true } });

    return NextResponse.json({ received: true });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ [Stripe Webhook Critical Error]:", error);
    if (webhookEventId) {
      await db.paymentWebhookLog.update({
        where: { eventId: webhookEventId },
        data: { processingError: errMsg, retryCount: { increment: 1 } },
      }).catch(() => {});
    }
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}