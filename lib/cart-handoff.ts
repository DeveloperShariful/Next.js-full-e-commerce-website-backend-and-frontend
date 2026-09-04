// lib/cart-handoff.ts
//
// Signed, short-lived token that carries a Cart key (Cart.sessionId) from the
// Facebook/Instagram in-app browser into the user's real browser, so the cart
// survives the hop. Redeemed by app/open/[token]/route.ts.
//
// SERVER ONLY — imports node:crypto. Client components must import the UA
// helpers from lib/in-app-browser.ts instead.
//
// Deliberately does NOT use lib/hmac-service.ts: that module is bound to
// AFFILIATE_WEBHOOK_SECRET (absent from .env, so it runs on a literal fallback
// string) and JSON.stringify-s its payload, which is key-order dependent.

import crypto from "crypto";

/** 15 minutes — long enough to read the page, find the ⋯ menu and tap through. */
export const CART_HANDOFF_TTL_SECONDS = 900;

const TOKEN_VERSION = "ch1";
const SIG_LENGTH = 22; // base64url chars ≈ 132 bits of HMAC-SHA256

// Charset/length guard applied BEFORE any decoding — the anti-injection gate.
// A real token is ~99 chars.
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{40,200}$/;

// Nothing but a UUID shape is ever allowed to reach a Set-Cookie header.
const UUID_SHAPE = /^[0-9a-f-]{36}$/i;

function getSecret(): string | null {
  return process.env.CART_HANDOFF_SECRET || null;
}

function signRaw(raw: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("base64url")
    .slice(0, SIG_LENGTH);
}

/**
 * Build a handoff token for a Cart.sessionId.
 * Returns null when CART_HANDOFF_SECRET is not configured — fail closed.
 */
export function mintCartHandoffToken(sid: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  if (!UUID_SHAPE.test(sid)) return null;

  const exp = Math.floor(Date.now() / 1000) + CART_HANDOFF_TTL_SECONDS;
  const raw = `${TOKEN_VERSION}.${sid}.${exp}`;
  const sig = signRaw(raw, secret);

  // Outer base64url makes the whole thing one URL-path-safe segment with no dots.
  return Buffer.from(`${raw}.${sig}`, "utf8").toString("base64url");
}

export type CartHandoffFailure = "disabled" | "invalid" | "expired";

export type CartHandoffVerification =
  | { ok: true; sid: string }
  | { ok: false; reason: CartHandoffFailure };

/**
 * Verify a handoff token. Fails closed at every step.
 *
 * The token is intentionally REPLAYABLE within its TTL: the iOS flow requires the
 * same URL to be fetched twice — once by the in-app browser (which renders the
 * instructions page) and once by Safari (which redeems it). A replay only re-sets
 * the same cookie to the same value.
 */
export function verifyCartHandoffToken(token: string): CartHandoffVerification {
  const secret = getSecret();
  if (!secret) return { ok: false, reason: "disabled" };

  // 1. Charset + length, before decoding anything.
  if (typeof token !== "string" || !TOKEN_SHAPE.test(token)) {
    return { ok: false, reason: "invalid" };
  }

  // 2. Decode and check structure.
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const parts = decoded.split(".");
  if (parts.length !== 4) return { ok: false, reason: "invalid" };
  if (parts[0] !== TOKEN_VERSION) return { ok: false, reason: "invalid" };

  // 3. Signature — timing-safe, with the required equal-length guard.
  const raw = parts.slice(0, 3).join(".");
  const expected = Buffer.from(signRaw(raw, secret));
  const provided = Buffer.from(parts[3]);
  if (expected.length !== provided.length) return { ok: false, reason: "invalid" };
  if (!crypto.timingSafeEqual(expected, provided)) return { ok: false, reason: "invalid" };

  // 4. Expiry.
  const exp = Number(parts[2]);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }

  // 5. Payload shape.
  const sid = parts[1];
  if (!UUID_SHAPE.test(sid)) return { ok: false, reason: "invalid" };

  return { ok: true, sid };
}
