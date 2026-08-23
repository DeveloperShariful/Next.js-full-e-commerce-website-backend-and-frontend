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

const SourceTracker = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const visitTracked = useRef(false);

  useEffect(() => {
    const affiliateId = searchParams.get('sld');
    const utmSource   = searchParams.get('utm_source');
    const utmMedium   = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const utmContent  = searchParams.get('utm_content');
    const utmTerm     = searchParams.get('utm_term');
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
