// Shared auth + response helpers for the GoBike Messenger bot's internal API.
//
// These routes are called server-to-server by the bot (a separate app on
// Render). They are NOT for browsers and expose read-only store data, so
// they're gated behind a single shared secret in the `x-api-key` header.

import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

const BOT_API_KEY = process.env.BOT_API_KEY || "";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Returns a 401 Response if the request isn't authorised, or null if it is.
 *
 *   const denied = assertBotAuth(req);
 *   if (denied) return denied;
 */
export function assertBotAuth(req: Request): NextResponse | null {
  if (!BOT_API_KEY) {
    return NextResponse.json(
      { error: "Bot API is not configured on the server (BOT_API_KEY missing)." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  const provided = req.headers.get("x-api-key") || "";
  if (!provided || !safeEqual(provided, BOT_API_KEY)) {
    return NextResponse.json(
      { error: "Unauthorised." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  return null;
}

/** JSON response that is never cached (store data changes constantly). */
export function botJson(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init?.headers || {}) },
  });
}

/** Strip HTML tags + collapse whitespace, then cap length. */
export function plainText(html: string | null | undefined, maxLen = 500): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? text.slice(0, maxLen - 1).trimEnd() + "…" : text;
}

/** Is a sale price actually in effect right now? */
export function activeSalePrice(
  salePrice: unknown,
  saleStart: Date | null,
  saleEnd: Date | null
): number | null {
  if (salePrice == null) return null;
  const now = Date.now();
  if (saleStart && now < saleStart.getTime()) return null;
  if (saleEnd && now > saleEnd.getTime()) return null;
  const n = Number(salePrice);
  return Number.isFinite(n) ? n : null;
}
