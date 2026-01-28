//app/(storefront)/affiliates/_components/performance-chart.tsx

"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ChartData {
  date: string;
  earnings: number;
  clicks: number;
}

interface Props {
  data: ChartData[];
  currencySymbol: string;
}

export default function PerformanceChart({ data, currencySymbol }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
        Not enough data to display chart.
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/> {/* Indigo Color */}
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(val) => `${currencySymbol}${val}`}
          />
          
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#4338ca', fontWeight: 'bold' }}
            formatter={(value: any) => [`${currencySymbol}${value.toFixed(2)}`, 'Earnings']}
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          
          <Area 
            type="monotone" 
            dataKey="earnings" 
            stroke="#4f46e5" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorEarnings)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}