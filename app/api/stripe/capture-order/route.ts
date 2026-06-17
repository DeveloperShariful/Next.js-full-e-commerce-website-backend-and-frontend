// app/api/stripe/capture-order/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';
import { sendNotification } from '@/app/api/email/send-notification';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// DYNAMIC STRIPE CREDENTIALS FROM DB
// ============================================================================
async function getStripeInstance() {
  const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'stripe' } });
  if (!gateway || !gateway.encryptedSecret) {
    throw new Error('Stripe is not configured in the Admin Panel.');
  }
  const secret = decrypt(gateway.encryptedSecret);
  return new Stripe(secret, { apiVersion: '2025-01-27.acacia' as any, typescript: true });
}

// ============================================================================
// MAIN POST REQUEST
// ============================================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentIntentId } = body as {
      orderId: string;
      paymentIntentId: string;
    };

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters.' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Stripe Capture] Verifying PI: ${paymentIntentId} for Order: ${orderId}`);

    const stripe = await getStripeInstance();

    // ── 1. Retrieve Payment Intent from Stripe ────────────────
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError: unknown) {
      const msg = stripeError instanceof Error ? stripeError.message : 'Failed to fetch intent';
      return NextResponse.json({ success: false, message: `Stripe Error: ${msg}` }, { status: 400 });
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, message: `Payment not successful. Status: '${paymentIntent.status}'.` },
        { status: 402 }
      );
    }

    // ── 2. Security: validate metadata order ID ───────────────
    const metadataOrderId = paymentIntent.metadata?.order_id;
    if (metadataOrderId && String(metadataOrderId) !== String(orderId)) {
      console.error(`🚨 [SECURITY] Order ID mismatch! Requested: ${orderId}, Metadata: ${metadataOrderId}`);
      return NextResponse.json(
        { success: false, message: 'Security check failed: Order ID mismatch.' },
        { status: 403 }
      );
    }

    // ── 3. Fetch current order from DB ────────────────────────
    const currentOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, message: 'Order not found in the database.' },
        { status: 404 }
      );
    }

    // Race condition guard — already processed
    if (
      currentOrder.status === OrderStatus.PROCESSING ||
      currentOrder.status === OrderStatus.DELIVERED
    ) {
      console.log(`✅ [Stripe Capture] Order ${orderId} already ${currentOrder.status}. Skipping.`);
      return NextResponse.json({ success: true, orderId: currentOrder.id, message: 'Already processed' });
    }

    const capturedAmount = paymentIntent.amount_received / 100;

    // ── 4. Fetch order items (for stock decrement + analytics) ─
    const orderItems = await db.orderItem.findMany({
      where: { orderId },
      select: { productId: true, variantId: true, quantity: true, total: true },
    });

    // ── 5. DB Transaction: update order + log + note + stock ──
    // ✅ FIX: Stock is decremented HERE — inside the atomic transaction that marks
    // the order as PAID. This guarantees stock only decrements on confirmed payments.
    //
    // Before: stripe/create-order decremented stock at order CREATION (before payment).
    //         If payment failed, stock was permanently lost.
    // After:  stripe/create-order creates the order (no stock change).
    //         stripe/capture-order decrements stock atomically with PAID status.
    //         Failed/abandoned orders → InventoryReservation expires → stock available again.
    await db.$transaction(async (tx) => {
      // A. Mark order as PROCESSING / PAID
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

      // B. Transaction ledger entry
      await tx.orderTransaction.create({
        data: {
          orderId,
          gateway: 'stripe',
          type: TransactionType.SALE,
          amount: capturedAmount,
          transactionId: paymentIntent.id,
          status: paymentIntent.status,
          rawResponse: paymentIntent as any,
        },
      });

      // C. Order note
      await tx.orderNote.create({
        data: {
          orderId,
          content: `✅ Stripe payment successful. Transaction ID: ${paymentIntent.id}. Amount: $${capturedAmount}.`,
          isSystem: true,
        },
      });

      // D. Decrement stock for each ordered item (variant or product)
      for (const item of orderItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
        }
      }
    });

    console.log(`🎉 [Stripe Capture] Order ${orderId} → PROCESSING. Stock decremented.`);

    // ── 6. Post-capture side-effects (fire-and-forget) ────────
    // Confirmation emails
    const customerEmail = currentOrder.user?.email || currentOrder.guestEmail;
    if (customerEmail) {
      sendNotification({
        trigger: 'ORDER_PROCESSING',
        recipient: customerEmail,
        orderId,
      }).catch(err => console.error('[Stripe Capture] Customer email failed:', err));
    }
    sendNotification({
      trigger: 'ORDER_CREATED_ADMIN',
      recipient: '',
      orderId,
    }).catch(err => console.error('[Stripe Capture] Admin email failed:', err));

    // Affiliate commission
    fetch(`${APP_URL}/api/affiliate/process-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_KEY!,
      },
      body: JSON.stringify({ orderId }),
    }).catch(err => console.error('[Stripe Capture] Affiliate trigger failed:', err));

    // ── 7. Analytics update ───────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subtotal = Number(currentOrder.subtotal);
    const discountTotal = Number(currentOrder.discountTotal);
    const taxTotal = Number(currentOrder.taxTotal);
    const shippingCost = Number(currentOrder.shippingTotal);
    const isFirstOrder = currentOrder.isFirstOrder;
    const totalItemsSold = orderItems.reduce((sum, i) => sum + i.quantity, 0);

    await Promise.allSettled([
      db.analytics.upsert({
        where: { date: today },
        create: {
          date: today,
          grossSales: subtotal,
          netSales: subtotal - discountTotal,
          totalTax: taxTotal,
          totalShipping: shippingCost,
          totalDiscounts: discountTotal,
          totalOrders: 1,
          productsSold: totalItemsSold,
          newCustomers: isFirstOrder ? 1 : 0,
          returningCustomers: isFirstOrder ? 0 : 1,
        },
        update: {
          grossSales: { increment: subtotal },
          netSales: { increment: subtotal - discountTotal },
          totalTax: { increment: taxTotal },
          totalShipping: { increment: shippingCost },
          totalDiscounts: { increment: discountTotal },
          totalOrders: { increment: 1 },
          productsSold: { increment: totalItemsSold },
          newCustomers: { increment: isFirstOrder ? 1 : 0 },
          returningCustomers: { increment: isFirstOrder ? 0 : 1 },
        },
      }),
      ...orderItems
        .filter(i => !!i.productId)
        .map(({ productId, quantity, total }) =>
          db.productAnalytics.upsert({
            where: { date_productId: { date: today, productId: productId! } },
            create: {
              date: today,
              productId: productId!,
              itemsSold: quantity,
              netSales: Number(total),
            },
            update: {
              itemsSold: { increment: quantity },
              netSales: { increment: Number(total) },
            },
          })
        ),
    ]);

    return NextResponse.json({ success: true, orderId });

  } catch (error: unknown) {
    console.error('🔥 [Stripe Capture Critical Error]:', error);
    const message = error instanceof Error
      ? error.message
      : 'An internal server error occurred while capturing the order.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}