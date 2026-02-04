//app/admin/products/_components/ImportExportButtons.tsx

"use client";

import { useState, useRef } from "react";
import { exportProductsCSV, importProductsCSV } from "@/app/actions/admin/product/import-export";
import { Download, Upload, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ImportExportButtons() {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- HANDLE EXPORT ---
    const handleExport = async () => {
        setLoading(true);
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
        setLoading(false);
    };

    // --- HANDLE IMPORT ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (text) {
                setLoading(true);
                toast.loading("Importing products... This may take a while.");
                
                const res = await importProductsCSV(text);
                
                toast.dismiss(); // Remove loading toast
                if (res.success) {
                    toast.success(res.message);
                    window.location.reload(); // পেজ রিফ্রেশ করে নতুন ডাটা দেখানো
                } else {
                    toast.error(res.message);
                }
                setLoading(false);
            }
        };
        reader.readAsText(file);
        
        // ইনপুট রিসেট করা যাতে একই ফাইল আবার আপলোড করা যায়
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="flex items-center gap-1">
            {/* Hidden Input for Import */}
            <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />

            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
                {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Upload className="w-4 h-4"/>}
                Import
            </button>

            <button 
                onClick={handleExport}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
                <Download className="w-4 h-4"/>
                Export
            </button>
        </div>
    );
}