//app/(backend)/admin/_components/business-pulse.tsx

"use client";

import { useGlobalStore } from "@/app/providers/global-store-provider";
import { ShoppingCart, UserPlus, TrendingUp, TrendingDown, Minus, CreditCard, AlertCircle, BarChart2 } from "lucide-react";
import { DashboardPulse } from "@/app/actions/backend/dashboard/types";

interface BusinessPulseProps {
  data: DashboardPulse;
  label: string;
}

// Helper: Growth Badge (WP Minimal Style)
const GrowthBadge = ({ value }: { value: number }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <span className={`flex items-center text-[11px] font-semibold ml-2 ${
      isNeutral ? "text-[#8c8f94]" :
      isPositive ? "text-[#008a20]" : "text-[#d63638]"
    }`}>
      {isNeutral ? <Minus size={10} /> : isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      <span className="ml-1">{Math.abs(value).toFixed(1)}%</span>
    </span>
  );
};

export function BusinessPulse({ data, label }: BusinessPulseProps) {
  const { formatPrice } = useGlobalStore();

  // WP Style Status Colors Mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-[#fff5eb] text-[#c05621] border-[#fbd38d]";
      case "PROCESSING": return "bg-[#f0f6fc] text-[#2271b1] border-[#c5d9ed]";
      case "DELIVERED": return "bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]";
      case "CANCELLED": return "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]";
      default: return "bg-[#f6f7f7] text-[#50575e] border-[#c3c4c7]";
    }
  };

  return (
    // 🚀 WP Style Meta Box
    <div className="bg-white border border-[#c3c4c7] shadow-sm">
      
      {/* Meta Box Header */}
      <h2 className="px-4 py-2 border-b border-[#c3c4c7] text-[14px] font-semibold text-[#1d2327] bg-[#f6f7f7] flex items-center gap-2">
        <BarChart2 size={16} className="text-[#8c8f94]" />
        Store Performance <span className="text-[#8c8f94] text-[12px] font-normal">({label})</span>
      </h2>

      <div className="p-4">
        {/* TOP ROW: REVENUE, ORDERS, SIGNUPS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#f0f0f1] pb-5 border-b border-[#f0f0f1]">
          
          {/* 1. Paid Revenue */}
          <div className="px-2 first:pl-0">
            <p className="text-[#50575e] text-[12px] font-medium mb-1">Net Sales</p>
            <div className="flex items-baseline">
              <p className="text-[24px] font-normal text-[#2271b1]">{formatPrice(data.revenue.value)}</p>
              <GrowthBadge value={data.revenue.growth} />
            </div>
            <p className="text-[11px] text-[#8c8f94] mt-0.5">Excludes unpaid orders</p>
          </div>

          {/* 2. Orders (Detailed) */}
          <div className="px-2 ">
            <div className="flex items-center gap-1.5 mb-1">
               <p className="text-[#50575e] text-[12px] font-medium">Total Orders</p>
            </div>
            <div className="flex items-baseline">
              <p className="text-[24px] font-normal text-[#2271b1]">{data.orders.total.toLocaleString()}</p>
              <GrowthBadge value={data.orders.growth} />
            </div>
            {/* Paid vs Unpaid Breakdown */}
            <div className="flex gap-3 mt-1.5">
               <div className="flex items-center gap-1 text-[11px] text-[#008a20]">
                  <CreditCard size={10} />
                  <span className="font-semibold">{data.orders.paid}</span> Paid
               </div>
               <div className="flex items-center gap-1 text-[11px] text-[#d63638]">
                  <AlertCircle size={10} />
                  <span className="font-semibold">{data.orders.unpaid}</span> Unpaid
               </div>
            </div>
          </div>

          {/* 3. Customers */}
          <div className="px-2 pt-4 md:pt-0">
            <div className="flex items-center gap-1.5 mb-1">
               <p className="text-[#50575e] text-[12px] font-medium">Signups</p>
            </div>
            <div className="flex items-baseline">
              <p className="text-[24px] font-normal text-[#2271b1]">{data.customers.value.toLocaleString()}</p>
              <GrowthBadge value={data.customers.growth} />
            </div>
            <p className="text-[11px] text-[#8c8f94] mt-0.5">New accounts created</p>
          </div>
        </div>

        {/* BOTTOM ROW: STATUS BREAKDOWN */}
        <div className="pt-4">
           <p className="text-[12px] font-medium text-[#50575e] mb-2">Order Status Breakdown</p>
           
           {Object.keys(data.statusBreakdown).length === 0 ? (
              <p className="text-[12px] text-[#8c8f94] italic">No orders in this period.</p>
           ) : (
             <div className="flex flex-wrap gap-2">
                {Object.entries(data.statusBreakdown).map(([status, count]) => (
                   <div 
                     key={status} 
                     className={`px-2 py-1 rounded-sm border text-[11px] font-semibold flex items-center gap-1.5 ${getStatusColor(status)}`}
                   >
                      <span>{status}</span>
                      <span className="bg-white px-1.5 rounded-sm border border-inherit text-inherit">{count}</span>
                   </div>
                ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}