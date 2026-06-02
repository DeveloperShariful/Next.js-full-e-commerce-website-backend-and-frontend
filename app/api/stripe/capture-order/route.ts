// app/api/stripe/capture-order/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, TransactionType } from '@prisma/client';
import { decrypt } from '@/app/actions/backend/settings/payments/crypto';

// ==========================================
// DYNAMIC STRIPE CREDENTIALS FROM DB
// ==========================================
async function getStripeInstance() {
    // Note: All Stripe methods (klarna, afterpay) use the main 'stripe' gateway keys
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: 'stripe' } });
    if (!gateway || !gateway.encryptedSecret) {
        throw new Error("Stripe is not configured in the Admin Panel.");
    }
    const secret = decrypt(gateway.encryptedSecret);
    return new Stripe(secret, { apiVersion: "2025-01-27.acacia" as any, typescript: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentIntentId } = body as { orderId: string; paymentIntentId: string };

    if (!orderId || !paymentIntentId) {
      console.error('❌ [Stripe Capture Order] Missing parameters:', body);
      return NextResponse.json({ success: false, message: 'Missing required parameters.' }, { status: 400 });
    }

    console.log(`🔍 [Stripe Capture Order] Verifying Payment Intent: ${paymentIntentId} for Order: ${orderId}`);

    // 🛡️ 1. Fetch Dynamic Stripe Instance
    const stripe = await getStripeInstance();

    // 🛡️ 2. Retrieve Payment Intent Status from Stripe
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (stripeError: unknown) {
      const msg = stripeError instanceof Error ? stripeError.message : "Failed to fetch intent";
      console.error(`❌ [Stripe Error] Failed to retrieve Payment Intent: ${msg}`);
      return NextResponse.json({ success: false, message: `Stripe Error: ${msg}` }, { status: 400 });
    }

    if (paymentIntent.status !== 'succeeded') {
      console.error(`❌ [Stripe Capture Order] Payment not successful. Current Status: ${paymentIntent.status}`);
      return NextResponse.json({ success: false, message: `Payment was not successful. Status is '${paymentIntent.status}'.` }, { status: 402 });
    }
    
    // 🛡️ 3. Security Check: Validate Metadata Order ID
    const metadataOrderId = paymentIntent.metadata?.order_id;
    if (metadataOrderId && String(metadataOrderId) !== String(orderId)) {
        console.error(`🚨 [SECURITY ALERT] Order ID mismatch! Requested: ${orderId}, Metadata: ${metadataOrderId}`);
        return NextResponse.json({ success: false, message: 'Security check failed: Order ID mismatch.' }, { status: 403 });
    }

    // 🛡️ 4. Check Current Order in Prisma Database
    const currentOrder = await db.order.findUnique({ where: { id: orderId } });
    
    if (!currentOrder) {
        console.error(`❌ [Database Error] Could not find Order ${orderId}`);
        return NextResponse.json({ success: false, message: 'Order not found in the database.' }, { status: 404 });
    }

    // Race Condition Check
    if (currentOrder.status === OrderStatus.PROCESSING || currentOrder.status === OrderStatus.DELIVERED) {
        console.log(`✅ [Stripe Capture Order] Order ${orderId} is already marked as ${currentOrder.status}. Skipping update.`);
        return NextResponse.json({ success: true, orderId: currentOrder.id, message: 'Already processed' });
    }

    // 🛡️ 5. DATABASE TRANSACTION: Update Order & Log Transaction
    const capturedAmount = paymentIntent.amount_received / 100; // Stripe amounts are in cents

    await db.$transaction(async (tx) => {
        // A. Update Master Order
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
            }
        });

        // B. Record Transaction Ledger
        await tx.orderTransaction.create({
            data: {
                orderId: orderId,
                gateway: 'stripe',
                type: TransactionType.SALE,
                amount: capturedAmount,
                transactionId: paymentIntent.id,
                status: paymentIntent.status,
                rawResponse: paymentIntent as any
            }
        });

        // C. Add Order Note
        await tx.orderNote.create({
            data: {
                orderId: orderId,
                content: `✅ Stripe payment successful. Transaction ID: ${paymentIntent.id}. Amount: $${capturedAmount}.`,
                isSystem: true
            }
        });
    });

    console.log(`🎉 [Stripe Capture Order] Success! Order ${orderId} is now 'processing'.`);
    return NextResponse.json({ success: true, orderId: orderId });

  } catch (error: unknown) {
    console.error('🔥 [Stripe Capture Order Critical Error]:', error);
    const message = error instanceof Error ? error.message : 'An internal server error occurred while capturing the order.';
    return NextResponse.json({ success: false, message: message }, { status: 500 });
  }
}