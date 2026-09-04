// lib/in-app-browser.ts
//
// In-app browser (Facebook / Instagram / TikTok … WebView) detection.
//
// Kept separate from lib/cart-handoff.ts on purpose: that file imports node:crypto,
// and this one is imported by a client component. Splitting them keeps crypto out
// of the browser bundle.
//
// Pure functions, no imports — safe on both server and client.

// Meta first, then the other common ad-traffic WebViews.
// Deliberately NOT matched:
//   • GSA/      → Google Search App uses Custom Tabs, where wallets often work
//   • "; wv)"   → too broad; matches legitimate embedded WebViews
const IN_APP_RE =
  /FBAN|FBAV|FB_IAB|FBIOS|FBDV|Instagram|Messenger|Line\/|TikTok|musical_ly|Snapchat|Pinterest|LinkedInApp|MicroMessenger|Twitter/i;

export type InAppPlatform = "ios" | "android" | "other";

/** True when the UA belongs to a known in-app browser (WebView), not a real browser. */
export function isInAppBrowserUA(ua: string): boolean {
  if (!ua) return false;
  return IN_APP_RE.test(ua);
}

/** Which platform the in-app browser is running on — decides the escape instructions. */
export function inAppPlatform(ua: string): InAppPlatform {
  if (!ua) return "other";
  if (/iP(hone|ad|od)/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}
