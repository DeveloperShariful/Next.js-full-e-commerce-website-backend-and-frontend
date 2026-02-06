// File: app/api/webhooks/stripe/route.ts

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";
import { sendNotification } from "@/app/api/email/send-notification";
import { auditService } from "@/lib/services/audit-service"; 
import Stripe from "stripe";
import { DisputeStatus } from "@prisma/client";

function mapStripeDisputeStatus(status: string): DisputeStatus {
  switch (status) {
    case "warning_needs_response": return "WARNING_NEEDS_RESPONSE";
    case "needs_response": return "NEEDS_RESPONSE";
    case "under_review": return "UNDER_REVIEW";
    case "won": return "WON";
    case "lost": return "LOST";
    default: return "NEEDS_RESPONSE";
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;
  
  const config = await db.stripeConfig.findFirst({
    where: { paymentMethod: { isEnabled: true } }
  });

  if (!config) {
    return NextResponse.json({ error: "Stripe config not found" }, { status: 500 });
  }

  const isTest = config.testMode;
  const apiKey = decrypt(isTest ? config.testSecretKey! : config.liveSecretKey!);
  const webhookSecret = decrypt(isTest ? config.testWebhookSecret! : config.liveWebhookSecret!);

  if (!apiKey || !webhookSecret) {
    return NextResponse.json({ error: "Missing API keys or Webhook Secret" }, { status: 500 });
  }

  const stripe = new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    await auditService.systemLog("WARN", "STRIPE_WEBHOOK", "Signature Verification Failed", { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // ====================================================
    // CASE 1: PAYMENT SUCCESS (Sale)
    // ====================================================
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Try to get Order ID from Metadata OR Payment ID
      const orderIdFromMeta = paymentIntent.metadata.orderId;

      const order = await db.order.findFirst({
        where: {
            OR: [
                { id: orderIdFromMeta || "undefined" },
                { paymentId: paymentIntent.id }
            ]
        },
        include: { items: { include: { product: true, variant: true } } } 
      });

      if (order && order.paymentStatus !== "PAID") {
            const oldOrderData = { ...order }; 

            await db.$transaction(async (tx) => {
                // 1. Create Transaction Record
                await tx.orderTransaction.create({
                    data: {
                        orderId: order.id,
                        gateway: "STRIPE",
                        type: "SALE",
                        amount: (paymentIntent.amount / 100).toFixed(2),
                        currency: paymentIntent.currency.toUpperCase(),
                        transactionId: paymentIntent.id,
                        status: "COMPLETED",
                        rawResponse: paymentIntent as any, // Stored in Transaction
                        metadata: {
                            payment_method: paymentIntent.payment_method_types[0],
                            mode: isTest ? "TEST" : "LIVE"
                        }
                    }
                });

                // 2. Update Order Status ONLY (Stock already deducted in createOrder)
                await tx.order.update({
                    where: { id: order.id },
                    data: { 
                        paymentStatus: "PAID",
                        status: "PROCESSING",
                        capturedAt: new Date(),
                        paymentGateway: "STRIPE",
                        paymentId: paymentIntent.id,
                        // NO rawResponse here
                    }
                });
            });

            await auditService.log({
                userId: "system",
                action: "PAYMENT_SUCCESS_STRIPE",
                entity: "Order",
                entityId: order.id,
                oldData: { status: oldOrderData.status, paymentStatus: oldOrderData.paymentStatus },
                newData: { status: "PROCESSING", paymentStatus: "PAID" },
                meta: { transactionId: paymentIntent.id, amount: paymentIntent.amount }
            });

            if (order.guestEmail) {
                await sendNotification({
                    trigger: "PAYMENT_PAID",
                    recipient: order.guestEmail,
                    data: {
                        order_number: order.orderNumber,
                        customer_name: "Customer", 
                        total: `${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`
                    },
                    orderId: order.id
                });
            }
      }
    }


    // ====================================================
    // CASE 2: DISPUTE CREATED
    // ====================================================
    else if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntentId = dispute.payment_intent as string;
      const order = await db.order.findFirst({ where: { paymentId: paymentIntentId } });

      if (order) {
        await db.dispute.create({
          data: {
            orderId: order.id,
            gatewayDisputeId: dispute.id,
            amount: (dispute.amount / 100).toFixed(2),
            currency: dispute.currency.toUpperCase(),
            status: mapStripeDisputeStatus(dispute.status),
            reason: dispute.reason,
            evidenceDueBy: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null,
            metadata: { stripe_dispute_obj: dispute } as any
          }
        });

        await auditService.log({
            userId: "system",
            action: "DISPUTE_OPENED",
            entity: "Order",
            entityId: order.id,
            newData: { disputeId: dispute.id, reason: dispute.reason, amount: dispute.amount },
            oldData: null
        });
      }
    }

    // ====================================================
    // CASE 3: DISPUTE CLOSED (Won or Lost) -
    // ====================================================
    else if (event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute;
      
      const existingDispute = await db.dispute.findUnique({
        where: { gatewayDisputeId: dispute.id }
      });

      if (existingDispute) {
        const newStatus = mapStripeDisputeStatus(dispute.status);
        
        await db.dispute.update({
          where: { gatewayDisputeId: dispute.id },
          data: { 
            status: newStatus,
            updatedAt: new Date()
          }
        });

        await auditService.log({
            userId: "system",
            action: "DISPUTE_CLOSED",
            entity: "Order",
            entityId: existingDispute.orderId,
            oldData: { status: existingDispute.status },
            newData: { status: newStatus },
            meta: { outcome: dispute.status, disputeId: dispute.id }
        });
      }
    }

    // ====================================================
    // CASE 4: REFUND UPDATED (Optional)
    // ====================================================
    else if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        await auditService.systemLog("INFO", "STRIPE_WEBHOOK", "External Refund Detected", { chargeId: charge.id });
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    await auditService.systemLog("ERROR", "STRIPE_WEBHOOK_HANDLER", error.message, { error });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}