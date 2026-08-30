// POST /api/bot/shipping   { postcode: string, suburb?: string, productSlug?: string, quantity?: number }
//
// A rough delivery-cost estimate for the Messenger bot, so it can answer
// "how much is shipping to <postcode>" with a real figure instead of
// "shown at checkout". Server-to-server only (x-api-key). Not a checkout
// quote - no cart, no coupons - just Transdirect's rate for one bike-sized
// carton to that postcode, with the store's handling fee / global discount
// applied. Local pickup and battery-DG rules are noted in the response text.

import { db } from "@/lib/prisma";
import { assertBotAuth, botJson } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A representative "bike in a box" if we can't resolve a specific product.
const DEFAULT_CARTON = { weight: 22, length: 140, width: 25, height: 75 };

function pct(base: number, rule?: string | null): number {
  if (!rule) return 0;
  const v = rule.trim();
  if (v.endsWith("%")) return (base * (parseFloat(v) || 0)) / 100;
  return parseFloat(v) || 0;
}

export async function POST(req: Request) {
  const denied = assertBotAuth(req);
  if (denied) return denied;

  let body: { postcode?: string; suburb?: string; productSlug?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return botJson({ error: "Invalid JSON body." }, { status: 400 });
  }

  const postcode = String(body.postcode || "").trim();
  const suburb = String(body.suburb || "").trim().toUpperCase();
  const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 4);
  if (!/^\d{4}$/.test(postcode)) {
    return botJson({ error: "A 4-digit Australian postcode is required." }, { status: 400 });
  }

  try {
    const [config, product] = await Promise.all([
      db.transdirectConfig.findUnique({ where: { id: "transdirect_config" } }),
      body.productSlug
        ? db.product.findFirst({
            where: { slug: String(body.productSlug), deletedAt: null },
            select: { name: true, weight: true, length: true, width: true, height: true },
          })
        : Promise.resolve(null),
    ]);

    if (!config?.isEnabled || !config.apiKey) {
      return botJson({
        available: false,
        note: "Shipping is worked out at checkout by postcode - a team member can confirm an exact figure.",
      });
    }

    const carton = product
      ? {
          weight: Number(product.weight) > 0 ? Number(product.weight) : DEFAULT_CARTON.weight,
          length: Number(product.length) > 0 ? Number(product.length) : DEFAULT_CARTON.length,
          width: Number(product.width) > 0 ? Number(product.width) : DEFAULT_CARTON.width,
          height: Number(product.height) > 0 ? Number(product.height) : DEFAULT_CARTON.height,
        }
      : DEFAULT_CARTON;

    const tailgateKg = Number(config.autoTailgateKg ?? 25);
    const needsTailgate = carton.weight > tailgateKg;

    const payload = {
      declared_value: 1500 * quantity,
      tailgate_pickup: needsTailgate,
      tailgate_delivery: needsTailgate,
      items: [
        {
          weight: Number(carton.weight.toFixed(2)),
          height: carton.height,
          width: carton.width,
          length: carton.length,
          quantity,
          description: "carton",
        },
      ],
      sender: {
        postcode: String(config.senderPostcode || "2570").trim(),
        suburb: String(config.senderSuburb || "CAMDEN SOUTH").trim().toUpperCase(),
        type: config.senderType || "business",
        country: "AU",
      },
      receiver: {
        postcode,
        suburb: suburb || "UNKNOWN",
        type: "residential",
        country: "AU",
      },
    };

    const res = await fetch("https://www.transdirect.com.au/api/bookings/v4", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-key": config.apiKey,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error("[bot/shipping] Transdirect error", res.status, await res.text().catch(() => ""));
      return botJson({
        available: false,
        note: "Couldn't get a live quote just now - the exact figure shows at checkout, or a team member can confirm.",
      });
    }

    const data = await res.json();
    const quotes = (data && data.quotes) || {};
    const rates: { courier: string; cost: number; transit: string }[] = [];

    for (const key of Object.keys(quotes)) {
      const q = quotes[key];
      if (!q || !q.total) continue;
      let cost = Number(q.total);
      // store adjustments (rough): global discount then handling fee
      cost -= pct(cost, config.globalShippingDiscount);
      cost += pct(cost, config.handlingFee);
      cost = Math.max(0, Number(cost.toFixed(2)));
      const courier = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const transit = String(q.transit_time || "").replace(/\s*business\s*/i, " ").trim();
      rates.push({ courier, cost, transit });
    }
    rates.sort((a, b) => a.cost - b.cost);

    if (!rates.length) {
      return botJson({
        available: false,
        note: "No courier rates came back for that postcode - the exact figure shows at checkout, or a team member can check.",
      });
    }

    return botJson({
      available: true,
      postcode,
      product: product?.name || "a GoBike",
      quantity,
      cheapest: rates[0],
      rates: rates.slice(0, 4),
      note:
        "Estimate only - the exact figure is confirmed at checkout. Orders with a battery need a street address (no PO boxes). Local pickup from Camden South, NSW is free by request.",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[bot/shipping] failed:", err);
    return botJson({ available: false, note: "Shipping estimate unavailable right now." }, { status: 200 });
  }
}
