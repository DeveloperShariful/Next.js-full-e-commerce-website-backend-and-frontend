//File: app/(backend)/admin/analytics/_components/analytics-chart.tsx

"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SerializedAnalytics, formatCurrency, formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import { format, parseISO } from "date-fns";

interface AnalyticsChartProps {
  currentPeriod: SerializedAnalytics[];
  previousPeriod: SerializedAnalytics[];
  metricKey: keyof SerializedAnalytics; 
  isCurrency: boolean;
  isComparing?: boolean;
  
  // 🔥 NEW: Props for WooCommerce Custom Legend
  metricLabel: string;
  currentTotal: number;
  previousTotal: number;
  currentDateLabel: string;
  previousDateLabel: string;
}

type IntervalType = "day" | "month";
type ChartType = "line" | "bar";

export default function AnalyticsChart({
  currentPeriod,
  previousPeriod,
  metricKey,
  isCurrency,
  isComparing = true,
  metricLabel,
  currentTotal,
  previousTotal,
  currentDateLabel,
  previousDateLabel
}: AnalyticsChartProps) {
  
  // States for interactive controls
  const [interval, setInterval] = useState<IntervalType>("day");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [showCurrent, setShowCurrent] = useState<boolean>(true);
  const [showPrevious, setShowPrevious] = useState<boolean>(true);

  // 🔥 DYNAMIC GROUPING LOGIC (By Day vs By Month)
  const chartData = useMemo(() => {
    if (interval === "day") {
      return currentPeriod.map((currentDay, index) => {
        const prevDay = previousPeriod[index];
        return {
          dateLabel: format(parseISO(currentDay.date), "MMM d"),
          currentValue: Number(currentDay[metricKey]) || 0,
          previousValue: isComparing && prevDay ? Number(prevDay[metricKey]) || 0 : 0,
        };
      });
    }

    // Group By Month Logic
    const groupedMap: Record<string, { currentValue: number; previousValue: number }> = {};
    
    currentPeriod.forEach((currentDay, index) => {
      const prevDay = previousPeriod[index];
      const monthLabel = format(parseISO(currentDay.date), "MMM yyyy");
      
      if (!groupedMap[monthLabel]) {
        groupedMap[monthLabel] = { currentValue: 0, previousValue: 0 };
      }
      
      groupedMap[monthLabel].currentValue += Number(currentDay[metricKey]) || 0;
      if (isComparing && prevDay) {
        groupedMap[monthLabel].previousValue += Number(prevDay[metricKey]) || 0;
      }
    });

    return Object.keys(groupedMap).map(key => ({
      dateLabel: key,
      currentValue: groupedMap[key].currentValue,
      previousValue: groupedMap[key].previousValue
    }));

  }, [currentPeriod, previousPeriod, metricKey, isComparing, interval]);

  const customFormatter = (value: number) => {
    return isCurrency ? formatCurrency(value) : formatNumber(value);
  };

  // WooCommerce Colors
  const currentColor = "#007cba"; // WC Dark Blue
  const previousColor = "#11a0d2"; // WC Light Teal/Blue

  return (
    <div className="bg-white flex flex-col w-full h-full">
      
      {/* 🔥 WooCommerce Custom Legend & Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-[#c3c4c7] bg-[#f8f9f9] gap-4 md:gap-0">
        
        {/* Left: Custom Checkbox Legends */}
        <div className="flex flex-wrap items-center gap-6">
           <div className="text-[13px] font-semibold text-[#1d2327] border-b-2 border-[#2271b1] pb-1">
             {metricLabel}
           </div>

           <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[#3c434a]">
             <input 
               type="checkbox" 
               checked={showCurrent} 
               onChange={() => setShowCurrent(!showCurrent)}
               className="w-[14px] h-[14px] rounded-sm text-[#007cba] focus:ring-0 border-gray-400 cursor-pointer" 
               style={{ accentColor: currentColor }} // Custom checkbox color
             />
             <span>{currentDateLabel}</span>
             <span className="font-semibold text-[#1d2327] ml-1">{customFormatter(currentTotal)}</span>
           </label>

           {isComparing && (
             <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[#3c434a]">
               <input 
                 type="checkbox" 
                 checked={showPrevious} 
                 onChange={() => setShowPrevious(!showPrevious)}
                 className="w-[14px] h-[14px] rounded-sm text-[#11a0d2] focus:ring-0 border-gray-400 cursor-pointer"
                 style={{ accentColor: previousColor }}
               />
               <span>{previousDateLabel}</span>
               <span className="font-semibold text-[#1d2327] ml-1">{customFormatter(previousTotal)}</span>
             </label>
           )}
        </div>

        {/* Right: Interval & Chart Type Toggles */}
        <div className="flex items-center gap-3">
           <select 
             value={interval}
             onChange={(e) => setInterval(e.target.value as IntervalType)}
             className="border border-[#8c8f94] bg-white h-[30px] px-2 py-0 text-[13px] text-[#32373c] focus:border-[#2271b1] outline-none shadow-sm rounded-sm"
           >
             <option value="day">By day</option>
             <option value="month">By month</option>
           </select>

           <div className="flex border border-[#8c8f94] rounded-[3px] overflow-hidden shadow-sm h-[30px]">
             <button 
               onClick={() => setChartType("line")}
               className={`px-2.5 flex items-center justify-center transition-colors ${chartType === "line" ? "bg-[#f0f0f1] text-[#2c3338]" : "bg-white text-[#8c8f94] hover:text-[#2c3338]"}`}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
             </button>
             <div className="w-[1px] bg-[#8c8f94]"></div>
             <button 
               onClick={() => setChartType("bar")}
               className={`px-2.5 flex items-center justify-center transition-colors ${chartType === "bar" ? "bg-[#f0f0f1] text-[#2c3338]" : "bg-white text-[#8c8f94] hover:text-[#2c3338]"}`}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </button>
           </div>
        </div>
      </div>

      {/* 🔥 Chart Body Area */}
      <div className="p-4 h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e4e7" />
              <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fill: "#646970", fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#646970", fontSize: 11 }} tickFormatter={(val: string | number) => customFormatter(Number(val))} />
              <Tooltip formatter={(value: string | number | undefined) => value === undefined ? ["", ""] : [customFormatter(Number(value)), ""]} contentStyle={{ borderRadius: '3px', borderColor: '#c3c4c7', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} />
              
              {/* 🔥 FIXED: Permanent Dots on Lines */}
              {isComparing && showPrevious && (
                <Line name="Previous period" type="monotone" dataKey="previousValue" stroke={previousColor} strokeWidth={2} dot={{ r: 3, fill: 'white', strokeWidth: 2 }} activeDot={{ r: 5 }} />
              )}
              {showCurrent && (
                <Line name="Selected period" type="monotone" dataKey="currentValue" stroke={currentColor} strokeWidth={2} dot={{ r: 3, fill: 'white', strokeWidth: 2 }} activeDot={{ r: 5 }} />
              )}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e4e7" />
              <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fill: "#646970", fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#646970", fontSize: 11 }} tickFormatter={(val: string | number) => customFormatter(Number(val))} />
              <Tooltip formatter={(value: string | number | undefined) => value === undefined ? ["", ""] : [customFormatter(Number(value)), ""]} contentStyle={{ borderRadius: '3px', borderColor: '#c3c4c7', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} cursor={{ fill: '#f0f0f1' }} />
              
              {isComparing && showPrevious && (
                <Bar name="Previous period" dataKey="previousValue" fill={previousColor} radius={[2, 2, 0, 0]} />
              )}
              {showCurrent && (
                <Bar name="Selected period" dataKey="currentValue" fill={currentColor} radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}