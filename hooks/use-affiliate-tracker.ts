//hooks/use-affiliate-tracker.ts

"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function useAffiliateTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // React Strict Mode এ দুইবার লগ হওয়া আটকানোর জন্য ref ব্যবহার করা হচ্ছে
  const hasLogged = useRef(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    
    // যদি URL এ ref থাকে এবং এখনো লগ না হয়ে থাকে
    if (ref && !hasLogged.current) {
      hasLogged.current = true;

      // ব্যাকগ্রাউন্ডে API কল (ইউজারকে ব্লক করবে না)
      const logClick = async () => {
        try {
          await fetch("/api/tracking/click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: ref,
              path: pathname,
              referrer: document.referrer || "Direct",
            }),
          });
          console.log("🔗 Affiliate click tracked:", ref);
        } catch (error) {
          console.error("Tracking failed silently", error);
        }
      };

      logClick();
    }
  }, [searchParams, pathname]);
}