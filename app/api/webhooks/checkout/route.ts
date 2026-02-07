//app/api/webhooks/checkout/route.ts

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { auditService } from "@/lib/audit-service";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    
    const signature = headersList.get("Stripe-Signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && !signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    
    const event = JSON.parse(body);
    const eventId = event.id;
    const eventType = event.type;

    const existingLog = await db.paymentWebhookLog.findUnique({
      where: { eventId: eventId }
    });

    if (existingLog && existingLog.processed) {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    if (!existingLog) {
      await db.paymentWebhookLog.create({
        data: {
          provider: "STRIPE", 
          eventId: eventId,
          eventType: eventType,
          payload: event as any,
          processed: false
        }
      });
    }

    if (eventType === "checkout.session.completed" || eventType === "payment_intent.succeeded") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { 
            paymentStatus: "PAID",
            paymentId: session.payment_intent || session.id,
            isCaptured: true,
            capturedAt: new Date(),
            transactions: {
              create: {
                gateway: "stripe",
                type: "SALE",
                amount: session.amount_total / 100,
                transactionId: session.payment_intent || session.id,
                status: "COMPLETED",
                rawResponse: event
              }
            }
          }
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${appUrl}/api/affiliate/process-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.INTERNAL_API_KEY!
          },
          body: JSON.stringify({ orderId })
        }).catch(err => console.error("Trigger Engine Failed", err));
      }
    }

    await db.paymentWebhookLog.update({
      where: { eventId: eventId },
      data: { processed: true }
    });

    return NextResponse.json({ received: true });

  } catch (error: any) {
    await auditService.systemLog("ERROR", "WEBHOOK", "Payment Webhook Failed", { error: error.message });
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}