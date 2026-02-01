//hooks/use-affiliate-tracker.ts

"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function useAffiliateTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const hasLogged = useRef(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && !hasLogged.current) {
      hasLogged.current = true;
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