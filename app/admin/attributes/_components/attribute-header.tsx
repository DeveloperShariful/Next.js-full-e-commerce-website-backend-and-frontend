// app/admin/attributes/_components/attribute-header.tsx

"use client";

import { Layers, RefreshCcw } from "lucide-react";

interface AttributeHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function AttributeHeader({ onRefresh, loading }: AttributeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-blue-600" /> Attributes
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage product variations like Size, Color, Material.</p>
      </div>
      <button 
        onClick={onRefresh} 
        disabled={loading}
        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition disabled:opacity-50"
      >
         <RefreshCcw size={16} className={loading ? "animate-spin" : ""}/> 
         {loading ? "Syncing..." : "Sync Attributes"}
      </button>
    </div>
  );
}