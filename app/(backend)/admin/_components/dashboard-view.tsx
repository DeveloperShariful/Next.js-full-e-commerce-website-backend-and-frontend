//app/(backend)/admin/_components/dashboard-view.tsx

"use client";

import { useState } from "react";
import { ActionAlerts } from "./action-alerts";
import { BusinessPulse } from "./business-pulse";
import { RecentOrders } from "./recent-orders";
import { ActivityFeed } from "./activity-feed";
import { Overview } from "./overview";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

type DataRange = "today" | "yesterday" | "week" | "month";

interface DashboardViewProps {
  data: any; // Using the data structure from backend (merged with claims)
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
    <div className="font-sans text-[#3c434a] max-w-full">
      
      {/* 1. WP Style Header & Client-Side Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Dashboard</h1>

        {/* Filter links styled like WP sub-menu */}
        <div className="flex items-center gap-1 text-[13px]">
          <span className="text-[#8c8f94] mr-1"><CalendarDays size={14} /></span>
          {(['today', 'yesterday', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-2 py-1 transition-colors ${
                activeRange === range
                  ? "font-semibold text-[#1d2327]"
                  : "text-[#2271b1] hover:underline"
              }`}
            >
              {labels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Welcome Message (WordPress Style Notice) */}
      <div className="bg-white border-l-4 border-[#2271b1] border-y-[#c3c4c7] border-r-[#c3c4c7] border p-4 mb-6 shadow-sm">
        <h2 className="text-[16px] font-semibold text-[#1d2327] mb-1">
          Welcome to {storeName} Dashboard!
        </h2>
        <p className="text-[13px] text-[#50575e]">
          We’ve assembled some links and stats to get you started. Check your pending orders and warranty claims to keep the customers happy.
        </p>
      </div>

      {/* 3. At a Glance (Alerts + Claims passing down) */}
      <h2 className="text-[14px] font-semibold text-[#1d2327] mb-3">At a Glance</h2>
      <ActionAlerts alerts={data.alerts} claims={data.claims} />

      {/* 4. WordPress Style Meta Boxes Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-5">
           
           {/* Business Pulse Meta Box */}
           <BusinessPulse data={currentStats} label={labels[activeRange]} />
           
           {/* Overview Chart Meta Box */}
           <div className="bg-white border border-[#c3c4c7] shadow-sm">
             <h2 className="px-4 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7]">
               Sales Overview ({labels[activeRange]})
             </h2>
             <div className="p-4 h-[350px]">
               <Overview data={data.graphData} currencySymbol={data.currencySymbol} />
             </div>
           </div>

           {/* Recent Orders Meta Box */}
           <RecentOrders orders={data.recentOrders} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="lg:col-span-1 space-y-5">
           
           {/* Recent Warranty Claims Meta Box (NEW) */}
           <div className="bg-white border border-[#c3c4c7] shadow-sm">
             <h2 className="px-4 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7]">
               Recent Warranty Claims
             </h2>
             <div className="p-0">
               {data.claims.recent.length === 0 ? (
                 <p className="text-[13px] text-[#50575e] italic p-4">
                   Waiting for new warranty claims to be submitted...
                 </p>
               ) : (
                 <ul className="divide-y divide-[#f0f0f1]">
                   {data.claims.recent.map((claim: any) => (
                     <li key={claim.id} className="p-3 hover:bg-[#f6f7f7] transition-colors flex justify-between items-start text-[13px]">
                       <div className="leading-relaxed pr-2">
                         <span className="text-[#8c8f94] block text-[11px] mb-0.5">
                           {new Date(claim.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                         </span>
                         <Link href={`/admin/warranty-claims/${claim.id}`} className="text-[#2271b1] font-semibold hover:underline">
                           {claim.name}
                         </Link> submitted a claim.
                       </div>
                       <div className="mt-1 shrink-0">
                         {claim.status === 'PENDING' && <span className="bg-[#fff5eb] text-[#c05621] border border-[#fbd38d] px-1.5 py-0.5 rounded-sm text-[11px] font-bold">Pending</span>}
                         {claim.status === 'APPROVED' && <span className="bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] px-1.5 py-0.5 rounded-sm text-[11px] font-bold">Approved</span>}
                         {claim.status === 'REJECTED' && <span className="bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] px-1.5 py-0.5 rounded-sm text-[11px] font-bold">Rejected</span>}
                       </div>
                     </li>
                   ))}
                 </ul>
               )}
               {data.claims.recent.length > 0 && (
                 <div className="p-3 border-t border-[#f0f0f1] text-[13px]">
                   <Link href="/admin/warranty-claims" className="text-[#2271b1] hover:underline">
                     View all claims →
                   </Link>
                 </div>
               )}
             </div>
           </div>

           {/* Activity Feed Meta Box */}
           <ActivityFeed activities={data.recentActivities} />
        </div>
      </div>
      
    </div>
  );
}