//app/providers/affiliate-tracker-provider.tsx

"use client";

import { useAffiliateTracker } from "@/hooks/use-affiliate-tracker";
import { Suspense } from "react";

function TrackerLogic() {
  // হুকটি এখানে কল করা হলো
  useAffiliateTracker();
  return null; // এটি UI তে কিছু দেখাবে না, শুধু লজিক রান করবে
}

export function AffiliateTrackerProvider() {
  return (
    // useSearchParams ব্যবহার করায় Suspense বাউন্ডারি প্রয়োজন
    <Suspense fallback={null}>
      <TrackerLogic />
    </Suspense>
  );
}