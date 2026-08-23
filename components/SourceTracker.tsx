// components/SourceTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackVisitAction } from '@/app/actions/frontend/affiliate/trackVisitAction';
import { logSiteVisit } from '@/app/actions/frontend/analytics/logSiteVisit';

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

const SourceTracker = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const visitTracked = useRef(false);

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
          await Promise.all([
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
        } catch (error) {
          console.error('[SourceTracker] Visit tracking failed:', error);
        }
      };

      track();
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
