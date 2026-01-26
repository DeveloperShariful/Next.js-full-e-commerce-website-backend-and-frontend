//app/(storefront)/checkout/order-success/affiliate-pixel-renderer.tsx

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

interface Props {
  affiliateId: string | null;
  orderTotal: number;
  orderId: string;
  currency: string;
}

interface PixelData {
  id: string;
  type: string;
  pixelId: string;
}

export default function AffiliatePixelRenderer({ affiliateId, orderTotal, orderId, currency }: Props) {
  const [pixels, setPixels] = useState<PixelData[]>([]);

  useEffect(() => {
    if (!affiliateId) return;

    // সার্ভার অ্যাকশন বা API দিয়ে পিক্সেল ফেচ করা
    // এখানে আমরা সরাসরি API কল করছি
    const fetchPixels = async () => {
      try {
        const res = await fetch(`/api/tracking/pixels?affiliateId=${affiliateId}`);
        const data = await res.json();
        if (data.pixels) {
          setPixels(data.pixels);
        }
      } catch (error) {
        console.error("Failed to load tracking pixels", error);
      }
    };

    fetchPixels();
  }, [affiliateId]);

  if (!affiliateId || pixels.length === 0) return null;

  return (
    <>
      {pixels.map((pixel) => {
        // --- FACEBOOK PIXEL ---
        if (pixel.type === "FACEBOOK") {
          return (
            <Script key={pixel.id} id={`fb-pixel-${pixel.id}`} strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixel.pixelId}');
                fbq('track', 'Purchase', {value: ${orderTotal}, currency: '${currency}', content_ids: ['${orderId}'], content_type: 'product'});
              `}
            </Script>
          );
        }

        // --- GOOGLE ADS / ANALYTICS ---
        if (pixel.type === "GOOGLE") {
          return (
            <div key={pixel.id}>
               <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${pixel.pixelId}`}
                strategy="afterInteractive"
              />
              <Script id={`google-pixel-${pixel.id}`} strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${pixel.pixelId}');
                  gtag('event', 'purchase', {
                    transaction_id: '${orderId}',
                    value: ${orderTotal},
                    currency: '${currency}'
                  });
                `}
              </Script>
            </div>
          );
        }

        // --- TIKTOK PIXEL ---
        if (pixel.type === "TIKTOK") {
             // TikTok script implementation here...
             return null; 
        }

        return null;
      })}
    </>
  );
}