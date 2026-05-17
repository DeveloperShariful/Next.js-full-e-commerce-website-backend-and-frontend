//app/admin/loading.tsx

import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    // 🚀 WP Style: Minimalistic Loading state with WP Gray/Blue
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#f0f0f1]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#2271b1]" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-[13px] font-medium text-[#3c434a]">Loading...</p>
        </div>
      </div>
    </div>
  );
}