//app/admin/orders/_components/import-export-buttons.tsx
"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast"; 
import { Button } from "@/components/ui/button";
import { exportOrdersCSV, importOrdersCSV } from "@/app/actions/admin/order/import-export";

export const OrderImportExportButtons = () => {
    // ✅ FIX: Using a specific action state instead of generic boolean
    const [loadingAction, setLoadingAction] = useState<"IMPORT" | "EXPORT" | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- HANDLE EXPORT ---
    const handleExport = async () => {
        setLoadingAction("EXPORT"); // 🔥 Set specific action
        try {
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
        } catch (error) {
            toast.error("Something went wrong during export");
        } finally {
            setLoadingAction(null); // 🔥 Reset
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
                setLoadingAction("IMPORT"); // 🔥 Set specific action
                const toastId = toast.loading("Importing orders... This may take a while.");
                
                try {
                    const res = await importOrdersCSV(text);
                    
                    toast.dismiss(toastId); 

                    if (res.success) {
                        toast.success(res.message || "Imported successfully");
                        window.location.reload(); 
                    } else {
                        toast.error(res.error || "Import failed");
                    }
                } catch (error) {
                    toast.dismiss(toastId);
                    toast.error("Critical error during import");
                    console.error(error);
                } finally {
                    setLoadingAction(null); // 🔥 Reset
                }
            }
        };
        
        reader.readAsText(file);
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Helper: Is any action running? (To disable both buttons)
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

            {/* IMPORT BUTTON */}
            <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading} // Disable if ANY loading is happening
                className="bg-white hover:bg-slate-50 border-slate-300 shadow-sm transition-all active:scale-95 min-w-[100px]"
            >
                {/* 🔥 Show spinner ONLY if action is IMPORT */}
                {loadingAction === "IMPORT" ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-2"/> 
                ) : (
                    <Upload className="w-4 h-4 mr-2"/>
                )}
                Import
            </Button>

            {/* EXPORT BUTTON */}
            <Button 
                variant="outline"
                onClick={handleExport}
                disabled={isLoading} // Disable if ANY loading is happening
                className="bg-white hover:bg-slate-50 border-slate-300 shadow-sm transition-all active:scale-95 min-w-[100px]"
            >
                {/* 🔥 Show spinner ONLY if action is EXPORT */}
                {loadingAction === "EXPORT" ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-2"/> 
                ) : (
                    <Download className="w-4 h-4 mr-2"/>
                )}
                Export
            </Button>
        </div>
    );
};