// File: app/admin/_components/overview.tsx

"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface OverviewProps {
  data: { name: string; total: number }[];
  currencySymbol: string; 
}

export function Overview({ data, currencySymbol }: OverviewProps) {
  return (
    // Responsive Container ensures it resizes perfectly on mobile
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e4e7" />
        <XAxis 
          dataKey="name" 
          stroke="#8c8f94" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#8c8f94" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${currencySymbol}${value}`} 
          width={80}
        />
        <Tooltip 
            cursor={{ fill: '#f6f7f7' }}
            contentStyle={{ 
              backgroundColor: '#1d2327', 
              color: '#ffffff',
              borderRadius: '3px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            }} 
            itemStyle={{ color: '#ffffff' }}
            formatter={(value: number | undefined) => [
              `${currencySymbol}${value ?? 0}`, 
              "Net Sales"
            ]}
        />
        {/* 🚀 WP Blue Color applied to Bars */}
        <Bar 
            dataKey="total" 
            fill="#2271b1" 
            radius={[2, 2, 0, 0]} 
            barSize={32}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}