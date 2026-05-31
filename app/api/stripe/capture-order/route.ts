// app/api/stripe/capture-order/route.ts

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";

export async function POST(request: Request) {
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId || !paymentIntentId) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    // ১. Stripe কনফিগ এবং কি আনা
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: "stripe" } });
    if (!gateway?.encryptedSecret) throw new Error("Stripe config missing.");

    const secretKey = decrypt(gateway.encryptedSecret);
    const stripe = new Stripe(secretKey!, { apiVersion: "2025-01-27.acacia" as any });

    // ২. Stripe থেকে পেমেন্টের লেটেস্ট স্ট্যাটাস ভেরিফাই করা
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ success: false, message: `Payment status: ${paymentIntent.status}` }, { status: 400 });
    }

    // ৩. অর্ডারের বর্তমান অবস্থা চেক করা (ডাবল আপডেট ঠেকাতে)
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    if (order.paymentStatus === 'PAID') return NextResponse.json({ success: true, message: 'Already processed' });

    // ৪. 최종 (Final) ধাপ: ডাটাবেজ ট্রানজেকশন (অর্ডার আপডেট + স্টক কমানো)
    await db.$transaction(async (tx) => {
      // A. আপডেট অর্ডার
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
          paymentStatus: 'PAID',
          totalPaid: order.total,
          paymentId: paymentIntent.id,
          capturedAt: new Date(),
          version: { increment: 1 }
        }
      });

      // B. লগ ট্রানজেকশন
      await tx.orderTransaction.create({
        data: {
          orderId: orderId,
          gateway: "stripe",
          type: "CAPTURE",
          amount: order.total,
          transactionId: paymentIntent.id,
          status: "COMPLETED",
          rawResponse: paymentIntent as any
        }
      });

      // C. স্টক আপডেট (Decrement Stock)
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity }
            }
          });
        }
      }

      // D. ক্লিয়ার ইনভেন্টরি রিজার্ভেশন (যদি থাকে)
      await tx.inventoryReservation.deleteMany({
        where: { cartId: orderId }
      });

      // E. অর্ডার নোট অ্যাড করা
      await tx.orderNote.create({
        data: {
          orderId: orderId,
          content: `Payment successfully captured via Stripe. Transaction ID: ${paymentIntent.id}`,
          isSystem: true
        }
      });
    });

    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error: any) {
    console.error('🔥 [STRIPE_CAPTURE_ERROR]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}