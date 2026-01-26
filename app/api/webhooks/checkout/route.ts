//app/api/webhooks/checkout/route.ts

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { affiliateEngine } from "@/lib/services/affiliate-engine";
import { db } from "@/lib/prisma";

// Example: Handling a Stripe/Payment Gateway Webhook
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    // In real app: event = stripe.webhooks.constructEvent(body, signature, secret);
    // For demo, we assume the body is the event JSON
    event = JSON.parse(body);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle Event: Payment Succeeded
  if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
    
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      console.log(`💰 Payment success for Order ${orderId}. Triggering Affiliate Engine...`);
      
      try {
        // 1. Mark Order as Paid
        await db.order.update({
            where: { id: orderId },
            data: { 
                paymentStatus: "PAID",
                status: "PROCESSING"
            }
        });

        // 2. Run Affiliate Logic
        await affiliateEngine.processOrder(orderId);
        
        console.log("✅ Affiliate commissions calculated.");

      } catch (error) {
        console.error("❌ Affiliate Engine Failed:", error);
        // Don't fail the webhook response, just log the error for admin review
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}