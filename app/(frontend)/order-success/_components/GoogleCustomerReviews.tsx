// app/(frontend)/order-success/_components/GoogleCustomerReviews.tsx
//
// Google Customer Reviews (GCR) opt-in module — order confirmation পেজে বসে।
// কাস্টমার opt-in করলে Google আনুমানিক ডেলিভারির কয়েকদিন পর তাকে একটা সার্ভে
// ইমেইল পাঠায়; সেই রেটিং verified review হিসেবে Product Ratings + Store Ratings-এ
// যোগ হয়।
//
// ★ শুধু নতুন order-এর জন্য কাজ করে (কাস্টমার এই পেজে থাকা অবস্থায়) — পুরনো order
//   এভাবে backfill করা যায় না।
// ★ localhost-এ opt-in ব্যাজ সাধারণত render হয় না — Google merchant account যে
//   domain-এ verified (gobike.au) শুধু সেখানেই দেখায়। script load হওয়া / render()
//   কল হওয়া DevTools-এ verify করা যায়, কিন্তু আসল ব্যাজ দেখতে production লাগবে।
// ★ products অ্যারে শুধু gtin নেয় (Google-এর নিয়ম) — GTIN না থাকলে বাদ, তখন GCR
//   শুধু store/seller rating সংগ্রহ করে, per-product নয়।

"use client";

import Script from "next/script";

interface Props {
  merchantId: string | number;
  orderId: string;
  email: string;
  deliveryCountry: string;      // ISO country code, e.g. "AU"
  estimatedDeliveryDate: string; // "YYYY-MM-DD"
  productGtins?: string[];
}

export default function GoogleCustomerReviews({
  merchantId,
  orderId,
  email,
  deliveryCountry,
  estimatedDeliveryDate,
  productGtins = [],
}: Props) {
  const midNum = Number(merchantId);
  // Google survey পাঠাতে email + valid merchant_id আবশ্যক
  if (!email || !orderId || !Number.isFinite(midNum) || midNum <= 0) return null;

  const config: Record<string, unknown> = {
    merchant_id: midNum,
    order_id: orderId,
    email,
    delivery_country: deliveryCountry || "AU",
    estimated_delivery_date: estimatedDeliveryDate,
  };
  if (productGtins.length > 0) {
    config.products = productGtins.map((gtin) => ({ gtin }));
  }

  return (
    <>
      {/* window.renderOptIn — platform.js load শেষে ?onload= দিয়ে এটাই কল হয়।
          তাই platform.js-এর আগে define হওয়া দরকার (afterInteractive inline script
          external fetch-এর আগেই run হয়)। */}
      <Script id="gcr-optin-config" strategy="afterInteractive">
        {`
          window.renderOptIn = function() {
            window.gapi.load('surveyoptin', function() {
              window.gapi.surveyoptin.render(${JSON.stringify(config)});
            });
          };
        `}
      </Script>
      <Script
        src="https://apis.google.com/js/platform.js?onload=renderOptIn"
        strategy="afterInteractive"
      />
    </>
  );
}
