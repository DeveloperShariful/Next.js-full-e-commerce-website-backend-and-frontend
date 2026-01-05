//app/(admin)/admin/analytics/_components/operations-widget.tsx

"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { CartMetrics } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { ShoppingCart, CheckCircle2, XCircle } from "lucide-react";

interface OperationsWidgetProps {
  statusData: { status: string; count: number }[];
  cartMetrics: CartMetrics;
}

// Colors for Order Statuses
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",    // Amber
  PROCESSING: "#3b82f6", // Blue
  DELIVERED: "#10b981",  // Emerald
  CANCELLED: "#ef4444",  // Red
  REFUNDED: "#64748b",   // Slate
};
const DEFAULT_COLOR = "#cbd5e1";

export function OperationsWidget({ statusData, cartMetrics }: OperationsWidgetProps) {
  const { formatPrice } = useGlobalStore();

  // Prepare Pie Data
  const pieData = statusData.map(d => ({
    name: d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || DEFAULT_COLOR
  })).filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 gap-6">
      
      {/* 1. Abandoned Cart Recovery Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
          <ShoppingCart size={16} className="text-purple-600"/>
          Cart Recovery Health
        </h4>
        
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-2xl font-bold text-slate-800">
              {cartMetrics.recoveryRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 ml-2">Recovery Rate</span>
          </div>
          <div className="text-right">
             <p className="text-xs font-bold text-emerald-600">
               +{formatPrice(cartMetrics.totalRecoveredRevenue)}
             </p>
             <p className="text-[10px] text-slate-400">Recovered Revenue</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
          <div 
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-1000" 
            style={{ width: `${Math.min(cartMetrics.recoveryRate, 100)}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
           <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
              <XCircle size={14} className="text-red-400"/>
              <div>
                 <p className="font-bold text-slate-700">{cartMetrics.abandonedCount}</p>
                 <p className="text-slate-400">Abandoned</p>
              </div>
           </div>
           <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400"/>
              <div>
                 <p className="font-bold text-slate-700">{cartMetrics.recoveredCount}</p>
                 <p className="text-slate-400">Recovered</p>
              </div>
           </div>
        </div>
      </div>

      {/* 2. Order Status Distribution Pie Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[320px]">
         <h4 className="font-bold text-sm text-slate-800 mb-2">Order Status Breakdown</h4>
         
         {pieData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              No orders to display
            </div>
         ) : (
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                   ))}
                 </Pie>
                 <RechartsTooltip 
                    contentStyle={{borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                 />
                 <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconSize={8}
                    wrapperStyle={{fontSize: '11px', color: '#64748b'}}
                 />
               </PieChart>
             </ResponsiveContainer>
           </div>
         )}
      </div>

    </div>
  );
}