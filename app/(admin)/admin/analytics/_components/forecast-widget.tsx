//app/(admin)/admin/analytics/_components/forecast-widget.tsx

"use client";

import { SalesForecast } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Sparkles, Info } from "lucide-react";

interface ForecastWidgetProps {
  data: SalesForecast[];
}

export function ForecastWidget({ data }: ForecastWidgetProps) {
  const { formatPrice } = useGlobalStore();

  // Custom Tooltip for AI Data
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const predicted = payload.find((p: any) => p.dataKey === "predictedRevenue");
      const rangeHigh = payload.find((p: any) => p.dataKey === "upperBound");
      const rangeLow = payload.find((p: any) => p.dataKey === "lowerBound");

      return (
        <div className="bg-slate-900 text-white p-3 border border-slate-700 shadow-xl rounded-lg text-xs min-w-[180px]">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
             <Sparkles size={12} className="text-purple-400" />
             <p className="font-bold text-slate-200">Forecast for {label}</p>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Predicted:</span>
              <span className="font-bold text-purple-400 text-sm">
                {predicted ? formatPrice(predicted.value) : "N/A"}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500">
               <span>Likely Range:</span>
               <span>
                 {rangeLow ? formatPrice(rangeLow.value) : 0} - {rangeHigh ? formatPrice(rangeHigh.value) : 0}
               </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
      
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 p-4 opacity-5">
         <Sparkles size={100} />
      </div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Sparkles className="text-purple-600" size={18} />
            AI Sales Forecast
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Projection for the next 14 days based on historical trends.
          </p>
        </div>
        <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100 flex items-center gap-1">
           Beta Model
           <Info size={12} />
        </div>
      </div>

      <div className="h-[300px] w-full text-xs relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
            
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 11, fill: '#94a3b8'}} 
              dy={10}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 11, fill: '#94a3b8'}} 
              width={50}
              tickFormatter={(val) => `$${val}`}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
            
            {/* Confidence Interval (Area) */}
            {/* We draw the area between lowerBound and upperBound visually */}
            <Area 
              type="monotone" 
              dataKey="upperBound" 
              stroke="none" 
              fill="url(#colorUncertainty)" 
            />
            
            {/* The Main Prediction Line */}
            <Line 
              type="monotone" 
              dataKey="predictedRevenue" 
              stroke="#7c3aed" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: "white", stroke: "#7c3aed" }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
         <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-purple-600 rounded-full"></span>
            <span>Predicted Trend</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></span>
            <span>Confidence Range (±20%)</span>
         </div>
      </div>
    </div>
  );
}