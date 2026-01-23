"use server";

import { db } from "@/lib/prisma";
import { decrypt } from "@/app/actions/admin/settings/payments/crypto"; // পাথ ঠিক করে নিবেন

// PayPal API Token Helper
async function getAccessToken(clientId: string, clientSecret: string, isSandbox: boolean) {
  const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(cartId: string, shippingMethodId: string) {
  try {
    // ১. কনফিগ লোড
    const config = await db.paypalConfig.findFirst({
        where: { paymentMethod: { isEnabled: true } },
        include: { paymentMethod: true }
    });
    
    if (!config) throw new Error("PayPal not configured");

    const isSandbox = config.sandbox;
    const clientId = isSandbox ? config.sandboxClientId : config.liveClientId;
    const clientSecret = decrypt((isSandbox ? config.sandboxClientSecret : config.liveClientSecret) ?? "");

    if (!clientId || !clientSecret) throw new Error("Missing PayPal Credentials");

    // ২. সার্ভার সাইড ক্যালকুলেশন (Database থেকে)
    const cart = await db.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true, variant: true } } }
    });

    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

    let subtotal = 0;
    cart.items.forEach(item => {
        // ✅ FIX: Decimal to Number Conversion
        const price = Number(item.variant ? (item.variant.salePrice || item.variant.price) : (item.product.salePrice || item.product.price));
        subtotal += price * item.quantity;
    });

    // শিপিং কস্ট যোগ করা
    let shippingCost = 0;
    if (shippingMethodId) {
        const rate = await db.shippingRate.findUnique({ where: { id: shippingMethodId } });
        // অথবা যদি Transdirect বা অন্য লজিক থাকে, সেটি এখানে কল করে প্রাইস আনতে হবে
        if (rate) shippingCost = Number(rate.price); // ✅ FIX: Decimal to Number Conversion
        // নোট: যদি Transdirect dynamic quote হয়, আপনাকে সেই ভ্যালুটি এখানে ভ্যালিডেট করতে হবে
    }

    const total = (subtotal + shippingCost).toFixed(2);

    // ৩. PayPal API কল (Order Creation)
    const accessToken = await getAccessToken(clientId!, clientSecret, isSandbox);
    const baseUrl = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "AUD",
            value: total,
            breakdown: {
                item_total: { currency_code: "AUD", value: subtotal.toFixed(2) },
                shipping: { currency_code: "AUD", value: shippingCost.toFixed(2) }
            }
          },
          description: `Order from GoBike`
        }]
      }),
    });

    const orderData = await response.json();
    return { orderID: orderData.id };

  } catch (error: any) {
    console.error("PayPal Create Order Error:", error);
    throw new Error("Failed to create PayPal order");
  }
}