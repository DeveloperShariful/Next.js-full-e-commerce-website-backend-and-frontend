// File: app/admin/shipments/_components/wc-shipment-header.tsx

"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { backfillTransdirectShipments, refreshTransdirectStatuses } from "@/app/actions/backend/shipment/shipment";
import { toast } from "sonner";

export const WcShipmentHeader = () => {
  const [syncing, setSyncing]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleBackfill = async () => {
    setSyncing(true);
    const res = await backfillTransdirectShipments();
    if (res.success) {
      res.created === 0
        ? toast.info("All booked orders already have shipment records.")
        : toast.success(`${res.created} shipment record(s) created from booked orders.`);
    } else {
      toast.error(res.error || "Backfill failed.");
    }
    setSyncing(false);
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    const res = await refreshTransdirectStatuses();
    if (res.success) {
      res.updated === 0
        ? toast.info("No status changes found.")
        : toast.success(`${res.updated} shipment status(es) updated from TransDirect.`);
    } else {
      toast.error(res.error || "Refresh failed.");
    }
    setRefreshing(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-[23px] font-normal text-[#1d2327]">
          Shipments
        </h1>
        <p className="text-[13px] text-[#50575e] mt-1">
          Manage couriers, tracking, and Transdirect API syncing.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Refresh live status from TransDirect */}
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white border border-[#8c8f94] hover:bg-[#f0f0f1] text-[#3c434a] text-[13px] font-medium px-4 h-[32px] rounded-[3px] transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Status"}
        </button>

        {/* Backfill old booked orders */}
        <button
          onClick={handleBackfill}
          disabled={syncing}
          className="flex items-center gap-2 bg-[#2271b1] hover:bg-[#135e96] text-white text-[13px] font-medium px-4 h-[32px] rounded-[3px] transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync Booked Orders"}
        </button>
      </div>
    </div>
  );
};
