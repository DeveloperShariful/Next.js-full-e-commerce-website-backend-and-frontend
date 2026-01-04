//app/(admin)/admin/settings/marketing-settings/_components/merchant-center/merchant-main-view.tsx

"use client";

import { useFormContext } from "react-hook-form";
import { MerchantConnectionSettings } from "./connection-settings"; // আগেই দেওয়া হয়েছে
import { MerchantStatsCard } from "./stats-card";
import { MerchantSyncManager } from "./sync-manager";
import { MerchantDiagnosticsTable } from "./diagnostics-table";

export function MerchantMainView() {
  const form = useFormContext();
  const isEnabled = form.watch("gmcContentApiEnabled");
  const isVerified = form.watch("verificationStatus.merchantCenter");

  return (
    <div className="space-y-6">
      {/* 1. Connection Settings (Always Visible) */}
      <MerchantConnectionSettings />

      {/* 2. Advanced Dashboard (Visible only if Connected) */}
      {isEnabled && isVerified ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
            <hr className="border-slate-200" />
            
            <div className="flex flex-col space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">Sync Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                    Monitor your Google Shopping feed status and fix issues directly.
                </p>
            </div>

            {/* Stats */}
            <MerchantStatsCard />

            {/* Sync Controls */}
            <MerchantSyncManager />

            {/* Error Logs */}
            <MerchantDiagnosticsTable />
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed">
            <p className="text-muted-foreground">
                Connect and Verify Google Merchant Center to view the Sync Dashboard.
            </p>
        </div>
      )}
    </div>
  );
}