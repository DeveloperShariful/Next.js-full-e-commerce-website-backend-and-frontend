// components/SourceTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackVisitAction } from '@/app/actions/storefront/affiliate/trackVisitAction';

const SourceTracker = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const visitTracked = useRef(false);

  useEffect(() => {
    const affiliateId = searchParams.get('sld');
    const utmSource = searchParams.get('utm_source');
    if (!visitTracked.current || affiliateId) {
        
        const track = async () => {
            try {
                await trackVisitAction({
                    affiliateSlug: affiliateId,
                    url: window.location.href,
                    referrer: document.referrer || '',
                    utmSource: utmSource,
                    utmMedium: searchParams.get('utm_medium'),
                    utmCampaign: searchParams.get('utm_campaign'),
                });
                
                // শুধু অ্যাফিলিয়েট ট্র্যাক করার পর ফ্ল্যাগ ট্রু করব
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
  }, [searchParams, pathname]); // pathname অ্যাড করা হয়েছে যাতে প্রতি পেজে ভিউ কাউন্ট হয়

  return null;
};

export default SourceTracker;