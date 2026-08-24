// components/SourceTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackVisitAction } from '@/app/actions/frontend/affiliate/trackVisitAction';
import { logSiteVisit, markCheckoutReached } from '@/app/actions/frontend/analytics/logSiteVisit';

const UTM_STORAGE_KEY = 'utm_data';
const UTM_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 দিন — AffiliateClick cookie-র সাথে মেলানো

interface StoredUTM {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referringSite?: string;
  savedAt: number;
}

// কিছু বিজ্ঞাপন প্ল্যাটফর্মে (ভুল Tracking Template/Final URL suffix সেটআপে)
// একই লিংকে একই utm প্যারামিটার দুইবার থাকতে পারে — একবার un-substituted
// placeholder (যেমন Google Ads-এর ভুল "{campaignname}", যেটা আসলে কোনো বৈধ
// ValueTrack প্যারামিটার না, তাই Google তা replace না করেই লিটারেল রেখে দেয়)
// আর একবার আসল সঠিক মান (যেমন utm_campaign=23661992587)। URLSearchParams.get()
// শুধু প্রথমটাই রিটার্ন করে — যেটা এক্ষেত্রে ভুল হতে পারে। তাই getAll() দিয়ে
// সবগুলো মান দেখে, খালি আর placeholder-আকৃতির (যেমন {xyz} বা {{xyz}}) মান বাদ
// দিয়ে প্রথম আসল মানটা নেওয়া হচ্ছে।
const PLACEHOLDER_PATTERN = /^\{+[^{}]*\}+$/;
function getCleanParam(searchParams: URLSearchParams, key: string): string | null {
  for (const value of searchParams.getAll(key)) {
    const trimmed = value.trim();
    if (trimmed && !PLACEHOLDER_PATTERN.test(trimmed)) return trimmed;
  }
  return null;
}

const VISIT_ID_KEY = 'gb_visit_id';
const VISIT_START_KEY = 'gb_visit_start';
const CHECKOUT_MARKED_KEY = 'gb_checkout_marked';

// পেজ hidden হওয়ার মুহূর্তে (ট্যাব বদল/বন্ধ) sendBeacon দিয়ে "কতক্ষণ ছিল" পাঠানো
// হয় — একই SiteVisit row-এ আপডেট হয়, নতুন row তৈরি হয় না। sendBeacon ব্যবহার
// করা হচ্ছে fetch()-এর বদলে, কারণ পেজ unload হয়ে গেলেও ব্রাউজার এটা background-এ
// ঠিকই পাঠিয়ে দেয় (fetch() করলে navigation-এর মাঝে বাতিল হয়ে যেতে পারত)।
// visibilitychange (primary) + pagehide (backup, mobile-এ visibilitychange
// অনির্ভরযোগ্য হতে পারে) — দুটোই একই handler কল করে, একাধিকবার fire হলেও
// ক্ষতি নেই (পরের মানটা শুধু আগেরটাকে বড় সংখ্যা দিয়ে overwrite করে)।
function sendDurationBeacon() {
  try {
    const visitId = sessionStorage.getItem(VISIT_ID_KEY);
    const startStr = sessionStorage.getItem(VISIT_START_KEY);
    if (!visitId || !startStr) return;
    const durationSeconds = Math.round((Date.now() - Number(startStr)) / 1000);
    if (durationSeconds <= 0) return;
    const blob = new Blob([JSON.stringify({ visitId, durationSeconds })], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/track-duration', blob);
  } catch {}
}

const SourceTracker = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const visitTracked = useRef(false);

  // মাত্র একবার mount হয় — duration beacon listener রেজিস্টার করার জন্য
  useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === 'hidden') sendDurationBeacon();
    };
    document.addEventListener('visibilitychange', handleHide);
    window.addEventListener('pagehide', sendDurationBeacon);
    return () => {
      document.removeEventListener('visibilitychange', handleHide);
      window.removeEventListener('pagehide', sendDurationBeacon);
    };
  }, []);

  useEffect(() => {
    const affiliateId = searchParams.get('sld');
    const utmSource   = getCleanParam(searchParams, 'utm_source');
    const utmMedium   = getCleanParam(searchParams, 'utm_medium');
    const utmCampaign = getCleanParam(searchParams, 'utm_campaign');
    const utmContent  = getCleanParam(searchParams, 'utm_content');
    const utmTerm     = getCleanParam(searchParams, 'utm_term');
    const referrer    = document.referrer || '';

    // First-touch attribution: প্রথম যেখান থেকে আসছে সেটাই রাখব, পরের internal
    // navigation (checkout-এর দিকে যাওয়া) দিয়ে overwrite হবে না।
    const existing = getStoredUTM();
    const hasFreshExisting = existing.savedAt !== undefined;

    if ((utmSource || utmMedium || utmCampaign || utmContent || utmTerm) && !hasFreshExisting) {
      const data: StoredUTM = {
        utmSource:     utmSource    ?? undefined,
        utmMedium:     utmMedium    ?? undefined,
        utmCampaign:   utmCampaign  ?? undefined,
        utmContent:    utmContent   ?? undefined,
        utmTerm:       utmTerm      ?? undefined,
        referringSite: referrer     || undefined,
        savedAt: Date.now(),
      };
      try { localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data)); } catch {}
    } else if (!hasFreshExisting && referrer) {
      // UTM নেই কিন্তু বাইরে থেকে এসেছে (organic/social referral) — প্রথমবার সেভ করব
      try {
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify({ referringSite: referrer, savedAt: Date.now() }));
      } catch {}
    }

    if (!visitTracked.current || affiliateId) {
      const track = async () => {
        try {
          // দুটো আলাদা কাজ — affiliate-specific tracking আর general site-wide
          // visit logging — একসাথে, non-blocking ভাবে চালানো হচ্ছে (কোনোটাই
          // পেজ রেন্ডার আটকায় না)। logSiteVisit-এর নিজস্ব session-cookie
          // dedup আছে, তাই বারবার call হলেও duplicate row তৈরি হবে না।
          const [, visitResult] = await Promise.all([
            trackVisitAction({
              affiliateSlug: affiliateId,
              url: window.location.href,
              referrer,
              utmSource,
              utmMedium,
              utmCampaign,
            }),
            logSiteVisit({
              url: window.location.href,
              referrer,
              utmSource,
              utmMedium,
              utmCampaign,
              utmContent,
              utmTerm,
            }),
          ]);
          visitTracked.current = true;

          // এই ট্যাবে প্রথমবার row তৈরি হলেই (skipped না) তার id + start time
          // সেভ করা হচ্ছে — পুরো সেশনে একবারই, পরের navigation-এ overwrite হবে না।
          if (visitResult?.visitId && !sessionStorage.getItem(VISIT_ID_KEY)) {
            try {
              sessionStorage.setItem(VISIT_ID_KEY, visitResult.visitId);
              sessionStorage.setItem(VISIT_START_KEY, String(Date.now()));
            } catch {}
          }
        } catch (error) {
          console.error('[SourceTracker] Visit tracking failed:', error);
        }
      };

      track();
    }

    // checkout পেজে পৌঁছালো কিনা — order বসাক বা না বসাক, স্বতন্ত্র সিগন্যাল।
    // প্রতিটা pathname বদলে চেক হয় (visitTracked ref-এর ওপর নির্ভর করে না, কারণ
    // visitor প্রথমে অন্য পেজ দেখে পরে checkout-এ আসতে পারে), কিন্তু সেশনে
    // একবারই মার্ক হয় (sessionStorage flag দিয়ে dedup)।
    if (pathname === '/checkout') {
      try {
        const visitId = sessionStorage.getItem(VISIT_ID_KEY);
        if (visitId && !sessionStorage.getItem(CHECKOUT_MARKED_KEY)) {
          sessionStorage.setItem(CHECKOUT_MARKED_KEY, '1');
          markCheckoutReached(visitId).catch(() => {});
        }
      } catch {}
    }
  }, [searchParams, pathname]);

  return null;
};

export default SourceTracker;

// checkout-এ localStorage থেকে UTM data পড়ার helper — CheckoutClient ও PayPal-এ ব্যবহার হবে।
// ৩০ দিনের বেশি পুরনো হলে (মেয়াদোত্তীর্ণ) খালি অবজেক্ট রিটার্ন করে।
export function getStoredUTM(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referringSite?: string;
  savedAt?: number;
} {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredUTM;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > UTM_MAX_AGE_MS) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}
