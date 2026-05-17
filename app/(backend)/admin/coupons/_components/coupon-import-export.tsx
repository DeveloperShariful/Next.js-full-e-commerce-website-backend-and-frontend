// File Location: app/admin/coupons/_components/coupon-import-export.tsx

"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner"; 
import { exportCouponsCSV, importCouponsCSV } from "@/app/actions/backend/coupon/coupon-export-import";

export const CouponImportExportButtons = () => {
    const [loadingAction, setLoadingAction] = useState<"IMPORT" | "EXPORT" | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- HANDLE EXPORT ---
    const handleExport = async () => {
        setLoadingAction("EXPORT");
        try {
            const res = await exportCouponsCSV();
            if (res.success && res.csv) {
                const blob = new Blob([res.csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `coupons-export-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast.success("Coupons exported successfully!");
            } else {
                toast.error(res.error || "Export failed");
            }
        } catch (error) {
            toast.error("Something went wrong during export");
        } finally {
            setLoadingAction(null);
        }
    };

    // --- HANDLE IMPORT ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (text) {
                setLoadingAction("IMPORT");
                const toastId = toast.loading("Importing coupons... This may take a while.");
                
                try {
                    const res = await importCouponsCSV(text);
                    toast.dismiss(toastId); 

                    if (res.success) {
                        toast.success(res.message);
                        window.location.reload(); 
                    } else {
                        toast.error(res.error || "Import failed");
                    }
                } catch (error) {
                    toast.dismiss(toastId);
                    toast.error("Critical error during import");
                } finally {
                    setLoadingAction(null); 
                }
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

            {/* WP Style Import Button */}
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="border border-[#8c8f94] bg-white text-[#3c434a] hover:bg-[#f6f7f7] hover:text-[#135e96] h-[28px] px-3 text-[12px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
                {loadingAction === "IMPORT" ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>}
                Import
            </button>

            {/* WP Style Export Button */}
            <button 
                type="button"
                onClick={handleExport}
                disabled={isLoading}
                className="border border-[#8c8f94] bg-white text-[#3c434a] hover:bg-[#f6f7f7] hover:text-[#135e96] h-[28px] px-3 text-[12px] rounded-[3px] font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
                {loadingAction === "EXPORT" ? <Loader2 size={12} className="animate-spin"/> : <Download size={12}/>}
                Export
            </button>
        </div>
    );
};