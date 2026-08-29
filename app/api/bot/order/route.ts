// POST /api/bot/order   { orderNumber: string, email?: string }
//
// Read-only order status lookup for the Messenger bot. Because a customer in
// a DM is only loosely identified, we never reveal order details unless the
// caller also supplies the email address on the order. If the order has an
// email on file and it doesn't match, we return `needsVerification: true`
// and no details, so the bot can ask the customer for it.

import { db } from "@/lib/prisma";
import { assertBotAuth, botJson } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normaliseOrderNumber(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/^#/, "")
    .trim();
}

export async function POST(req: Request) {
  const denied = assertBotAuth(req);
  if (denied) return denied;

  let body: { orderNumber?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return botJson({ error: "Invalid JSON body." }, { status: 400 });
  }

  const orderNumber = normaliseOrderNumber(body.orderNumber || "");
  const email = (body.email || "").trim().toLowerCase();

  if (!orderNumber) {
    return botJson({ error: "orderNumber is required." }, { status: 400 });
  }

  try {
    const order = await db.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber, mode: "insensitive" },
        deletedAt: null,
      },
      select: {
        orderNumber: true,
        orderDate: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        total: true,
        currency: true,
        guestEmail: true,
        shippingAddress: true,
        shippingProvider: true,
        shippingTrackingNumber: true,
        shippingTrackingUrl: true,
        estimatedTransitTime: true,
        user: { select: { email: true } },
        items: { select: { productName: true, quantity: true } },
        shipments: {
          orderBy: { shippedDate: "desc" },
          take: 1,
          select: {
            trackingNumber: true,
            trackingUrl: true,
            connote: true,
            courier: true,
            courierName: true,
            lastTrackingStatus: true,
            deliveredDate: true,
            shippedDate: true,
          },
        },
      },
    });

    if (!order) {
      return botJson({ found: false });
    }

    // Which email is on file for this order?
    const shipAddr = (order.shippingAddress as Record<string, unknown> | null) || {};
    const onFile = [
      order.guestEmail,
      order.user?.email,
      typeof shipAddr.email === "string" ? shipAddr.email : null,
    ]
      .filter(Boolean)
      .map((e) => String(e).toLowerCase());

    if (onFile.length > 0 && (!email || !onFile.includes(email))) {
      return botJson({ found: true, needsVerification: true });
    }

    const s = order.shipments[0];

    return botJson({
      found: true,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: num(order.total),
      currency: order.currency,
      items: order.items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
      })),
      shipping: {
        provider:
          order.shippingProvider || s?.courierName || s?.courier || null,
        trackingNumber:
          order.shippingTrackingNumber || s?.trackingNumber || s?.connote || null,
        trackingUrl: order.shippingTrackingUrl || s?.trackingUrl || null,
        latestStatus: s?.lastTrackingStatus || null,
        estimatedTransitTime: order.estimatedTransitTime || null,
        shippedDate: s?.shippedDate || null,
        deliveredDate: s?.deliveredDate || null,
      },
    });
  } catch (err) {
    console.error("[bot/order] failed:", err);
    return botJson({ error: "Order lookup failed." }, { status: 500 });
  }
}
