// File: app/admin/invoices/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getInvoices } from "@/app/actions/backend/invoice/invoice";
import { InvoiceWithRelations, InvoiceQueryParams, StatusCounts, GetInvoicesResponse } from "./types";

// আমরা এই কম্পোনেন্টগুলো ধাপে ধাপে তৈরি করব (পরবর্তী ফাইলে এগুলো দেওয়া হবে)
import { WcPageHeader } from "./_components/wc-page-header";
import { WcStatusLinks } from "./_components/wc-status-links";
import { WcTableToolbar } from "./_components/wc-table-toolbar";
import { WcInvoiceTable } from "./_components/wc-invoice-table";

export default function InvoicesPage() {
  // State Management
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState<StatusCounts>({ ALL: 0 });
  const [meta, setMeta] = useState<GetInvoicesResponse["meta"]>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Query Parameters State (এটি চেঞ্জ হলেই ডেটা রি-ফেচ হবে)
  const [queryParams, setQueryParams] = useState<InvoiceQueryParams>({
    search: "",
    status: "ALL",
    page: 1,
    limit: 20,
  });

  // Data Fetching Function
  const fetchInvoices = async () => {
    setLoading(true);
    const res = await getInvoices(queryParams);
    if (res.success) {
      setInvoices(res.data || []);
      setCounts(res.counts || { ALL: 0 });
      setMeta(res.meta);
    }
    setLoading(false);
  };

  // Debounce Effect for Search & Filters
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 400); // 400ms ডিবাইন্স, যাতে টাইপ করার সময় বারবার API কল না হয়
    return () => clearTimeout(timer);
  }, [queryParams]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(invoices.map((inv) => inv.id));
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
    <div className="min-h-screen bg-[#f0f0f1]  font-sans text-[#1d2327]">
      <div className="max-w-[1920px] mx-auto">
        
        {/* ১. Page Header (Title & Add New Button) */}
        <WcPageHeader />

        {/* ২. Status Links (All | Pending | Processing ...) */}
        <WcStatusLinks 
          counts={counts} 
          currentStatus={queryParams.status || "ALL"}
          onStatusChange={(status) => setQueryParams({ ...queryParams, status, page: 1 })}
        />

        {/* ৩. Table Toolbar (Bulk Actions, Date Filters, Search & Pagination) */}
        <WcTableToolbar 
          queryParams={queryParams}
          setQueryParams={setQueryParams}
          meta={meta}
          selectedIds={selectedIds}
          onRefresh={fetchInvoices}
          setSelectedIds={setSelectedIds}
        />

        {/* ৪. WooCommerce Style Data Table */}
        <WcInvoiceTable 
          invoices={invoices}
          loading={loading}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
        />

        {/* ৫. Bottom Pagination (Like WordPress) */}
        <div className="mt-2 flex justify-end">
           {/* Bottom Toolbar Pagination (আমরা WcTableToolbar-এর পেজিনেশন লজিকটাই এখানে রিইউজ করব) */}
           <span className="text-[13px] text-[#50575e]">
             {meta ? `${meta.total} items` : '0 items'}
           </span>
        </div>

      </div>
    </div>
  );
}