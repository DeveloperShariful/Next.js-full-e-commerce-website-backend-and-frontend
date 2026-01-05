//app/(admin)/admin/_components/dashboard-header.tsx

"use client";

import { useGlobalStore } from "@/app/providers/global-store-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";

export function DashboardHeader() {
  const { storeName } = useGlobalStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Default to 'today' if no param exists
  const currentRange = searchParams.get("range") || "today";

  const handleFilterChange = (range: string) => {
    router.push(`/admin?range=${range}`);
  };

  const filters = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" },
  ];

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
      {/* Welcome Text */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-1">
          Overview of <span className="font-semibold text-blue-600">{storeName}</span>.
        </p>
      </div>

      {/* Filter Buttons Container */}
      {/* Added w-full for mobile to ensure it spans correctly */}
      <div className="w-full md:w-auto">
        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1 overflow-x-auto max-w-full">
          
          <div className="px-2 text-slate-400 flex-shrink-0">
             <CalendarDays size={16} />
          </div>
          
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap flex-shrink-0 ${
                currentRange === filter.value
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}