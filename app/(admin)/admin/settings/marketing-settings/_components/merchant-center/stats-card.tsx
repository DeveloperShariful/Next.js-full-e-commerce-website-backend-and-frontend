//app/(admin)/admin/settings/marketing-settings/_components/merchant-center/
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, ShoppingBag, Loader2, AlertCircle } from "lucide-react";
import { getMerchantStatus } from "@/app/actions/admin/settings/marketing-settings/merchant_center/get-merchant-status";

interface StatsData {
  active: number;
  pending: number;
  disapproved: number;
  total: number;
}

export function MerchantStatsCard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // ✅ Error state added

  const fetchStats = async () => {
    setLoading(true);
    try {
        const result = await getMerchantStatus();
        if (result.success && result.data) {
            setStats(result.data);
            setError(null);
        } else {
            // ✅ Capture error message instead of hiding
            setError(result.message || "Failed to load stats data.");
        }
    } catch (err) {
        setError("Network error or server action failed.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
        <Card className="bg-slate-50 border-dashed mb-6">
            <CardContent className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching real-time stats...
            </CardContent>
        </Card>
    );
  }

  // ✅ Show Error UI instead of returning null
  if (error) {
    return (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span><strong>Status Error:</strong> {error}</span>
            <button onClick={fetchStats} className="ml-auto underline hover:text-red-800">Retry</button>
        </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Submitted to GMC</p>
        </CardContent>
      </Card>

      {/* Active */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700">{stats.active}</div>
          <p className="text-xs text-muted-foreground">Live on Shopping</p>
        </CardContent>
      </Card>

      {/* Pending */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">Under review</p>
        </CardContent>
      </Card>

      {/* Disapproved */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disapproved</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-700">{stats.disapproved}</div>
          <p className="text-xs text-muted-foreground">Requires attention</p>
        </CardContent>
      </Card>
    </div>
  );
}