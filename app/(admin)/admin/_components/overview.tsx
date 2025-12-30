// File: app/admin/_components/overview.tsx

"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface OverviewProps {
  data: { name: string; total: number }[];
  currencySymbol: string; // 🚀 Receive dynamic symbol
}

export function Overview({ data, currencySymbol }: OverviewProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          stroke="#64748b" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#64748b" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          // 🚀 Use dynamic symbol
          tickFormatter={(value) => `${currencySymbol}${value}`} 
          width={80}
        />
        <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            // 🚀 Use dynamic symbol
            formatter={(value: number | undefined) => [
              `${currencySymbol}${value ?? 0}`, 
              "Total"
            ]}
        />
        <Bar 
            dataKey="total" 
            fill="#2563eb" 
            radius={[4, 4, 0, 0]} 
            barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}