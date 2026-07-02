"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportWarrantyClaimsCSV, importWarrantyClaimsCSV } from "@/app/actions/backend/warranty/warranty-export-import";

export default function WarrantyImportExport() {
  const [loadingAction, setLoadingAction] = useState<"IMPORT" | "EXPORT" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setLoadingAction("EXPORT");
    try {
      const res = await exportWarrantyClaimsCSV();
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `warranty-claims-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        toast.success("Warranty claims exported successfully!");
      } else {
        toast.error(res.error || "Export failed");
      }
    } catch {
      toast.error("Something went wrong during export");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      setLoadingAction("IMPORT");
      const toastId = toast.loading("Importing warranty claims...");
      try {
        const res = await importWarrantyClaimsCSV(text);
        toast.dismiss(toastId);
        if (res.success) {
          toast.success(res.message);
          window.location.reload();
        } else {
          toast.error(res.error || "Import failed");
        }
      } catch {
        toast.dismiss(toastId);
        toast.error("Critical error during import");
      } finally {
        setLoadingAction(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isLoading = loadingAction !== null;

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="border border-[#8c8f94] bg-white text-[#3c434a] hover:bg-[#f6f7f7] hover:text-[#135e96] h-[28px] px-3 text-[12px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
      >
        {loadingAction === "IMPORT" ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        Import
      </button>
      <button
        type="button"
        onClick={handleExport}
        disabled={isLoading}
        className="border border-[#8c8f94] bg-white text-[#3c434a] hover:bg-[#f6f7f7] hover:text-[#135e96] h-[28px] px-3 text-[12px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
      >
        {loadingAction === "EXPORT" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        Export
      </button>
    </div>
  );
}
