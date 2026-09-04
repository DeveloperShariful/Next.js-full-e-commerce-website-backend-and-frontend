// app/(frontend)/checkout/components/WalletEscapeHatch.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { isInAppBrowserUA, inAppPlatform, type InAppPlatform } from '@/lib/in-app-browser';
import { createCartHandoffAction } from '@/app/actions/frontend/checkout/createCartHandoffAction';

interface WalletEscapeHatchProps {
  /**
   * True when Stripe reported no available wallets. Kept as a prop (rather than
   * conditionally mounting the component) so ExpressCheckouts' child-slot count
   * never changes — see the comment above <Elements> there.
   */
  active: boolean;
}

// Local cast, matching the (window as { paypal?: ... }) idiom in
// PayPalPaymentGateway.tsx:218. dataLayer is a plain array that GTM REPLAYS on
// load, so pushes made before DelayedScripts' 12s delay are not lost.
function pushDataLayer(event: string, platform: InAppPlatform) {
  try {
    const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, platform });
  } catch {
    /* analytics must never break checkout */
  }
}

/**
 * Rendered in place of the Express Checkout Element when Apple Pay / Google Pay /
 * Link are unavailable AND the visitor is in an in-app browser (Facebook,
 * Instagram, …). Offers a link that carries the cart into their real browser.
 *
 * Returns null in every other case.
 */
export default function WalletEscapeHatch({ active }: WalletEscapeHatchProps) {
  const fired = useRef(false);

  // One piece of state, written once from an async callback — never
  // synchronously inside the effect body, which would cascade renders.
  const [handoff, setHandoff] = useState<{ url: string; platform: InAppPlatform } | null>(null);

  // Only ever populated when ?ecdebug=1 is in the URL. A real customer never
  // has that, so this cannot appear in normal checkout.
  const [debugNote, setDebugNote] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDebug = window.location.search.includes('ecdebug=1');

    // Stripe still reports a wallet (or is still probing) — nothing to offer.
    // No debug note here: setState directly in an effect body cascades renders.
    // If nothing appears under ?ecdebug=1, add &forcenowallet=1 to pin the probe.
    if (!active) return;

    if (fired.current) return;

    const ua = navigator.userAgent || '';
    const inApp = isInAppBrowserUA(ua);

    // UA is a GUARD, not the trigger. Wallet-absence decides whether to show
    // something; this decides whether "open in your browser" makes any sense.
    // Showing it to someone already in Chrome would be embarrassing, and
    // availablePaymentMethods can be undefined in real browsers too (Link off,
    // privacy settings, ad-blockers mangling the iframe).
    if (!isDebug && !inApp) return;

    fired.current = true;
    const detected = inAppPlatform(ua);

    createCartHandoffAction()
      .then((result) => {
        if (result.enabled) {
          setHandoff({ url: result.url, platform: detected });
          pushDataLayer('wallet_escape_shown', detected);
          return;
        }
        if (isDebug) {
          setDebugNote(
            `inApp=${inApp} platform=${detected} → server said DISABLED. ` +
            `Check Vercel Runtime Logs for "[cart-handoff]" — the "reason" field says which gate blocked it.`
          );
        }
      })
      .catch((err: unknown) => {
        // Never surface a handoff failure on the checkout page.
        if (isDebug) setDebugNote(`action threw: ${err instanceof Error ? err.message : String(err)}`);
      });
  }, [active]);

  // `active &&` matters: a late onReady can self-correct the probe back to
  // 'available', and the prompt must disappear when it does.
  if (active && handoff) {
    const { url, platform } = handoff;

    const walletLabel =
      platform === 'ios'
        ? 'Apple Pay'
        : platform === 'android'
          ? 'Google Pay'
          : 'Apple Pay or Google Pay';

    const buttonLabel =
      platform === 'ios'
        ? 'Open in Safari'
        : platform === 'android'
          ? 'Open in Chrome'
          : 'Open in your browser';

    return (
      <>
        <div className="w-full py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 text-center space-y-2">
          <p>
            Want to pay in one tap with <strong>{walletLabel}</strong>? It&rsquo;s not
            available inside this app&rsquo;s browser.
          </p>
          <a
            href={url}
            onClick={() => pushDataLayer('wallet_escape_clicked', platform)}
            className="inline-block bg-yellow-700 text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-yellow-800 transition-colors"
          >
            {buttonLabel} &rarr;
          </a>
          <p className="text-xs text-yellow-700">Your cart comes with you.</p>
        </div>

        {/* Owns the divider while visible, so exactly one — OR — shows in every state */}
        <div className="text-center text-[#6b7280] font-medium text-sm mt-2.5">— OR —</div>
      </>
    );
  }

  // Debug-only diagnostic, so the reason is visible on a phone where there are
  // no devtools. Requires ?ecdebug=1 in the URL.
  if (debugNote) {
    return (
      <div className="w-full py-2 px-3 bg-slate-100 border border-slate-300 rounded-md text-[11px] leading-snug text-slate-700 break-words">
        <strong>ecdebug:</strong> {debugNote}
      </div>
    );
  }

  return null;
}
