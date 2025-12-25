// File: app/admin/invoices/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getInvoices } from "@/app/actions/admin/invoice";
import { InvoiceHeader } from "./_components/invoice-header";
import { InvoiceFilters } from "./_components/invoice-filters";
import { InvoiceTable } from "./_components/invoice-table";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await getInvoices(searchQuery);
    if (res.success) {
      setInvoices(res.data);
    }
    setLoading(false);
  };

  // Debounce Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData();
    }, 500); // 500ms delay while typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="p-6 max-w-[1920px] mx-auto min-h-screen bg-[#F8F9FA]">
      
      {/* 1. Header Section */}
      <InvoiceHeader 
        loading={loading} 
        onRefresh={fetchData} 
      />

      {/* 2. Filters Section */}
      <InvoiceFilters 
        query={searchQuery} 
        setQuery={setSearchQuery} 
        totalCount={invoices.length}
      />

      {/* 3. Table Section */}
      <InvoiceTable 
        invoices={invoices} 
        loading={loading} 
      />

    </div>
  );
}