"use client";

import { BarChart3 } from "lucide-react";

interface AnalyticsHeaderProps {
  period: string;
  setPeriod: (val: string) => void;
}

const PERIODS = [
  { label: "Last 7 Days", val: "7d" },
  { label: "Last 30 Days", val: "30d" },
  { label: "Last 90 Days", val: "90d" },
  { label: "This Year", val: "year" },
];

export function AnalyticsHeader({ period, setPeriod }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-blue-600" /> Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your store performance.</p>
      </div>
      
      <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex overflow-x-auto max-w-full scrollbar-hide">
         {PERIODS.map((p) => (
           <button
             key={p.val}
             onClick={() => setPeriod(p.val)}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition whitespace-nowrap ${
               period === p.val 
                 ? "bg-slate-900 text-white shadow-md" 
                 : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
             }`}
           >
             {p.label}
           </button>
         ))}
      </div>
    </div>
  );
}