// components/SourceTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackVisitAction } from '@/app/actions/frontend/affiliate/trackVisitAction';

const SourceTracker = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const visitTracked = useRef(false);

  useEffect(() => {
    const affiliateId = searchParams.get('sld');
    const utmSource   = searchParams.get('utm_source');
    const utmMedium   = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const referrer    = document.referrer || '';

    // UTM params থাকলে sessionStorage-এ সেভ করি — checkout-এ order-এর সাথে পাঠানো হবে
    if (utmSource || utmMedium || utmCampaign) {
      sessionStorage.setItem('utm_data', JSON.stringify({
        utmSource:     utmSource    ?? undefined,
        utmMedium:     utmMedium    ?? undefined,
        utmCampaign:   utmCampaign  ?? undefined,
        referringSite: referrer     || undefined,
      }));
    } else if (!sessionStorage.getItem('utm_data') && referrer) {
      // UTM নেই কিন্তু বাইরে থেকে এসেছে (organic) — শুধু প্রথমবার সেভ করব
      sessionStorage.setItem('utm_data', JSON.stringify({ referringSite: referrer }));
    }

    if (!visitTracked.current || affiliateId) {
      const track = async () => {
        try {
          await trackVisitAction({
            affiliateSlug: affiliateId,
            url: window.location.href,
            referrer,
            utmSource,
            utmMedium,
            utmCampaign,
          });

          if (affiliateId) {
            console.log('%c[Enterprise-Tracker] Secure Affiliate Visit Logged', 'color: #00ff00; font-weight: bold;');
          }
          visitTracked.current = true;
        } catch (error) {
          console.error('[Enterprise-Tracker] Critical Error:', error);
        }
      };

      track();
    }
  }, [searchParams, pathname]);

  return null;
};

export default SourceTracker;

// checkout-এ sessionStorage থেকে UTM data পড়ার helper — CheckoutClient ও PayPal-এ ব্যবহার হবে
export function getStoredUTM(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referringSite?: string;
} {
  try {
    const raw = sessionStorage.getItem('utm_data');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
