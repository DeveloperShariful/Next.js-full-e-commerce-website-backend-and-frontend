//app/api/webhooks/stripe/route.ts

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { sendNotification } from "@/app/api/email/send-notification";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  // 1. Database theke Config ana
  const config = await db.stripeConfig.findFirst({
    where: { paymentMethod: { isEnabled: true } }
  });

  if (!config) {
    return NextResponse.json({ error: "Stripe config not found" }, { status: 500 });
  }

  // 2. Secret Key Decrypt kora
  const isTest = config.testMode;
  const apiKey = decrypt(isTest ? config.testSecretKey! : config.liveSecretKey!);
  // Note: Since we updated the setup file to encrypt the webhook secret, 
  // decrypt() here will now work correctly.
  const webhookSecret = decrypt(isTest ? config.testWebhookSecret! : config.liveWebhookSecret!);

  if (!apiKey || !webhookSecret) {
    return NextResponse.json({ error: "Missing API keys or Webhook Secret" }, { status: 500 });
  }

  const stripe = new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  });

  let event: Stripe.Event;

  // 3. Signature Verify kora
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // 4. Event Handle kora
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    console.log(`💰 Stripe Payment succeeded: ${paymentIntent.id}`);

    await db.$transaction(async (tx) => {
        // Order khuje ber kora
        const order = await tx.order.findFirst({
            where: { paymentId: paymentIntent.id },
            include: { items: { include: { product: true, variant: true } } } 
        });

        if (order && order.paymentStatus !== "PAID") {
            
            // ✅ FIX 3: Transaction Record তৈরি করা (অ্যাডমিন প্যানেলের জন্য জরুরি)
            await tx.orderTransaction.create({
                data: {
                    orderId: order.id,
                    gateway: "STRIPE",
                    type: "SALE",
                    // Stripe amount is in cents, convert to main currency unit
                    amount: paymentIntent.amount / 100, 
                    currency: paymentIntent.currency.toUpperCase(),
                    transactionId: paymentIntent.id,
                    status: "COMPLETED",
                    rawResponse: paymentIntent as any,
                    metadata: {
                        payment_method: paymentIntent.payment_method_types[0],
                        mode: isTest ? "TEST" : "LIVE"
                    }
                }
            });

            // ✅ FIX 4: Stock Komanor Logic (Track Quantity চেক সহ)
            for (const item of order.items) {
                // A. Variant Logic
                if (item.variantId && item.variant) {
                    if (item.variant.trackQuantity) { // শুধু যদি ট্র্যাকিং অন থাকে
                        await tx.productVariant.update({
                            where: { id: item.variantId },
                            data: { stock: { decrement: item.quantity } }
                        });
                    }
                }
                
                // B. Simple Product Logic
                else if (item.productId && item.product) {
                    if (item.product.trackQuantity) { // শুধু যদি ট্র্যাকিং অন থাকে
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } }
                        });
                    }
                }
            }

            // Order Status Update
            await tx.order.update({
                where: { id: order.id },
                data: { 
                    paymentStatus: "PAID",
                    status: "PROCESSING",
                    capturedAt: new Date(),
                    paymentGateway: "STRIPE"
                }
            });

            // Email Notification
            if (order.guestEmail) {
                await sendNotification({
                    trigger: "PAYMENT_PAID",
                    recipient: order.guestEmail,
                    data: {
                        order_number: order.orderNumber,
                        customer_name: "Customer",
                        // Stripe amount fix here too
                        total: `${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`
                    },
                    orderId: order.id
                });
            }
            console.log(`✅ Order ${order.orderNumber} fully processed.`);
        }
    });
  }

  return NextResponse.json({ received: true });
}