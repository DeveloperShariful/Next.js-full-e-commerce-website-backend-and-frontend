// File: app/admin/support/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getTickets } from "@/app/actions/backend/support/support";
import { 
  TicketWithRelations, 
  SupportQueryParams, 
  SupportCounts, 
  GetTicketsResponse 
} from "./types";
import { TicketStatus } from "@prisma/client";

// Component Imports
import { WcSupportHeader } from "./_components/wc-support-header";
import { WcSupportStatusLinks } from "./_components/wc-support-status-links";
import { WcSupportToolbar } from "./_components/wc-support-toolbar";
import { WcSupportTable } from "./_components/wc-support-table";

export default function SupportPage() {
  // State Management
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState<SupportCounts>({ 
    ALL: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 
  });
  const [meta, setMeta] = useState<GetTicketsResponse["meta"]>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Query Parameters State
  const [queryParams, setQueryParams] = useState<SupportQueryParams>({
    search: "",
    status: "ALL",
    page: 1,
    limit: 20,
  });

  // Data Fetching Function
  const fetchTickets = async () => {
    setLoading(true);
    const res = await getTickets(queryParams);
    if (res.success) {
      setTickets(res.data || []);
      setCounts(res.counts || { ALL: 0, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 });
      setMeta(res.meta);
    }
    setLoading(false);
  };

  // Debounce Effect for Search & Filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 400); 
    return () => clearTimeout(timer);
  }, [queryParams]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(tickets.map((t) => t.id));
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
        
        {/* ১. Page Header & Stats (100% Responsive) */}
        <WcSupportHeader counts={counts} />

        {/* ২. Status Links (All | Open | In Progress ...) */}
        <WcSupportStatusLinks 
          counts={counts} 
          currentStatus={queryParams.status || "ALL"}
          onStatusChange={(status) => setQueryParams({ ...queryParams, status, page: 1 })}
        />

        {/* ৩. Table Toolbar (Bulk Actions, Search & Pagination) */}
        <WcSupportToolbar 
          queryParams={queryParams}
          setQueryParams={setQueryParams}
          meta={meta}
          selectedIds={selectedIds}
          onRefresh={fetchTickets}
          setSelectedIds={setSelectedIds}
        />

        {/* ৪. WooCommerce Style Data Table */}
        <WcSupportTable 
          tickets={tickets}
          loading={loading}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onRefresh={fetchTickets}
        />

        {/* ৫. Bottom Pagination Info */}
        <div className="mt-2 flex justify-end">
           <span className="text-[13px] text-[#50575e]">
             {meta ? `${meta.total} items` : '0 items'}
           </span>
        </div>

      </div>
    </div>
  );
}