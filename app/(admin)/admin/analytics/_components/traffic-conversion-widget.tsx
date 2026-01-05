//app/(admin)/admin/analytics/_components/traffic-conversion-widget.tsx

"use client";

import { ConversionFunnelStep, MostViewedProduct } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { Eye, MousePointerClick, ShoppingCart, CheckCircle, ArrowDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TrafficWidgetProps {
  funnel: ConversionFunnelStep[];
  mostViewed: MostViewedProduct[];
}

export function TrafficConversionWidget({ funnel, mostViewed }: TrafficWidgetProps) {
  const { formatPrice } = useGlobalStore();

  // Funnel Colors
  const FUNNEL_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#10b981"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      
      {/* 1. CONVERSION FUNNEL */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
           <MousePointerClick size={18} className="text-blue-600"/>
           Conversion Funnel
        </h3>
        
        <div className="flex-1 space-y-6">
           {funnel.map((step, index) => (
             <div key={index} className="relative">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      {index === 0 && <Eye size={14} className="text-slate-400"/>}
                      {index === 1 && <MousePointerClick size={14} className="text-slate-400"/>}
                      {index === 2 && <ShoppingCart size={14} className="text-slate-400"/>}
                      {index === 3 && <CheckCircle size={14} className="text-slate-400"/>}
                      {step.step}
                   </span>
                   <span className="text-sm font-bold text-slate-800">{step.count.toLocaleString()}</span>
                </div>
                
                {/* Custom Progress Bar */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full rounded-full transition-all duration-1000"
                     style={{ 
                        width: `${index === 0 ? 100 : (step.count / funnel[0].count) * 100}%`,
                        backgroundColor: FUNNEL_COLORS[index]
                     }}
                   />
                </div>

                {/* Drop-off Arrow (except last item) */}
                {index < funnel.length - 1 && (
                   <div className="absolute right-0 -bottom-5 flex items-center text-[10px] text-red-500 font-medium">
                      <ArrowDown size={10} />
                      {Math.round(funnel[index+1].dropOffRate)}% drop-off
                   </div>
                )}
             </div>
           ))}
        </div>
        
        <div className="mt-8 pt-4 border-t border-slate-50">
           <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
              <span className="text-xs font-bold text-blue-700">Overall Conversion Rate</span>
              <span className="text-lg font-bold text-blue-700">
                {((funnel[3].count / (funnel[0].count || 1)) * 100).toFixed(2)}%
              </span>
           </div>
        </div>
      </div>

      {/* 2. MOST VIEWED PRODUCTS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
         <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
           <Eye size={18} className="text-indigo-600"/>
           Top Viewed Products
         </h3>
         
         <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="space-y-4">
               {mostViewed.map((prod, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                     <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                           {i + 1}
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-bold text-slate-700 truncate" title={prod.name}>{prod.name}</p>
                           <p className="text-[10px] text-slate-400">
                              Conv. Rate: <span className={prod.conversionRate > 2 ? "text-emerald-500 font-bold" : "text-slate-500"}>{prod.conversionRate.toFixed(1)}%</span>
                           </p>
                        </div>
                     </div>
                     <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                           <Eye size={10} className="text-slate-400"/> {prod.views}
                        </p>
                        <p className="text-[10px] text-slate-400">{prod.sales} Sold</p>
                     </div>
                  </div>
               ))}
               {mostViewed.length === 0 && <p className="text-slate-400 text-sm text-center py-10">No view data recorded.</p>}
            </div>
         </div>
      </div>

    </div>
  );
}