// File: app/admin/invoices/_components/invoice-header.tsx

"use client";

import { FileText, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceHeaderProps {
    onRefresh: () => void;
    loading: boolean;
}

export const InvoiceHeader = ({ onRefresh, loading }: InvoiceHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-blue-600" /> Invoices
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    View, manage, and print customer invoices.
                </p>
            </div>
            <Button 
                onClick={onRefresh} 
                variant="outline"
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600 gap-2"
                disabled={loading}
            >
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> 
                {loading ? "Refreshing..." : "Refresh List"}
            </Button>
        </div>
    );
};