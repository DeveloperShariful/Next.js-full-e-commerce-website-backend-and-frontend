//app/(backend)/admin/tags/_components/header.tsx

"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportTagsCsv } from "@/app/actions/backend/shared/csv-export";
import { importTagsCsv } from "@/app/actions/backend/shared/csv-import";
import CsvImportButton from "@/app/(backend)/admin/_components/CsvImportButton";

interface HeaderProps {
  viewMode: "list" | "form";
  setViewMode: (mode: "list" | "form") => void;
  resetForm: () => void;
  onImportSuccess: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function TagHeader({
  viewMode, setViewMode, resetForm, onImportSuccess, searchQuery, setSearchQuery
}: HeaderProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    const res = await exportTagsCsv();
    if (res.success && res.csv) {
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tags-${new Date().toISOString().slice(0, 10)}.csv`;
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
          <h1 className="text-[23px] font-normal text-[#1d2327]">Product tags</h1>

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
              Search tags
            </button>
          </div>
        )}
      </div>

      <p className="text-[13px] text-[#50575e] max-w-4xl leading-relaxed mb-3">
        Tags are similar to categories, but they are generally used to describe your product in more detail.
      </p>

      {/* Import row — only in list view */}
      {viewMode === "list" && (
        <CsvImportButton
          label="Tags"
          templateColumns={["name", "slug", "color", "description", "metaTitle", "metaDesc"]}
          templateExample={{ name: "Summer", slug: "summer", color: "#f59e0b", description: "Summer collection tag" }}
          onImport={importTagsCsv}
          onSuccess={onImportSuccess}
        />
      )}
    </div>
  );
}
