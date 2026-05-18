// File: app/admin/refunds/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getRefunds } from "@/app/actions/backend/refund/refund";
import { 
  RefundWithRelations, 
  RefundQueryParams, 
  RefundCounts, 
  RefundStats,
  GetRefundsResponse 
} from "./types";

import { WcRefundHeader } from "./_components/wc-refund-header";
import { WcRefundStatusLinks } from "./_components/wc-refund-status-links";
import { WcRefundToolbar } from "./_components/wc-refund-toolbar";
import { WcRefundTable } from "./_components/wc-refund-table";

export default function RefundsPage() {
  // State Management
  const [refunds, setRefunds] = useState<RefundWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState<RefundCounts>({ ALL: 0, pending: 0, approved: 0, rejected: 0 });
  
  // Here we added currency in the initial state
  const [stats, setStats] = useState<RefundStats>({ 
    totalRefundedAmount: 0, 
    pendingCount: 0, 
    currency: "AUD" 
  });
  
  const [meta, setMeta] = useState<GetRefundsResponse["meta"]>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Query Parameters State
  const [queryParams, setQueryParams] = useState<RefundQueryParams>({
    search: "",
    status: "ALL",
    page: 1,
    limit: 20,
  });

  // Data Fetching Function
  const fetchRefunds = async () => {
    setLoading(true);
    const res = await getRefunds(queryParams);
    if (res.success) {
      setRefunds(res.data || []);
      setCounts(res.counts || { ALL: 0, pending: 0, approved: 0, rejected: 0 });
      setStats(res.stats || { totalRefundedAmount: 0, pendingCount: 0, currency: "AUD" });
      setMeta(res.meta);
    }
    setLoading(false);
  };

  // Debounce Effect for Search & Filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRefunds();
    }, 400); 
    return () => clearTimeout(timer);
  }, [queryParams]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(refunds.map((ref) => ref.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  return (
    /* WP-Admin Background Color: #f0f0f1 */
    <div className="min-h-screen bg-[#f0f0f1] font-sans text-[#1d2327]">
      <div className="max-w-[1920px] mx-auto">
        
        {/* ১. Page Header & Stats */}
        <WcRefundHeader stats={stats} />

        {/* ২. Status Links (All | Pending | Approved ...) */}
        <WcRefundStatusLinks 
          counts={counts} 
          currentStatus={queryParams.status || "ALL"}
          onStatusChange={(status) => setQueryParams({ ...queryParams, status, page: 1 })}
        />

        {/* ৩. Table Toolbar (Bulk Actions, Search & Pagination) */}
        <WcRefundToolbar 
          queryParams={queryParams}
          setQueryParams={setQueryParams}
          meta={meta}
          selectedIds={selectedIds}
          onRefresh={fetchRefunds}
          setSelectedIds={setSelectedIds}
        />

        {/* ৪. WooCommerce Style Data Table */}
        <WcRefundTable 
          refunds={refunds}
          loading={loading}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onRefresh={fetchRefunds}
        />

        {/* ৫. Bottom Pagination Info (Like WordPress) */}
        <div className="mt-2 flex justify-end">
           <span className="text-[13px] text-[#50575e]">
             {meta ? `${meta.total} items` : '0 items'}
           </span>
        </div>

      </div>
    </div>
  );
}