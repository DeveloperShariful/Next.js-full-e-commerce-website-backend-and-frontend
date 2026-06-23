//app/admin/products/_components/ImportExportButtons.tsx

"use client";

import { useState, useRef } from "react";
import { exportProductsCSV, importProductsCSV } from "@/app/actions/backend/product/import-export";
import { Download, Upload, Loader2 } from "lucide-react"; 
import { toast } from "sonner";

export default function ImportExportButtons() {
    // 🚀 FIXED: Separate loading states for Import and Export
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- HANDLE EXPORT ---
    const handleExport = async () => {
        setIsExporting(true);
        const res = await exportProductsCSV();
        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            toast.success("Products exported!");
        } else {
            toast.error("Export failed");
        }
        setIsExporting(false);
    };

    // --- HANDLE IMPORT ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (text) {
                setIsImporting(true);
                toast.loading("Importing products... This may take a while.");
                
                const res = await importProductsCSV(text);
                
                toast.dismiss(); 
                if (res.success) {
                  // res.message না থাকলে একটি ডিফল্ট মেসেজ ব্যবহার করা হবে
                  toast.success(res.message || "Import successful!");
                  window.location.reload(); 
                } else {
                  // res.message অথবা res.error না থাকলে ডিফল্ট এরর মেসেজ ব্যবহার করা হবে
                  toast.error(res.message || res.error || "Import failed.");
                }
                setIsImporting(false);
            }
        };
        reader.readAsText(file);
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const isLoading = isExporting || isImporting;

    return (
        <div className="flex items-center gap-1.5">
            <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />

            {/* 🚀 WP Style Buttons with Individual Loading States */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-2.5 py-1 border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] text-[13px] rounded-[3px] hover:bg-[#f0f0f1] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
                {isImporting ? <Loader2 className="animate-spin" size={14}/> : <Upload size={14}/>}
                Import
            </button>

            <button 
                onClick={handleExport}
                disabled={isLoading}
                className="px-2.5 py-1 border border-[#c3c4c7] bg-[#f6f7f7] text-[#2271b1] text-[13px] rounded-[3px] hover:bg-[#f0f0f1] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
                {isExporting ? <Loader2 className="animate-spin" size={14}/> : <Download size={14}/>}
                Export
            </button>
        </div>
    );
}