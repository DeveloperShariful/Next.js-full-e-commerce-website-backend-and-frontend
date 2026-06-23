// components/DelayedScripts.tsx
'use client';

import { useEffect, useRef } from 'react';

interface DelayedScriptsProps {
  gtmId?: string | null;
  klaviyoKey?: string | null;
}

const FALLBACK_TIMER_MS = 12000;

export default function DelayedScripts({ gtmId, klaviyoKey }: DelayedScriptsProps) {
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // কোনো script না থাকলে কিছুই করার নেই
    if (!gtmId && !klaviyoKey) return;

    const loadScripts = () => {
      if (isLoadedRef.current) return;
      isLoadedRef.current = true;

      // 1. Google Tag Manager (FB Pixel, TikTok, GA4 — সব GTM এর ভেতর থেকে fire হয়)
      if (gtmId) {
        const gtmScript = document.createElement('script');
        gtmScript.id = 'gtm-script';
        gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
        document.head.appendChild(gtmScript);

        const gtmNoScript = document.createElement('noscript');
        gtmNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.prepend(gtmNoScript);
      }

      // 2. Klaviyo (GTM দিয়ে সাধারণত manage হয় না, আলাদা script লাগে)
      if (klaviyoKey) {
        const klaviyoScript = document.createElement('script');
        klaviyoScript.id = 'klaviyo-script';
        klaviyoScript.async = true;
        klaviyoScript.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${klaviyoKey}`;
        document.body.appendChild(klaviyoScript);
      }

      removeListeners();
    };

    const addListeners = () => {
      window.addEventListener('mousemove', loadScripts, { passive: true, once: true });
      window.addEventListener('touchstart', loadScripts, { passive: true, once: true });
      window.addEventListener('scroll', loadScripts, { passive: true, once: true });
      window.addEventListener('keydown', loadScripts, { passive: true, once: true });
    };

    const removeListeners = () => {
      window.removeEventListener('mousemove', loadScripts);
      window.removeEventListener('touchstart', loadScripts);
      window.removeEventListener('scroll', loadScripts);
      window.removeEventListener('keydown', loadScripts);
    };

    addListeners();
    // user interaction না হলে 12 সেকেন্ড পরে automatically load হবে
    const timer = setTimeout(loadScripts, FALLBACK_TIMER_MS);

    return () => {
      clearTimeout(timer);
      removeListeners();
    };
  }, [gtmId, klaviyoKey]);

  return null;
}
