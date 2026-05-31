// app/api/paypal/capture-order/route.ts

import { NextResponse } from 'next/server';
import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/backend/settings/payments/crypto";

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
    const { paypalOrderId, wcOrderId } = await request.json();

    // ১. কনফিগ এবং টোকেন প্রিপারেশন
    const gateway = await db.paymentGateway.findUnique({ where: { identifier: "paypal" } });
    const isSandbox = gateway?.mode === "TEST";
    const clientSecret = decrypt(gateway!.encryptedSecret!);
    const accessToken = await generateAccessToken(gateway!.publicKey!, clientSecret!, isSandbox);
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    // ২. পেপ্যাল পেমেন্ট ক্যাপচার করা
    const response = await fetch(`${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureData = await response.json();

    if (captureData.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, message: "Payment not completed" });
    }

    const captureId = captureData.purchase_units[0].payments.captures[0].id;

    // ৩. Prisma Transaction: অর্ডার স্ট্যাটাস এবং ইনভেন্টরি আপডেট
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: wcOrderId }, include: { items: true } });
      if (!order || order.paymentStatus === "PAID") return;

      await tx.order.update({
        where: { id: wcOrderId },
        data: {
          status: 'PROCESSING',
          paymentStatus: 'PAID',
          totalPaid: order.total,
          paymentId: captureId,
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

      // ইনভেন্টরি রিজার্ভেশন ক্লিয়ার
      await tx.inventoryReservation.deleteMany({ where: { cartId: wcOrderId } });
    });

    return NextResponse.json({ success: true, captureId });

  } catch (error: any) {
    console.error("PAYPAL_CAPTURE_ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}