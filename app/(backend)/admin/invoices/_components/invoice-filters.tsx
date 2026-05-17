// File: app/admin/invoices/_components/invoice-filters.tsx

"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InvoiceFiltersProps {
    query: string;
    setQuery: (val: string) => void;
    totalCount: number;
}

export const InvoiceFilters = ({ query, setQuery, totalCount }: InvoiceFiltersProps) => {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <Input 
                    type="text" 
                    placeholder="Search invoice #, name, email..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
            </div>
            <div className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-full">
                Total Records: {totalCount}
            </div>
        </div>
    );
};