//app/admin/orders/_components/import-export-buttons.tsx

"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner"; // অথবা react-hot-toast, যা আপনার প্রজেক্টে আছে
import { Button } from "@/components/ui/button";
import { exportOrdersCSV, importOrdersCSV } from "@/app/actions/admin/order/import-export";

export const OrderImportExportButtons = () => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- EXPORT ---
    const handleExport = async () => {
        setLoading(true);
        const res = await exportOrdersCSV();
        
        if (res.success && res.csv) {
            const blob = new Blob([res.csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            toast.success("Orders exported successfully!");
        } else {
            toast.error(res.error || "Export failed");
        }
        setLoading(false);
    };

    // --- IMPORT ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (text) {
                setLoading(true);
                const toastId = toast.loading("Importing orders...");
                
                const res = await importOrdersCSV(text);
                
                toast.dismiss(toastId);
                if (res.success) {
                    toast.success(res.message);
                    window.location.reload();
                } else {
                    toast.error(res.error);
                }
                setLoading(false);
            }
        };
        reader.readAsText(file);
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="flex items-center gap-2">
            <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />

            <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="bg-white hover:bg-slate-50 border-slate-300"
            >
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Upload className="w-4 h-4 mr-2"/>}
                Import
            </Button>

            <Button 
                variant="outline"
                onClick={handleExport}
                disabled={loading}
                className="bg-white hover:bg-slate-50 border-slate-300"
            >
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2"/> : <Download className="w-4 h-4 mr-2"/>}
                Export
            </Button>
        </div>
    );
}