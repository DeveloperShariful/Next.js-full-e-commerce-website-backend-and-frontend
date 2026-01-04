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
  const webhookSecret = isTest ? config.testWebhookSecret : config.liveWebhookSecret;

  if (!apiKey || !webhookSecret) {
    return NextResponse.json({ error: "Missing API keys" }, { status: 500 });
  }

  const stripe = new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  });

  let event: Stripe.Event;

  // 3. Signature Verify kora (Security)
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

    // Transaction shuru (Order Update + Inventory Update)
    await db.$transaction(async (tx) => {
        // Order khuje ber kora (Items shoho)
        const order = await tx.order.findFirst({
            where: { paymentId: paymentIntent.id },
            include: { items: true } 
        });

        if (order && order.paymentStatus !== "PAID") {
            // A. Order Status Update
            await tx.order.update({
                where: { id: order.id },
                data: { 
                    paymentStatus: "PAID",
                    status: "PROCESSING" 
                }
            });

            // B. Stock Komanor Logic
            for (const item of order.items) {
                // Jodi Variant hoy, tahole Variant er stock komano hobe
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
                
                // Main Product er stock o komano hobe
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }

            // C. Email Notification Pathano
            if (order.guestEmail) {
                await sendNotification({
                    trigger: "PAYMENT_PAID",
                    recipient: order.guestEmail,
                    data: {
                        order_number: order.orderNumber,
                        customer_name: "Customer",
                        total: `$${order.total.toFixed(2)}`
                    },
                    orderId: order.id
                });
            }
            console.log(`✅ Order ${order.orderNumber} marked as PAID & Stock Updated (Stripe)`);
        }
    });
  }

  return NextResponse.json({ received: true });
}