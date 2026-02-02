//app/providers/affiliate-tracker-provider.tsx

"use client";

import { useAffiliateTracker } from "@/hooks/use-affiliate-tracker";
import { Suspense } from "react";

function TrackerLogic() {
  useAffiliateTracker();
  return null; 
}

export function AffiliateTrackerProvider() {
  return (
    <Suspense fallback={null}>
      <TrackerLogic />
    </Suspense>
  );
}