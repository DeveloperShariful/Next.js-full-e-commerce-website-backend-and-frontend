//app/(admin)/admin/_components/business-pulse.tsx

"use client";

import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Zap, ShoppingCart, UserPlus, TrendingUp, TrendingDown, Minus, CreditCard, AlertCircle } from "lucide-react";
import { DashboardPulse } from "@/app/actions/admin/dashboard/types";

interface BusinessPulseProps {
  data: DashboardPulse;
  label: string;
}

// Helper: Growth Badge
const GrowthBadge = ({ value }: { value: number }) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <span className={`flex items-center text-xs font-bold ml-2 px-1.5 py-0.5 rounded ${
      isNeutral ? "bg-slate-700 text-slate-400" :
      isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
    }`}>
      {isNeutral ? <Minus size={10} /> : isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      <span className="ml-1">{Math.abs(value).toFixed(1)}%</span>
    </span>
  );
};

export function BusinessPulse({ data, label }: BusinessPulseProps) {
  const { formatPrice } = useGlobalStore();

  // Status Colors Mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "PROCESSING": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "DELIVERED": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "CANCELLED": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg mb-8 relative overflow-hidden transition-all duration-300">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Zap size={120} />
      </div>

      <div className="relative z-10">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
          <Zap size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
          Business Pulse <span className="text-slate-400 text-sm font-normal ml-1">({label})</span>
        </h3>

        {/* TOP ROW: REVENUE, ORDERS, SIGNUPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-700 pb-6 border-b border-slate-700">
          
          {/* 1. Paid Revenue */}
          <div className="px-4 first:pl-0">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Paid Revenue</p>
            <div className="flex items-center">
              <p className="text-3xl font-black tracking-tight">{formatPrice(data.revenue.value)}</p>
              <GrowthBadge value={data.revenue.growth} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Excludes unpaid orders</p>
          </div>

          {/* 2. Orders (Detailed) */}
          <div className="px-4 pt-4 md:pt-0">
            <div className="flex items-center gap-2 mb-1">
               <ShoppingCart size={14} className="text-blue-400" />
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Orders</p>
            </div>
            <div className="flex items-center">
              <p className="text-3xl font-black tracking-tight">{data.orders.total.toLocaleString()}</p>
              <GrowthBadge value={data.orders.growth} />
            </div>
            {/* Paid vs Unpaid Breakdown */}
            <div className="flex gap-3 mt-2">
               <div className="flex items-center gap-1 text-xs text-green-400">
                  <CreditCard size={10} />
                  <span className="font-bold">{data.orders.paid}</span> Paid
               </div>
               <div className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle size={10} />
                  <span className="font-bold">{data.orders.unpaid}</span> Unpaid
               </div>
            </div>
          </div>

          {/* 3. Customers */}
          <div className="px-4 pt-4 md:pt-0">
            <div className="flex items-center gap-2 mb-1">
               <UserPlus size={14} className="text-green-400" />
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Signups</p>
            </div>
            <div className="flex items-center">
              <p className="text-3xl font-black tracking-tight">{data.customers.value.toLocaleString()}</p>
              <GrowthBadge value={data.customers.growth} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">New accounts created</p>
          </div>
        </div>

        {/* BOTTOM ROW: STATUS BREAKDOWN */}
        <div className="pt-4">
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Status Breakdown</p>
           
           {Object.keys(data.statusBreakdown).length === 0 ? (
              <p className="text-xs text-slate-600 italic">No orders in this period.</p>
           ) : (
             <div className="flex flex-wrap gap-2">
                {Object.entries(data.statusBreakdown).map(([status, count]) => (
                   <div 
                     key={status} 
                     className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${getStatusColor(status)}`}
                   >
                      <span>{status}</span>
                      <span className="bg-white/10 px-1.5 rounded text-white">{count}</span>
                   </div>
                ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}