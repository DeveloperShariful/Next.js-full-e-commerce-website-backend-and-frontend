//app/(backend)/admin/brands/_components/header.tsx

"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportBrandsCsv } from "@/app/actions/backend/shared/csv-export";
import { importBrandsCsv } from "@/app/actions/backend/shared/csv-import";
import CsvImportButton from "@/app/(backend)/admin/_components/CsvImportButton";

interface HeaderProps {
  viewMode: "list" | "form";
  setViewMode: (mode: "list" | "form") => void;
  resetForm: () => void;
  loading: boolean;
  fetchData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function BrandHeader({
  viewMode, setViewMode, resetForm, loading, fetchData, searchQuery, setSearchQuery
}: HeaderProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const res = await exportBrandsCsv();
    if (res.success && res.csv) {
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brands-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  };

  return (
    <div className="mb-4">

      {/* Title row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Product brands</h1>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[13px] border border-[#c3c4c7] text-[#646970] bg-[#f6f7f7] hover:bg-[#f0f0f1] rounded-[3px] transition-colors disabled:opacity-60"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Export
          </button>

          {viewMode === "list" ? (
            <button
              onClick={() => setViewMode("form")}
              className="lg:hidden px-2.5 py-1 text-[13px] border border-[#2271b1] text-[#2271b1] bg-[#f0f6fc] hover:bg-[#2271b1] hover:text-white rounded-sm transition-colors"
            >
              Add New
            </button>
          ) : (
            <button
              onClick={resetForm}
              className="lg:hidden px-2.5 py-1 text-[13px] border border-[#c3c4c7] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] rounded-sm transition-colors"
            >
              Back to List
            </button>
          )}
        </div>

        {viewMode === "list" && (
          <div className="flex items-center shadow-sm w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 sm:w-[200px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow rounded-l-[3px]"
            />
            <button className="px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px]">
              Search brands
            </button>
          </div>
        )}
      </div>

      <p className="text-[13px] text-[#50575e] max-w-4xl leading-relaxed mb-3">
        Brands can be managed here. They allow you to group your products by manufacturer or company.
      </p>

      {/* Import row — only in list view */}
      {viewMode === "list" && (
        <CsvImportButton
          label="Brands"
          templateColumns={["name", "slug", "website", "countryOfOrigin", "isFeatured", "description"]}
          templateExample={{ name: "Nike", slug: "nike", website: "https://nike.com", countryOfOrigin: "USA", isFeatured: "yes", description: "Global sportswear brand" }}
          onImport={importBrandsCsv}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
