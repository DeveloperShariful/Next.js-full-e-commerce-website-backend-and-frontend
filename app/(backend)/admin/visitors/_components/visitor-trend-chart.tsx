//File: app/(backend)/admin/visitors/_components/visitor-trend-chart.tsx

"use client";

import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { formatNumber } from "@/app/actions/backend/analytics/shared.utils";
import type { VisitorDailyPoint } from "@/app/actions/backend/visitors/visitor-insights.actions";

interface Props {
  data: VisitorDailyPoint[];
}

const LINE_COLOR = "#007cba"; // বাকি admin panel-এর সাথে মেলানো WooCommerce blue

export default function VisitorTrendChart({ data }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const chartData = data.map((point) => ({
    dateLabel: format(parseISO(point.date), "MMM d"),
    count: point.count,
  }));

  return (
    <div className="border border-[#c3c4c7] shadow-sm rounded-sm overflow-hidden bg-white">
      <div className="p-4 border-b border-[#c3c4c7] bg-[#f8f9f9]">
        <span className="text-[13px] font-semibold text-[#1d2327] border-b-2 border-[#2271b1] pb-1">
          Daily Visitors
        </span>
      </div>
      <div className="p-4 h-[300px] w-full">
        {!isMounted ? (
          <div className="w-full h-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e4e7" />
              <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fill: "#646970", fontSize: 11 }} dy={10} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#646970", fontSize: 11 }}
                allowDecimals={false}
                tickFormatter={(val: string | number) => formatNumber(Number(val))}
              />
              <Tooltip
                formatter={(value: string | number | undefined) => (value === undefined ? ["", ""] : [formatNumber(Number(value)), "Visitors"])}
                contentStyle={{ borderRadius: "3px", borderColor: "#c3c4c7", fontSize: "13px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              />
              <Line
                name="Visitors"
                type="monotone"
                dataKey="count"
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: "white", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
