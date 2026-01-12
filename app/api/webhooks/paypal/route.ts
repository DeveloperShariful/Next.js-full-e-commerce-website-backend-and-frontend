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
    
    // 1. Find Config using the Unique Webhook ID from the event (if possible) or verify generally
    // For safety, we fetch the config that has a webhookId stored
    const config = await db.paypalConfig.findFirst({
      where: { 
        webhookId: { not: null },
        paymentMethod: { isEnabled: true } 
      }
    });

    if (!config || !config.webhookId) {
      return NextResponse.json({ error: "PayPal config or webhook ID missing" }, { status: 500 });
    }

    const isSandbox = config.sandbox;
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
    const encryptedSecret = isSandbox ? config.sandboxClientSecret : config.liveClientSecret;
    const clientSecret = decrypt(encryptedSecret ?? "");

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Credentials missing" }, { status: 500 });
    }

    // 2. Verify Webhook Signature with PayPal
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
        webhook_id: config.webhookId,
        webhook_event: body,
      }),
    });

    const verificationData = await verificationRes.json();

    if (verificationData.verification_status !== "SUCCESS") {
      console.error("⚠️ Invalid PayPal Webhook Signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Process the Event
    const eventType = body.event_type;
    const resource = body.resource;

    // Handle Payment Capture
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = resource.supplementary_data?.related_ids?.order_id; // Usually PayPal Order ID
      const captureId = resource.id;
      const customId = resource.custom_id; // Your Internal Order ID (if sent)

      // Start Database Transaction
      await db.$transaction(async (tx) => {
        // Find the Order
        // We check paymentId (PayPal Order ID) or we could check a custom_id if you sent one
        const order = await tx.order.findFirst({
          where: {
            OR: [
              { paymentId: orderId },
              { paymentId: captureId }, // Some gateways use capture ID
              { id: customId }          // Fallback if custom_id was used
            ]
          },
          include: { items: { include: { product: true, variant: true } } }
        });

        if (order && order.paymentStatus !== "PAID") {
            
            // === FIX A: Create Order Transaction Record ===
            // এটি ভবিষ্যতের অডিট এবং রিফান্ড হ্যান্ডলিংয়ের জন্য জরুরি
            await tx.orderTransaction.create({
              data: {
                orderId: order.id,
                gateway: "PAYPAL",
                type: "SALE",
                amount: parseFloat(resource.amount.value),
                currency: resource.amount.currency_code,
                transactionId: captureId, // The Capture ID
                status: "COMPLETED",
                rawResponse: body, // Full JSON for debugging
                metadata: {
                  payer_email: resource.payer?.email_address,
                  payer_id: resource.payer?.payer_id,
                  payment_mode: isSandbox ? "TEST" : "LIVE"
                }
              }
            });

            // === FIX B: Inventory Decrement Logic (with TrackQuantity Check) ===
            for (const item of order.items) {
                // 1. Variant Logic
                if (item.variantId && item.variant) {
                    if (item.variant.trackQuantity) { // ✅ Only if tracking is enabled
                        await tx.productVariant.update({
                            where: { id: item.variantId },
                            data: { stock: { decrement: item.quantity } }
                        });
                    }
                } 
                // 2. Simple Product Logic
                else if (item.productId && item.product) {
                    if (item.product.trackQuantity) { // ✅ Only if tracking is enabled
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } }
                        });
                    }
                }
            }
    
            // Update Order Status
            await tx.order.update({
              where: { id: order.id },
              data: { 
                paymentStatus: "PAID",
                status: "PROCESSING",
                paymentId: captureId, // Update to Capture ID for refunds
                capturedAt: new Date(),
                paymentGateway: "PAYPAL",
                paymentMethod: "PayPal Wallet"
              }
            });

            // Send Email Notification
            if (order.guestEmail) {
                await sendNotification({
                    trigger: "PAYMENT_PAID",
                    recipient: order.guestEmail,
                    data: {
                        order_number: order.orderNumber,
                        customer_name: "Customer",
                        total: `${resource.amount.currency_code} ${resource.amount.value}`
                    },
                    orderId: order.id
                });
            }
            
            console.log(`✅ Order ${order.orderNumber} successfully processed via PayPal Webhook`);
        }
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("PayPal Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}