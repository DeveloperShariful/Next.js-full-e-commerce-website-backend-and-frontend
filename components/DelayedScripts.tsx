//components/DelayedScripts.tsx

"use client";

import { useEffect, useRef } from 'react';

const GTM_ID = 'GTM-MBDS8NJQ';
const KLAVIYO_API_KEY = 'VbbJYB';
const FALLBACK_TIMER_MS = 12000; 

export default function DelayedScripts() {
  const isLoadedRef = useRef(false);

  useEffect(() => {
   
    const loadScripts = () => {
      if (isLoadedRef.current) return;
      isLoadedRef.current = true;

      console.log('User interaction detected (or timeout reached). Loading GTM & Klaviyo...');

      // 1. Google Tag Manager (GTM) Script Injection
      const gtmScript = document.createElement('script');
      gtmScript.id = 'gtm-script';
      gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;
      document.head.appendChild(gtmScript);
      
      // GTM NoScript (Optional)
      const gtmNoScript = document.createElement('noscript');
      gtmNoScript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
      document.body.prepend(gtmNoScript);

      // 2. Klaviyo Script Injection
      const klaviyoScript = document.createElement('script');
      klaviyoScript.id = 'klaviyo-script';
      klaviyoScript.async = true;
      klaviyoScript.src = `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${KLAVIYO_API_KEY}`;
      document.body.appendChild(klaviyoScript);
      removeInteractionListeners();
    };

    const addInteractionListeners = () => {
      window.addEventListener('mousemove', loadScripts, { passive: true, once: true }); 
      window.addEventListener('touchstart', loadScripts, { passive: true, once: true }); 
      window.addEventListener('scroll', loadScripts, { passive: true, once: true }); 
      window.addEventListener('keydown', loadScripts, { passive: true, once: true }); 
    };

    const removeInteractionListeners = () => {
      window.removeEventListener('mousemove', loadScripts);
      window.removeEventListener('touchstart', loadScripts);
      window.removeEventListener('scroll', loadScripts);
      window.removeEventListener('keydown', loadScripts);
    };

    addInteractionListeners();

    const timer = setTimeout(loadScripts, FALLBACK_TIMER_MS);

    return () => {
      clearTimeout(timer);
      removeInteractionListeners();
    };

  }, []);

  return null;
}