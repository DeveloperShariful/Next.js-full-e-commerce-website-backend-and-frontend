//app/(admin)/admin/analytics/_components/sales-growth-chart.tsx

"use client";

import { SalesChartData } from "@/app/actions/admin/analytics/types";
import { useGlobalStore } from "@/app/providers/global-store-provider";
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from "recharts";

interface SalesGrowthChartProps {
  data: SalesChartData[];
}

export function SalesGrowthChart({ data }: SalesGrowthChartProps) {
  const { formatPrice } = useGlobalStore();

  // Custom Tooltip Component for professional look
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs min-w-[150px]">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-50 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-500 capitalize">{entry.name}:</span>
              </div>
              <span className="font-bold text-slate-700">
                {formatPrice(entry.value)}
              </span>
            </div>
          ))}
          {/* Manually accessing the 'orders' count from the payload data */}
           <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-50">
             <span className="text-slate-400">Total Orders:</span>
             <span className="font-bold text-slate-600">
               {payload[0]?.payload.orders || 0}
             </span>
           </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[400px] flex items-center justify-center">
        <p className="text-slate-400 text-sm">No sales data available for this period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-lg text-slate-800">Sales & Profit Trends</h3>
          <p className="text-xs text-slate-400 mt-1">Gross revenue compared to estimated profit over time.</p>
        </div>
        {/* Simple Legend/Indicator */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-600 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Net Profit</span>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
            
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 11, fill: '#94a3b8'}} 
              dy={10}
              minTickGap={30}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 11, fill: '#94a3b8'}} 
              width={60}
              tickFormatter={(value) => `$${value}`} // Simplified formatting for axis
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            
            <Area 
              type="monotone" 
              dataKey="revenue" 
              name="Revenue"
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            
            <Line 
              type="monotone" 
              dataKey="profit" 
              name="Profit"
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}