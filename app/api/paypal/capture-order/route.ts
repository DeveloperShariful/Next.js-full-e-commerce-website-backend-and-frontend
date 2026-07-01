// app/api/paypal/capture-order/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { safeDecrypt } from '@/app/actions/backend/settings/payments/crypto';
import { sendNotification } from '@/app/api/email/send-notification';
import { syncOrderToTransdirect } from '@/app/actions/backend/order/transdirect-sync-order';
import { logActivity } from '@/lib/activity-logger';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// DYNAMIC PAYPAL CREDENTIALS FROM DB
// ============================================================================
async function getPayPalCredentials() {
  const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'paypal' } });
  if (!gateway) throw new Error('PayPal is not configured.');
  const secret = safeDecrypt(gateway.encryptedSecret!);
  if (!secret) throw new Error('PayPal secret key is invalid — please re-enter it in Admin → Settings → Payments.');
  const apiUrl = gateway.mode === 'TEST'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  return { clientId: gateway.publicKey, secret, apiUrl };
}

async function generatePayPalAccessToken() {
  const { clientId, secret, apiUrl } = await getPayPalCredentials();
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!response.ok) throw new Error('Failed to generate PayPal access token');
  const data = await response.json();
  return { token: String(data.access_token), apiUrl };
}

export async function POST(request: Request) {
  try {
    const { paypalOrderId, wcOrderId } = await request.json() as {
      paypalOrderId: string;
      wcOrderId: string;
    };

    if (!paypalOrderId || !wcOrderId) {
      return NextResponse.json({ error: 'Missing required IDs' }, { status: 400 });
    }

    // ── 1. Race condition check ───────────────────────────────
    const order = await db.order.findUnique({
      where: { id: wcOrderId },
      include: { user: { select: { email: true } } },
    });
    if (!order) throw new Error('Order not found in database.');

    if (
      order.status === OrderStatus.PROCESSING ||
      order.paymentStatus === PaymentStatus.PAID
    ) {
      console.log(`[PayPal Capture] Order ${wcOrderId} already paid. Skipping.`);
      return NextResponse.json({
        success: true,
        status: 'COMPLETED',
        message: 'Payment already processed.',
      });
    }

    const { token, apiUrl } = await generatePayPalAccessToken();

    // ── 2. Capture with idempotency key ──────────────────────
    const captureResponse = await fetch(
      `${apiUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'PayPal-Request-Id': `capture_order_${wcOrderId}_${paypalOrderId}`,
        },
      }
    );

    const captureData = await captureResponse.json();
    let captureDetails: any = null;

    if (!captureResponse.ok) {
      const alreadyCaptured = captureData.details?.some(
        (d: any) => d.issue === 'ORDER_ALREADY_CAPTURED'
      );

      if (alreadyCaptured) {
        // Fetch the existing capture from PayPal
        const getOrderRes = await fetch(`${apiUrl}/v2/checkout/orders/${paypalOrderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedOrder = await getOrderRes.json();
        captureDetails = fetchedOrder.purchase_units?.[0]?.payments?.captures?.[0];
        if (!captureDetails) throw new Error('Could not retrieve capture details from PayPal.');
      } else {
        const isDeclined = captureData.details?.some(
          (d: any) => d.issue === 'INSTRUMENT_DECLINED'
        );
        await db.order.update({
          where: { id: wcOrderId },
          data: { status: OrderStatus.FAILED, paymentStatus: PaymentStatus.UNPAID },
        });
        logActivity({
          action: 'CHECKOUT_PAYMENT_FAILED',
          entityType: 'Order',
          entityId: wcOrderId,
          details: { gateway: 'paypal', reason: isDeclined ? 'INSTRUMENT_DECLINED' : 'CAPTURE_FAILED' },
          userId: order.userId ?? undefined,
        }).catch(() => {});
        return NextResponse.json({
          success: false,
          status: 'FAILED',
          message: isDeclined ? 'Card declined.' : 'Payment could not be captured.',
        });
      }
    } else {
      captureDetails = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    }

    // ── 3. Extract capture data ───────────────────────────────
    const paymentStatus = String(captureDetails?.status || 'UNKNOWN');
    const transactionId = String(captureDetails?.id || paypalOrderId);
    const capturedAmount = parseFloat(captureDetails?.amount?.value || '0');

    // ── 4. Fraud check — amount mismatch ─────────────────────
    const expectedAmount = Number(order.total);
    const isAmountMismatch = Math.abs(expectedAmount - capturedAmount) > 0.05;

    // ── 5. Determine final statuses ───────────────────────────
    let finalOrderStatus: OrderStatus = OrderStatus.PENDING;
    let finalPaymentStatus: PaymentStatus = PaymentStatus.UNPAID;
    let successResponse = false;
    let frontendMessage = '';
    let noteContent = '';

    if (isAmountMismatch) {
      finalOrderStatus = OrderStatus.PENDING;
      finalPaymentStatus = PaymentStatus.AUTHORIZED;
      successResponse = false;
      frontendMessage = 'Payment captured but amount mismatched. Order is under review.';
      noteContent = `⚠️ Fraud Alert: PayPal captured $${capturedAmount}, but order total was $${expectedAmount}. TXN: ${transactionId}.`;
    } else if (paymentStatus === 'COMPLETED') {
      finalOrderStatus = OrderStatus.PROCESSING;
      finalPaymentStatus = PaymentStatus.PAID;
      successResponse = true;
      frontendMessage = 'Payment successful.';
      noteContent = `✅ PayPal payment completed. Transaction ID: ${transactionId}.`;
    } else if (paymentStatus === 'PENDING') {
      finalOrderStatus = OrderStatus.PENDING;
      finalPaymentStatus = PaymentStatus.AUTHORIZED;
      successResponse = true;
      frontendMessage = 'Payment is pending review by PayPal.';
      noteContent = `⏳ PayPal payment PENDING. TXN: ${transactionId}. Do not ship until cleared.`;
    } else {
      finalOrderStatus = OrderStatus.FAILED;
      finalPaymentStatus = PaymentStatus.UNPAID;
      successResponse = false;
      frontendMessage = 'Payment was declined or failed.';
      noteContent = `❌ PayPal payment failed. Status: ${paymentStatus}. TXN: ${transactionId}.`;
    }

    // ── 6. Fetch order items (needed for stock decrement + analytics) ─
    // Only when payment COMPLETED and no fraud flag — avoids unnecessary DB call otherwise
    const isFullSuccess = paymentStatus === 'COMPLETED' && !isAmountMismatch;
    const orderItems = isFullSuccess
      ? await db.orderItem.findMany({
          where: { orderId: wcOrderId },
          select: { productId: true, variantId: true, quantity: true, total: true },
        })
      : [];

    // ── 7. DB Transaction: order update + transaction log + note + stock ─
    // ✅ NEW: Stock is decremented HERE (at payment confirmation), not at order creation.
    // paypal/create-order no longer touches stock — avoids double-decrement and
    // prevents permanent stock loss when payment fails.
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: wcOrderId },
        data: {
          status: finalOrderStatus,
          paymentStatus: finalPaymentStatus,
          paymentId: transactionId,
          totalPaid: paymentStatus === 'COMPLETED' ? capturedAmount : 0,
          totalDue: paymentStatus === 'COMPLETED' ? 0 : expectedAmount,
        },
      });

      await tx.orderTransaction.create({
        data: {
          orderId: wcOrderId,
          gateway: 'paypal',
          type: TransactionType.SALE,
          amount: capturedAmount,
          transactionId,
          status: paymentStatus,
          rawResponse: captureData as any,
        },
      });

      await tx.orderNote.create({
        data: { orderId: wcOrderId, content: noteContent, isSystem: true },
      });

      // Decrement stock only on confirmed COMPLETED payment
      if (isFullSuccess) {
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
      }
    });

    // Activity log — fire-and-forget, never blocks the response
    if (isFullSuccess) {
      logActivity({
        action: 'CHECKOUT_ORDER_PLACED',
        entityType: 'Order',
        entityId: wcOrderId,
        details: { gateway: 'paypal', amount: capturedAmount, transactionId },
        userId: order.userId ?? undefined,
      }).catch(() => {});
    }

    // ── 8. Post-payment side-effects (fire-and-forget) ────────
    if (successResponse && finalOrderStatus === OrderStatus.PROCESSING) {
      // TransDirect auto-booking
      syncOrderToTransdirect(wcOrderId).catch(err =>
        console.error('[PayPal Capture] TransDirect sync failed:', err)
      );
    }

    if (successResponse) {
      // Confirmation emails
      const customerEmail = order.guestEmail || order.user?.email;
      if (customerEmail) {
        sendNotification({
          trigger: 'ORDER_PROCESSING',
          recipient: customerEmail,
          orderId: wcOrderId,
        }).catch(err => console.error('[PayPal Capture] Customer email failed:', err));
      }
      sendNotification({
        trigger: 'ORDER_CREATED_ADMIN',
        recipient: '',
        orderId: wcOrderId,
      }).catch(err => console.error('[PayPal Capture] Admin email failed:', err));

      // Affiliate commission
      if (!process.env.INTERNAL_API_KEY) {
        console.error('[PayPal Capture] INTERNAL_API_KEY not set — affiliate commission skipped for order:', wcOrderId);
      } else {
        fetch(`${APP_URL}/api/affiliate/process-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.INTERNAL_API_KEY,
          },
          body: JSON.stringify({ orderId: wcOrderId }),
        }).catch(err => console.error('[PayPal Capture] Affiliate trigger failed:', err));
      }

      // ✅ NEW: Daily analytics update (matches stripe/capture-order behaviour)
      // Only runs on confirmed COMPLETED payments — not on PENDING/FAILED.
      if (isFullSuccess && orderItems.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const subtotal = Number(order.subtotal);
        const discountTotal = Number(order.discountTotal);
        const taxTotal = Number(order.taxTotal);
        const shippingCost = Number(order.shippingTotal);
        const isFirstOrder = order.isFirstOrder;
        const totalItemsSold = orderItems.reduce((sum, i) => sum + i.quantity, 0);

        // fire-and-forget — does not block the response to the user
        Promise.allSettled([
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
        ]).catch(err => console.error('[PayPal Capture] Analytics update failed:', err));
      }
    }

    return NextResponse.json({
      success: successResponse,
      status: paymentStatus,
      message: frontendMessage,
      wcOrderId: order.id,
      wcOrderKey: order.orderNumber,
    });

  } catch (error: unknown) {
    console.error('[PayPal Capture Error]:', error);
    const msg = error instanceof Error ? error.message : 'System error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}