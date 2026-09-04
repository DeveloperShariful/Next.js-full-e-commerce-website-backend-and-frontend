// app/actions/frontend/checkout/createCartHandoffAction.ts
"use server";

import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { mintCartHandoffToken } from "@/lib/cart-handoff";

// Same structural session type as cartActions.ts — avoids the NextAuth v5
// overload resolution bug where `auth()` resolves to NextMiddleware.
type AuthUser = {
  id?: string | null;
  email?: string | null;
};
type AuthSession = { user?: AuthUser | null } | null;

export type CartHandoffResult = { enabled: false } | { enabled: true; url: string };

/**
 * Every "no" gets logged so the reason is greppable in Vercel Runtime Logs
 * ("[cart-handoff]"). The client only ever receives { enabled: false } — the
 * reason stays server-side.
 */
function refuse(reason: string): { enabled: false } {
  console.log("[cart-handoff]", JSON.stringify({ branch: "mint_refused", reason }));
  return { enabled: false };
}

async function resolveUserId(session: AuthSession): Promise<string | null> {
  if (!session?.user) return null;
  if (session.user.id) return session.user.id;
  if (session.user.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    return user?.id || null;
  }
  return null;
}

/**
 * Mint a short-lived link that carries the current cart into the user's real
 * browser. Called from WalletEscapeHatch when Stripe reports no wallets AND the
 * UA is an in-app browser.
 *
 * Never throws — returns { enabled: false } for every failure, so the caller can
 * simply render nothing.
 */
export async function createCartHandoffAction(): Promise<CartHandoffResult> {
  try {
    // ── Kill switch 1: admin toggle. Opt-in, DEFAULT OFF ─────────────────────
    // Note `!== true`, not the codebase's usual `!== false`: merging this code
    // must not be the same event as turning the feature on.
    //
    // Read straight from the DB rather than getCachedStoreSettings() — that one
    // is unstable_cache with a 24h revalidate, so a freshly flipped toggle could
    // read stale. applyCouponAction (cartActions.ts:429) reads it the same
    // direct way for the same reason.
    const settings = await db.storeSettings.findUnique({
      where: { id: "settings" },
      select: { generalConfig: true },
    });
    const generalConfig = settings?.generalConfig as unknown as {
      enableWalletEscapeHatch?: boolean;
    } | null;
    if (generalConfig?.enableWalletEscapeHatch !== true) return refuse("toggle_off");

    // ── Kill switch 2: secret must be configured ────────────────────────────
    if (!process.env.CART_HANDOFF_SECRET) return refuse("no_secret");

    const [cookieStore, rawSession, headerList] = await Promise.all([
      cookies(),
      auth(),
      headers(),
    ]);
    const session = rawSession as AuthSession;
    const userId = await resolveUserId(session);

    let sid: string;

    if (userId) {
      // Logged in: the cart row is keyed by userId and the new browser has no
      // auth session, so a plain cookie copy would not resolve. Stamp a fresh
      // random sessionId on the row instead.
      //
      // Safe because: the original browser still resolves by userId
      // (cartActions.ts:64, untouched); the new browser resolves by this
      // sessionId; the value is fresh-random so it cannot collide; and a later
      // sign-in in the new browser finds no guest row to merge (cartActions.ts:69-71)
      // then resolves by userId to the same row — no duplicate, no double-merge.
      //
      // updateMany, not update: update({ where: { userId } }) throws P2025 when
      // no cart exists.
      const handoffSid = crypto.randomUUID();
      const { count } = await db.cart.updateMany({
        where: { userId },
        data: { sessionId: handoffSid },
      });
      if (count !== 1) return refuse(`user_cart_rows_${count}`);
      sid = handoffSid;
    } else {
      // Guest: reuse the existing cart key. No DB write.
      const existing = cookieStore.get("cart_session")?.value;
      if (!existing) return refuse("no_cart_cookie");

      const cart = await db.cart.findFirst({
        where: { sessionId: existing },
        select: { id: true },
      });
      if (!cart) return refuse("no_cart_row");

      sid = existing;
    }

    const token = mintCartHandoffToken(sid);
    if (!token) return refuse("mint_returned_null");

    // Build the origin from the REQUEST, never from an env var. cart_session is
    // host-only (no domain attribute), so gobike.au and www.gobike.au are
    // different cookies — and this repo defines both NEXT_PUBLIC_SITE_URL and
    // NEXT_PUBLIC_APP_URL and uses them interchangeably. If they disagreed on the
    // www prefix the handoff would silently fail.
    const host = headerList.get("host");
    if (!host) return refuse("no_host_header");
    const proto = headerList.get("x-forwarded-proto") || "https";

    console.log("[cart-handoff]", JSON.stringify({ branch: "minted", host }));
    return { enabled: true, url: `${proto}://${host}/open/${token}` };
  } catch (error) {
    console.error("[cart-handoff] MINT_FAILED", error);
    return { enabled: false };
  }
}
