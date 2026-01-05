//app/(admin)/admin/analytics/_components/customer-insights-widget.tsx

"use client";

import { CustomerDemographic, CustomerTypeBreakdown, TopCustomerMetric } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Users, MapPin, Crown, UserPlus } from "lucide-react";

interface CustomerInsightsProps {
  demographics: CustomerDemographic[];
  retention: CustomerTypeBreakdown;
  topCustomers: TopCustomerMetric[];
}

export function CustomerInsightsWidget({ demographics, retention, topCustomers }: CustomerInsightsProps) {
  const { formatPrice } = useGlobalStore();

  const totalUsers = retention.newCustomers + retention.returningCustomers;
  const newPercent = totalUsers > 0 ? (retention.newCustomers / totalUsers) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-6">
       
       {/* 1. Retention Card */}
       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
             <UserPlus size={16} className="text-blue-600"/>
             Acquisition
          </h4>
          <div className="flex items-center gap-4">
             {/* Progress Circle (Simplified) */}
             <div className="relative w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-r-transparent rotate-45" style={{
                   clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)` // Visual hack, proper circle needs SVG
                }}></div>
                <span className="text-xs font-bold text-slate-700">{newPercent.toFixed(0)}%</span>
             </div>
             
             <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs">
                   <span className="text-slate-500">New</span>
                   <span className="font-bold text-slate-700">{retention.newCustomers}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full">
                   <div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${newPercent}%`}}></div>
                </div>
                
                <div className="flex justify-between text-xs">
                   <span className="text-slate-500">Returning</span>
                   <span className="font-bold text-slate-700">{retention.returningCustomers}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full">
                   <div className="bg-indigo-500 h-1.5 rounded-full" style={{width: `${100 - newPercent}%`}}></div>
                </div>
             </div>
          </div>
       </div>

       {/* 2. Top Locations */}
       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
             <MapPin size={16} className="text-red-500"/>
             Top Locations
          </h4>
          <div className="space-y-3">
             {demographics.slice(0, 5).map((loc, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                   <div className="flex items-center gap-2">
                      <span className="w-5 text-slate-400 font-mono">0{i+1}</span>
                      <span className="font-medium text-slate-700 truncate max-w-[100px]" title={`${loc.city}, ${loc.country}`}>
                         {loc.city}, {loc.country}
                      </span>
                   </div>
                   <span className="font-bold text-slate-800">{formatPrice(loc.revenue)}</span>
                </div>
             ))}
             {demographics.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No location data.</p>}
          </div>
       </div>

       {/* 3. VIP Customers */}
       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
             <Crown size={16} className="text-amber-500"/>
             Top Spenders (VIP)
          </h4>
          <div className="space-y-4">
             {topCustomers.map((cust, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                      {cust.name.charAt(0)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{cust.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{cust.email}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">{formatPrice(cust.totalSpent)}</p>
                      <p className="text-[10px] text-slate-400">{cust.orders} Orders</p>
                   </div>
                </div>
             ))}
             {topCustomers.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No customer data.</p>}
          </div>
       </div>

    </div>
  );
}