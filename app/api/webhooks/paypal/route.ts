// File: app/api/webhooks/paypal/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sendNotification } from "@/app/api/email/send-notification";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto";

// PayPal Token Helper
async function getPayPalAccessToken(clientId: string, clientSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  
  const data = await response.json();
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const headersList = req.headers;
    const bodyText = await req.text();
    const body = JSON.parse(bodyText);
    
    // ১. [UPDATED] ডাটাবেস থেকে সঠিক ক্রেডেনশিয়াল আনা
    // শুধুমাত্র Enabled নয়, আমরা চেক করব যার Webhook ID সেট করা আছে
    // কারণ Webhook ID ছাড়া ভেরিফিকেশন সম্ভব নয়
    const config = await db.paypalConfig.findFirst({
      where: { 
        webhookId: { not: null }, // 🔥 Must have a webhook ID
        paymentMethod: { isEnabled: true } 
      }
    });

    if (!config || !config.webhookId) {
      console.error("❌ PayPal Config or Webhook ID missing in DB");
      return NextResponse.json({ error: "PayPal config missing" }, { status: 500 });
    }

    const isSandbox = config.sandbox;
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret;
    const clientSecret = decrypt(encryptedSecret ?? "");

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Credentials missing" }, { status: 500 });
    }

    // ২. সিকিউরিটি ভেরিফিকেশন (PayPal Server এর সাথে চেক করা)
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, isSandbox);
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    const verificationRes = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: headersList.get("paypal-transmission-id"),
        transmission_time: headersList.get("paypal-transmission-time"),
        cert_url: headersList.get("paypal-cert-url"),
        auth_algo: headersList.get("paypal-auth-algo"),
        transmission_sig: headersList.get("paypal-transmission-sig"),
        webhook_id: config.webhookId, // 🔥 Verifying against stored ID
        webhook_event: body,
      }),
    });

    const verificationData = await verificationRes.json();

    if (verificationData.verification_status !== "SUCCESS") {
      console.error("⚠️ Fake PayPal Webhook Detected!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // ৩. ভেরিফিকেশন সাকসেস - ডাটা প্রসেস শুরু
    const eventType = body.event_type;
    const resource = body.resource;

    console.log(`🔔 Verified PayPal Webhook: ${eventType}`);

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      const captureId = resource.id;

      // ট্রানজ্যাকশন শুরু
      await db.$transaction(async (tx) => {
        // অর্ডার এবং তার আইটেমগুলো খুঁজে বের করা
        const order = await tx.order.findFirst({
          where: {
            OR: [{ paymentId: orderId }, { paymentId: captureId }],
          },
          include: { items: true } // Stock কমানোর জন্য items লাগবে
        });

        if (order && order.paymentStatus !== "PAID") {
            // A. অর্ডার স্ট্যাটাস আপডেট
            await tx.order.update({
              where: { id: order.id },
              data: { 
                paymentStatus: "PAID",
                status: "PROCESSING",
                paymentId: captureId
              }
            });

            // B. স্টক কমানোর লজিক (Inventory Management)
            for (const item of order.items) {
                // ভ্যারিয়েন্ট থাকলে ভ্যারিয়েন্টের স্টক কমাবে
                if (item.variantId) {
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
                
                // মেইন প্রোডাক্টের স্টকও কমাবে
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                }
            }
    
            // C. ইমেইল নোটিফিকেশন
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
            console.log(`✅ Order ${order.orderNumber} marked as PAID & Stock Updated`);
        }
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}