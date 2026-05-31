// app/api/paypal/create-order/route.ts

import { NextResponse } from 'next/server';
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";

// ১. পেপ্যাল এক্সেস টোকেন জেনারেট করার ফাংশন
async function generateAccessToken(clientId: string, clientSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const auth = Buffer.from(clientId + ":" + clientSecret).toString("base64");
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: { Authorization: `Basic ${auth}` },
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: "Order ID is missing" }, { status: 400 });

    // ২. ডাটাবেজ থেকে অর্ডার এবং পেপ্যাল কনফিগ আনা
    const [order, gateway] = await Promise.all([
      db.order.findUnique({ where: { id: orderId } }),
      db.paymentGateway.findUnique({ where: { identifier: "paypal" } })
    ]);

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (!gateway?.encryptedSecret || !gateway?.publicKey) throw new Error("PayPal not configured.");

    // ৩. কি ডিক্রিপ্ট করা এবং টোকেন আনা
    const clientSecret = decrypt(gateway.encryptedSecret);
    const isSandbox = gateway.mode === "TEST";
    const accessToken = await generateAccessToken(gateway.publicKey, clientSecret!, isSandbox);
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    // ৪. পেপ্যাল সার্ভারে অর্ডার তৈরি করা
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: order.id,
          amount: {
            currency_code: "AUD",
            value: order.total.toString(),
          },
          description: `Order #${order.orderNumber} from GOBIKE`,
        }],
      }),
    });

    const paypalOrder = await response.json();

    // ৫. লোকাল অর্ডারে পেপ্যাল আইডি সেভ করা
    await db.order.update({
      where: { id: order.id },
      data: { paymentId: paypalOrder.id }
    });

    return NextResponse.json({ id: paypalOrder.id });

  } catch (error: any) {
    console.error("PAYPAL_CREATE_ORDER_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}