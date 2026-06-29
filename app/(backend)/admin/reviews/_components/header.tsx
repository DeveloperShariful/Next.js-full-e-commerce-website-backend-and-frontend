//app/(backend)/admin/reviews/_components/header.tsx

"use client";

import { useRef } from "react";
import { Upload, Download } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onImport: (csvText: string) => void;
  onExport: () => void;
  isImporting: boolean;
}

export default function ReviewHeader({
  searchQuery,
  setSearchQuery,
  onImport,
  onExport,
  isImporting,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) onImport(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-[23px] font-normal text-[#1d2327]">Product Reviews</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3 py-[5px] text-[13px] border border-[#2271b1] bg-[#f6f7f7] text-[#2271b1] rounded-[3px] hover:bg-[#f0f6fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={13} />
            {isImporting ? "Importing..." : "Import CSV"}
          </button>

          {/* Export button */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-[5px] text-[13px] border border-[#2271b1] bg-[#2271b1] text-white rounded-[3px] hover:bg-[#135e96] transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>

          {/* Search */}
          <div className="flex items-stretch shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 sm:w-[200px] px-2 py-[3px] border border-[#8c8f94] text-[13px] text-[#3c434a] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition-shadow rounded-l-[3px]"
              placeholder="Search Reviews..."
            />
            <button className="shrink-0 whitespace-nowrap px-3 py-[3px] border border-l-0 border-[#8c8f94] bg-[#f6f7f7] text-[#2271b1] text-[13px] hover:bg-[#f0f0f1] transition-colors rounded-r-[3px]">
              Search Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
