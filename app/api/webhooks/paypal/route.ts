// File: app/api/webhooks/paypal/route.ts

import { NextResponse } from 'next/server';
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType = body.event_type;

    // ১. শুধুমাত্র পেমেন্ট কমপ্লিট হওয়া ইভেন্টগুলো প্রসেস করবো
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = body.resource;
      const localOrderId = body.resource.custom_id || body.resource.purchase_units?.[0]?.reference_id;

      if (!localOrderId) {
        // যদি মেটাডেটায় আইডি না পাওয়া যায়, তবে ট্রানজেকশন আইডি দিয়ে খুঁজি
        const txLog = await db.orderTransaction.findFirst({
            where: { transactionId: body.resource.id }
        });
        if (!txLog) return NextResponse.json({ message: "Order not found" });
      }

      console.log(`🔔 PayPal Webhook: Confirming Order ${localOrderId}`);

      await db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ 
          where: { id: localOrderId }, 
          include: { items: true } 
        });

        if (order && order.paymentStatus !== "PAID") {
          await tx.order.update({
            where: { id: localOrderId },
            data: {
              status: 'PROCESSING',
              paymentStatus: 'PAID',
              totalPaid: order.total,
              capturedAt: new Date(),
            }
          });

          // স্টক কমানো
          for (const item of order.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } }
              });
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PAYPAL_WEBHOOK_ERROR:", error.message);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}