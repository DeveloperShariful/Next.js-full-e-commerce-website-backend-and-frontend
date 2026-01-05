//app/(admin)/admin/analytics/_components/analytics-header.tsx

"use client";

import { Period } from "@/app/actions/admin/analytics/types";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface AnalyticsHeaderProps {
  period: Period;
  setPeriod: Dispatch<SetStateAction<Period>>;
  isFetching: boolean; // 🚀 New Prop for visual feedback
}

export function AnalyticsHeader({ period, setPeriod, isFetching }: AnalyticsHeaderProps) {
  const periods: { label: string; val: Period }[] = [
    { label: "Last 7 Days", val: "7d" },
    { label: "Last 30 Days", val: "30d" },
    { label: "Last 90 Days", val: "90d" },
    { label: "Year to Date", val: "year" },
  ];

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-blue-600" strokeWidth={2.5} /> 
          Analytics Overview
          {/* Show spinner next to title if refreshing */}
          {isFetching && <Loader2 size={18} className="animate-spin text-slate-400" />}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor your store performance and business growth.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex overflow-x-auto">
          {periods.map((p) => (
            <button
              key={p.val}
              onClick={() => !isFetching && setPeriod(p.val)} // Prevent double click
              disabled={isFetching && period === p.val}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${
                period === p.val 
                  ? "bg-slate-800 text-white shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              } ${isFetching ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {p.label}
              {/* Show spinner inside active button */}
              {isFetching && period === p.val && <Loader2 size={10} className="animate-spin" />}
            </button>
          ))}
        </div>

        <button 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
}