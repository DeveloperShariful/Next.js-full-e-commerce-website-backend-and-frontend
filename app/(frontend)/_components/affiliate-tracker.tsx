"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackVisitAction } from "@/app/actions/frontend/affiliate/trackVisitAction";

interface Props {
  affiliateParam?: string;
}

export default function AffiliateTracker({ affiliateParam = "ref" }: Props) {
  const searchParams = useSearchParams();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    const slug = searchParams.get(affiliateParam);
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
  }, [searchParams, affiliateParam]);

  return null;
}
