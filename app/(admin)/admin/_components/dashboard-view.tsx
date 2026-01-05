//app/(admin)/admin/_components/dashboard-view.tsx

"use client";

import { useState } from "react";
import { ActionAlerts } from "./action-alerts";
import { BusinessPulse } from "./business-pulse";
import { RecentOrders } from "./recent-orders";
import { ActivityFeed } from "./activity-feed";
import { Overview } from "./overview";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { CalendarDays } from "lucide-react";

type DataRange = "today" | "yesterday" | "week" | "month";

interface DashboardViewProps {
  data: any; // Using the data structure from backend
}

export function DashboardView({ data }: DashboardViewProps) {
  const { storeName } = useGlobalStore();
  const [activeRange, setActiveRange] = useState<DataRange>("today");

  // Select the correct stats based on state
  const currentStats = data.stats[activeRange];
  
  const labels = {
    today: "Today",
    yesterday: "Yesterday",
    week: "Last 7 Days",
    month: "Last 30 Days"
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans text-slate-800 pb-20 max-w-[1600px] mx-auto">
      
      {/* 1. Header with Client-Side Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Overview of <span className="font-semibold text-blue-600">{storeName}</span>.
          </p>
        </div>

        <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
          <div className="px-2 text-slate-400"><CalendarDays size={16} /></div>
          {(['today', 'yesterday', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeRange === range
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {labels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Emergency Alerts */}
      <ActionAlerts alerts={data.alerts} />

      {/* 3. Business Pulse (Changes instantly on click) */}
      <BusinessPulse data={currentStats} label={labels[activeRange]} />

      {/* 4. Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
           <div className="h-[400px]">
              <Overview data={data.graphData} currencySymbol={data.currencySymbol} />
           </div>
           <div className="h-full">
              <RecentOrders orders={data.recentOrders} />
           </div>
        </div>
        <div className="xl:col-span-1 h-full">
           <ActivityFeed activities={data.recentActivities} />
        </div>
      </div>
      
    </div>
  );
}