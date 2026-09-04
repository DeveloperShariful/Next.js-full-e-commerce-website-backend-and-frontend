// app/open/[token]/route.ts
//
// Cart handoff endpoint. ONE url, TWO behaviours, decided by User-Agent:
//
//   in-app browser (FB/IG WebView) → 200 HTML instructions page, NO redirect
//   real browser (Chrome/Safari)   → set cart_session cookie, 302 to clean /cart
//
// Why one route and not two: whatever URL the in-app browser is SITTING ON is the
// URL Safari opens when the user taps "⋯ → Open in Safari". So the instructions
// page and the redemption endpoint must be the same URL. That is what makes the
// iOS flow work without any undocumented scheme.
//
// Structure modelled on app/go/[slug]/route.ts — redirect home on any failure,
// cookies set on the redirect response.

import { NextRequest, NextResponse } from "next/server";
import { verifyCartHandoffToken } from "@/lib/cart-handoff";
import { isInAppBrowserUA, inAppPlatform, type InAppPlatform } from "@/lib/in-app-browser";

export const dynamic = "force-dynamic";

// A UA-varying response that got edge-cached would be a nasty bug.
const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, private",
  Vary: "User-Agent",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};

function applyHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// Funnel instrumentation — grep Vercel Runtime Logs for "[cart-handoff]".
function log(branch: string, platform: InAppPlatform) {
  console.log("[cart-handoff]", JSON.stringify({ branch, platform }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const home = new URL("/", request.url);

  try {
    const token = (await params).token;
    const ua = request.headers.get("user-agent") || "";
    const platform = inAppPlatform(ua);

    const result = verifyCartHandoffToken(token);
    if (!result.ok) {
      // Stale or tampered link → homepage, never an error page.
      log(result.reason, platform);
      return NextResponse.redirect(home);
    }

    // ── Branch A: still inside the in-app browser → park here, show the way out ──
    if (isInAppBrowserUA(ua)) {
      log("instructions", platform);
      const response = new NextResponse(renderInstructions(request, token, platform), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
      return applyHeaders(response);
    }

    // ── Branch B: a real browser → restore the cart key, land on a clean /cart ──
    // If the UA regex ever misses a new FB build we land here inside the WebView:
    // it re-sets a cookie it already has and shows /cart. Useless, but harmless.
    log("redeem", platform);
    const response = NextResponse.redirect(new URL("/cart", request.url));

    // Byte-for-byte identical to cartActions.ts:56-60 — deliberately no `secure`
    // and no `sameSite`, so this never diverges from what the cart itself sets.
    // Omitted sameSite defaults to Lax, correct for a top-level GET navigation.
    response.cookies.set("cart_session", result.sid, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      path: "/",
    });

    return applyHeaders(response);
  } catch (error) {
    console.error("[cart-handoff] UNEXPECTED", error);
    return NextResponse.redirect(home);
  }
}

// ============================================================================
// Instructions page — inline styles only, no layout/provider coupling.
// ============================================================================
function renderInstructions(
  request: NextRequest,
  token: string,
  platform: InAppPlatform
): string {
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const selfUrl = `${proto}://${host}/open/${token}`;

  // Android can be forced straight into Chrome. S.browser_fallback_url reloads
  // THIS page if Chrome is absent or the scheme is blocked, so the written
  // instructions below stay visible rather than the user hitting a dead tap.
  const intentUrl =
    `intent://${host}/open/${token}` +
    `#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(selfUrl)};end`;

  const isIOS = platform === "ios";
  const isAndroid = platform === "android";

  const walletName = isIOS ? "Apple Pay" : isAndroid ? "Google Pay" : "one-tap payment";
  const menuIcon = isIOS ? "&#8943;" : "&#8942;"; // ⋯ vs ⋮
  const menuCorner = "top-right";
  const menuAction = isIOS ? "Open in Safari" : isAndroid ? "Open in Chrome" : "Open in Browser";

  const androidButton = isAndroid
    ? `<a class="btn" href="${intentUrl}">Open in Chrome &rarr;</a>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Open in your browser</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:24px 20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
       background:#f9f9f9;color:#1f2937;line-height:1.55;-webkit-font-smoothing:antialiased}
  .card{max-width:420px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:24px 20px}
  h1{margin:0 0 6px;font-size:20px;line-height:1.3;color:#111827}
  .sub{margin:0 0 20px;font-size:14px;color:#6b7280}
  ol{margin:0;padding-left:20px;font-size:15px}
  li{margin-bottom:10px}
  .kbd{display:inline-block;min-width:26px;text-align:center;padding:1px 7px;border:1px solid #d1d5db;
       border-radius:5px;background:#f3f4f6;font-size:15px;line-height:1.5;font-weight:600}
  b{color:#111827}
  .note{margin:20px 0 0;padding:12px 14px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;
        font-size:13px;color:#854d0e;text-align:center}
  .btn{display:block;margin:20px 0 0;padding:14px;background:#111827;color:#fff;text-decoration:none;
       text-align:center;font-weight:600;font-size:15px;border-radius:8px}
  .back{display:block;margin:16px 0 0;text-align:center;font-size:13px;color:#6b7280}
</style>
</head>
<body>
  <div class="card">
    <h1>One more tap to use ${walletName}</h1>
    <p class="sub">${walletName} isn&rsquo;t available inside this app&rsquo;s built-in browser.</p>
    <ol>
      <li>Tap <span class="kbd">${menuIcon}</span> at the ${menuCorner} of this window</li>
      <li>Choose <b>${menuAction}</b></li>
    </ol>
    ${androidButton}
    <p class="note">&#128722; Your cart is saved &mdash; it&rsquo;ll be waiting for you.</p>
    <a class="back" href="/checkout">&larr; Back to checkout</a>
  </div>
</body>
</html>`;
}
