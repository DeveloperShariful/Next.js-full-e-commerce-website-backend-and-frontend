"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackVisitAction } from "@/app/actions/frontend/affiliate/trackVisitAction";

// Reads ?ref= from URL and records affiliate click to DB (runs once per page load)
export default function AffiliateTracker() {
  const searchParams = useSearchParams();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    const slug = searchParams.get("ref");
    if (!slug) return;

    tracked.current = true;
    trackVisitAction({
      affiliateSlug: slug,
      url: window.location.href,
      referrer: document.referrer,
      utmSource: searchParams.get("utm_source"),
      utmMedium: searchParams.get("utm_medium"),
      utmCampaign: searchParams.get("utm_campaign"),
    });
  }, [searchParams]);

  return null;
}
