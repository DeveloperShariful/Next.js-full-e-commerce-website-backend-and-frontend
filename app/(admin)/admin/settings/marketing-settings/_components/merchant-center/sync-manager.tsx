//app/(admin)/admin/settings/marketing-settings/_components/merchant-center/sync-manager.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { syncProductsToGoogle } from "@/app/actions/admin/settings/marketing-settings/merchant_center/sync-products";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress"; // Ensure you have this shadcn component

export function MerchantSyncManager() {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<{success: boolean, message: string} | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setProgress(10); // Start progress
    setLastSyncResult(null);

    // Simulate progress while waiting (since server action is one-shot)
    const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 500);

    try {
        const result = await syncProductsToGoogle();
        
        clearInterval(interval);
        setProgress(100);
        
        if (result.success) {
            toast.success("Sync Complete", { description: result.message });
            setLastSyncResult({ success: true, message: result.message });
        } else {
            toast.error("Sync Failed", { description: result.message });
            setLastSyncResult({ success: false, message: result.message });
        }
    } catch (error) {
        clearInterval(interval);
        toast.error("An unexpected error occurred.");
    } finally {
        setSyncing(false);
        // Reset progress bar after 2 seconds
        setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Manual Sync</CardTitle>
                <CardDescription>Push your database products to Google Merchant Center immediately.</CardDescription>
            </div>
            <Button onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {syncing && (
            <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">Sending products to Google...</p>
            </div>
        )}
        
        {!syncing && lastSyncResult && (
            <div className={`mt-2 p-3 rounded-md flex items-center gap-2 text-sm ${lastSyncResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {lastSyncResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {lastSyncResult.message}
            </div>
        )}
      </CardContent>
    </Card>
  );
}